import { SupabaseClient } from '@supabase/supabase-js';

export type DedupKeyDef = {
  fields: string[];
  label: string;
};

export type DuplicateInfo = {
  row: number;
  reason: string;
  existingId?: string;
  keyValues: Record<string, unknown>;
};

export type DedupResult = {
  unique: Record<string, unknown>[];
  duplicates: DuplicateInfo[];
};

/** 各实体的去重键配置 */
export const ENTITY_DEDUP_KEYS: Record<string, DedupKeyDef[]> = {
  customers: [
    { fields: ['code'], label: '客户编码' },
    { fields: ['name'], label: '客户名称' },
  ],
  products: [
    { fields: ['code'], label: '商品编码' },
    { fields: ['name', 'spec'], label: '商品名称+型号' },
  ],
  shippers: [
    { fields: ['code'], label: '发货方编码' },
    { fields: ['name'], label: '发货方名称' },
  ],
  users: [
    { fields: ['username'], label: '用户名' },
    { fields: ['email'], label: '邮箱' },
  ],
  product_mappings: [
    { fields: ['customer_id', 'customer_product_name'], label: '客户+商品名称' },
    { fields: ['customer_id', 'customer_sku'], label: '客户+商品编码' },
    { fields: ['supplier_id', 'customer_product_name'], label: '发货方+商品名称' },
    { fields: ['supplier_id', 'customer_sku'], label: '发货方+商品编码' },
  ],
};

function buildKeyString(
  row: Record<string, unknown>,
  keyDef: DedupKeyDef
): string | null {
  const values = keyDef.fields.map((f) => {
    const v = row[f];
    if (v === undefined || v === null || v === '') return null;
    return String(v).toLowerCase().trim();
  });
  if (values.some((v) => v === null)) return null;
  return `${keyDef.fields.join('+')}:${values.join('||')}`;
}

function buildSingleFieldQuery(
  client: SupabaseClient,
  table: string,
  field: string,
  values: string[]
) {
  const uniqueValues = [...new Set(values.map((v) => String(v).trim()).filter(Boolean))];
  if (uniqueValues.length === 0) return null;
  return client.from(table).select('*').in(field, uniqueValues);
}

async function buildCompositeQuery(
  client: SupabaseClient,
  table: string,
  keyDef: DedupKeyDef,
  rows: Record<string, unknown>[]
) {
  // 对复合键，分别查询每个字段的候选值，在内存中比对
  const allResults: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const field of keyDef.fields) {
    const values = rows
      .map((r) => r[field])
      .filter((v) => v !== undefined && v !== null && v !== '')
      .map((v) => String(v).trim());
    const uniqueValues = [...new Set(values)];

    if (uniqueValues.length === 0) continue;

    // 分批查询，每批最多 200 个值
    for (let i = 0; i < uniqueValues.length; i += 200) {
      const batch = uniqueValues.slice(i, i + 200);
      const { data } = await client.from(table).select('*').in(field, batch);
      if (data) {
        for (const record of data) {
          const id = record.id as string;
          if (!seen.has(id)) {
            seen.add(id);
            allResults.push(record);
          }
        }
      }
    }
  }

  return allResults;
}

/**
 * 检测导入数据中与数据库已有记录重复的行。
 * 任一去重键匹配即判定为重复。
 */
export async function detectDuplicates(params: {
  client: SupabaseClient;
  table: string;
  keys: DedupKeyDef[];
  rows: Record<string, unknown>[];
  dataStartRow?: number;
}): Promise<DedupResult> {
  const { client, table, keys, rows, dataStartRow = 1 } = params;

  if (rows.length === 0) {
    return { unique: [], duplicates: [] };
  }

  // 收集每个去重键的候选记录
  const keyRecordsMap = new Map<string, Map<string, Record<string, unknown>>>();

  for (const keyDef of keys) {
    const keyMap = new Map<string, Record<string, unknown>>();

    if (keyDef.fields.length === 1) {
      // 单字段键：批量 IN 查询
      const values = rows
        .map((r) => r[keyDef.fields[0]])
        .filter((v) => v !== undefined && v !== null && v !== '')
        .map((v) => String(v).trim());
      const uniqueValues = [...new Set(values)];

      if (uniqueValues.length > 0) {
        const query = buildSingleFieldQuery(client, table, keyDef.fields[0], uniqueValues);
        if (query) {
          const { data } = await query;
          if (data) {
            for (const record of data) {
              const key = buildKeyString(record, keyDef);
              if (key) keyMap.set(key, record);
            }
          }
        }
      }
    } else {
      // 复合字段键：分批查询各字段，内存中构建复合键
      const candidates = await buildCompositeQuery(client, table, keyDef, rows);
      for (const record of candidates) {
        const key = buildKeyString(record, keyDef);
        if (key) keyMap.set(key, record);
      }
    }

    keyRecordsMap.set(keyDef.fields.join('+'), keyMap);
  }

  // 逐行检测重复
  const unique: Record<string, unknown>[] = [];
  const duplicates: DuplicateInfo[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let isDup = false;
    let dupReason = '';
    let dupExistingId: string | undefined;
    let dupKeyValues: Record<string, unknown> = {};

    for (const keyDef of keys) {
      const rowKey = buildKeyString(row, keyDef);
      if (!rowKey) continue;

      const keyMap = keyRecordsMap.get(keyDef.fields.join('+'));
      const existing = keyMap?.get(rowKey);

      if (existing) {
        isDup = true;
        const displayValues = keyDef.fields
          .map((f) => `${keyDef.label.split('+')[keyDef.fields.indexOf(f)] || f}: "${row[f]}"`)
          .join('，');
        dupReason = `${keyDef.label} ${displayValues} 已存在`;
        dupExistingId = existing.id as string;
        dupKeyValues = {};
        for (const f of keyDef.fields) {
          dupKeyValues[f] = row[f];
        }
        break;
      }
    }

    if (isDup) {
      duplicates.push({
        row: dataStartRow + i,
        reason: dupReason,
        existingId: dupExistingId,
        keyValues: dupKeyValues,
      });
    } else {
      unique.push(row);
    }
  }

  return { unique, duplicates };
}

/**
 * 生成重复记录 CSV 字符串。
 * @param duplicates 重复行数据
 * @param columns CSV 列名（中文表头）
 */
export function generateDuplicateCSV(
  duplicates: DuplicateInfo[],
  columns: string[]
): string {
  const header = [...columns, '重复原因', '行号'].join(',');
  const body = duplicates
    .map((d) => {
      const rowValues = columns.map((col) => {
        const v = d.keyValues[col];
        if (v === undefined || v === null) return '';
        const str = String(v);
        return str.includes(',') ? `"${str}"` : str;
      });
      return [...rowValues, `"${d.reason}"`, String(d.row)].join(',');
    })
    .join('\n');

  return `﻿${header}\n${body}`;
}
