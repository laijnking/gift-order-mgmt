import type { SupabaseClient } from '@supabase/supabase-js';

export type TemplateBusinessType = 'shipping' | 'customer_feedback' | 'common' | 'kingdee';
export type TemplateTargetType = 'customer' | 'supplier';

/** DB row shape — mirrors templates table (snake_case, nullable columns) */
export type TemplateRecord = {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  type: string | null;
  config: Record<string, unknown> | null;
  is_default: boolean | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  // non-standard columns (exist in DB)
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  field_mappings: Record<string, string> | string | null | Array<{ excelColumn: string; systemField: string }>;
};

export function normalizeTemplateType(type?: string | null): TemplateBusinessType {
  switch ((type || '').trim().toLowerCase()) {
    case 'supplier':
    case 'dispatch':
    case 'shipping':
      return 'shipping';
    case 'customer':
    case 'feedback':
    case 'customer_feedback':
      return 'customer_feedback';
    case 'kingdee':
    case 'kingdee_export':
      return 'kingdee';
    default:
      return 'common';
  }
}

// 兼容旧数据的 snake_case → camelCase 映射
const LEGACY_TO_CAMEL: Record<string, string> = {
  'order_no': 'orderNo',
  'customer_order_no': 'customerOrderNo',
  'supplier_order_no': 'supplierOrderNo',
  'customer_code': 'customerCode',
  'customer_name': 'customerName',
  'supplier_name': 'supplierName',
  'product_name': 'productName',
  'product_code': 'productCode',
  'product_spec': 'productSpec',
  'receiver_name': 'receiverName',
  'receiver_phone': 'receiverPhone',
  'receiver_address': 'receiverAddress',
  'express_company': 'expressCompany',
  'tracking_no': 'trackingNo',
  'salesperson': 'salesperson',
  'operator': 'operator',
  'remark': 'remark',
  'quantity': 'quantity',
  'price': 'price',
  'amount': 'amount',
  'warehouse': 'warehouse',
  // 别名兼容
  'sys_order_no': 'sysOrderNo',
  'match_code': 'matchCode',
  'dispatch_batch': 'dispatchBatch',
  'unit_cost': 'unitCost',
  'warehouse_name': 'warehouseName',
  'created_at': 'createdAt',
};

export function migrateFieldMappings(mappings: Record<string, string>): Record<string, string> {
  const migrated: Record<string, string> = {};
  for (const [k, v] of Object.entries(mappings)) {
    migrated[k] = LEGACY_TO_CAMEL[v] ?? v;
  }
  return migrated;
}

// 解析 field_mappings 并返回有序数组（保持用户设置的列顺序）
export function parseTemplateFieldMappingsArray(record: TemplateRecord): Array<{ excelColumn: string; systemField: string }> {
  let raw: Record<string, string> | string | null | Array<{ excelColumn: string; systemField: string }> = record.field_mappings;

  // 如果是字符串，尝试解析为 JSON
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }

  // 如果是数组格式，直接返回（JSON 数组本身保持顺序）
  if (Array.isArray(raw)) {
    return raw.map(item => ({
      excelColumn: item.excelColumn || '',
      systemField: LEGACY_TO_CAMEL[item.systemField] ?? (item.systemField || ''),
    }));
  }

  // 如果是对象格式，转换为数组（顺序可能丢失，这是旧数据的已知问题）
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, string>).map(([excelColumn, systemField]) => ({
      excelColumn,
      systemField: LEGACY_TO_CAMEL[systemField] ?? systemField,
    }));
  }

  // 尝试从 config.fieldMappings 获取
  const config = record.config || {};
  const configMappings = config.fieldMappings;
  if (configMappings && typeof configMappings === 'object') {
    if (Array.isArray(configMappings)) {
      return configMappings.map(item => ({
        excelColumn: item.excelColumn || '',
        systemField: LEGACY_TO_CAMEL[item.systemField] ?? (item.systemField || ''),
      }));
    }
    return Object.entries(configMappings as Record<string, string>).map(([excelColumn, systemField]) => ({
      excelColumn,
      systemField: LEGACY_TO_CAMEL[systemField] ?? systemField,
    }));
  }

  return [];
}

// 保留原有的 parseTemplateFieldMappings 函数（返回对象格式，用于兼容）
export function parseTemplateFieldMappings(record: TemplateRecord): Record<string, string> {
  const arr = parseTemplateFieldMappingsArray(record);
  const result: Record<string, string> = {};
  for (const item of arr) {
    result[item.excelColumn] = item.systemField;
  }
  return result;
}

export function transformTemplateRecord(record: TemplateRecord) {
  return {
    id: record.id,
    code: record.code || '',
    name: record.name || '',
    description: record.description || '',
    type: normalizeTemplateType(record.type),
    targetType: record.target_type || '',
    targetId: record.target_id || '',
    targetName: record.target_name || '',
    fieldMappings: parseTemplateFieldMappings(record),
    config: record.config || {},
    isDefault: record.is_default ?? false,
    isActive: record.is_active ?? true,
    createdAt: record.created_at || '',
    updatedAt: record.updated_at || '',
  };
}

export async function syncTemplateTargetLink(
  client: SupabaseClient,
  options: {
    templateId: string;
    targetType?: string | null;
    targetId?: string | null;
    targetName?: string | null;
  }
) {
  await client.from('template_links').delete().eq('template_id', options.templateId);

  if (!options.targetType || !options.targetId) {
    return;
  }

  await client.from('template_links').insert({
    template_id: options.templateId,
    link_type: options.targetType,
    partner_id: options.targetId,
    partner_name: options.targetName || null,
  });
}

export async function resolvePreferredTemplate(
  client: SupabaseClient,
  options: {
    type: string;
    targetType?: string | null;
    targetId?: string | null;
    targetName?: string | null;
    tenantId?: string;
  }
) {
  const normalizedType = normalizeTemplateType(options.type);
  const targetType = options.targetType || null;
  const targetId = options.targetId || null;
  const targetName = options.targetName || null;
  const tenantId = options.tenantId;

  if (targetId && targetType) {
    let directQuery = client
      .from('templates')
      .select('*')
      .eq('type', normalizedType)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1);
    if (tenantId) directQuery = directQuery.eq('tenant_id', tenantId);
    const { data: directTargetTemplate } = await directQuery.maybeSingle();

    if (directTargetTemplate) {
      return {
        template: directTargetTemplate as TemplateRecord,
        source: 'target',
      };
    }
  }

  // 按 ID 查 template_links
  if (targetId) {
    const { data: links } = await client
      .from('template_links')
      .select('template_id')
      .eq('link_type', targetType || 'supplier')
      .eq('partner_id', targetId);

    const templateIds = links?.map((link) => link.template_id).filter(Boolean) || [];
    if (templateIds.length > 0) {
      let linkedQuery = client
        .from('templates')
        .select('*')
        .in('id', templateIds)
        .eq('type', normalizedType)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1);
      if (tenantId) linkedQuery = linkedQuery.eq('tenant_id', tenantId);
      const { data: linkedTemplate } = await linkedQuery.maybeSingle();

      if (linkedTemplate) {
        return {
          template: linkedTemplate as TemplateRecord,
          source: 'linked',
        };
      }
    }
  }

  // 按名称查 template_links（支持虚拟发货方）
  if (targetName) {
    const { data: linksByName } = await client
      .from('template_links')
      .select('template_id')
      .eq('link_type', 'supplier')
      .eq('partner_name', targetName);

    const templateIdsByName = linksByName?.map((link) => link.template_id).filter(Boolean) || [];
    if (templateIdsByName.length > 0) {
      let nameQuery = client
        .from('templates')
        .select('*')
        .in('id', templateIdsByName)
        .eq('type', normalizedType)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1);
      if (tenantId) nameQuery = nameQuery.eq('tenant_id', tenantId);
      const { data: templateByName } = await nameQuery.maybeSingle();

      if (templateByName) {
        return {
          template: templateByName as TemplateRecord,
          source: 'linked',
        };
      }
    }
  }

  let defaultQuery = client
    .from('templates')
    .select('*')
    .eq('type', normalizedType)
    .eq('is_default', true)
    .eq('is_active', true)
    .limit(1);
  if (tenantId) defaultQuery = defaultQuery.eq('tenant_id', tenantId);
  const { data: defaultTemplate } = await defaultQuery.maybeSingle();

  if (defaultTemplate) {
    return {
      template: defaultTemplate as TemplateRecord,
      source: 'default',
    };
  }

  let firstQuery = client
    .from('templates')
    .select('*')
    .eq('type', normalizedType)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (tenantId) firstQuery = firstQuery.eq('tenant_id', tenantId);
  const { data: firstTemplate } = await firstQuery.maybeSingle();

  return {
    template: (firstTemplate as TemplateRecord | null) || null,
    source: 'first',
  };
}
