import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

type MatchType = 'code' | 'spec' | 'name' | 'none';

interface NormalizedStockRow {
  supplierCode: string;
  supplierName: string;
  productName: string;
  productCode: string;
  productSpec: string;
  quantity: number;
  unitPrice: number;
  warehouseName: string;
  remark: string;
}

interface ProductMatch {
  productId: string;
  productCode: string;
  productName: string;
  matchType: MatchType;
  matchHint: string;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pick(row: Record<string, unknown>, names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function normalizeRows(rawRows: Record<string, unknown>[]): NormalizedStockRow[] {
  return rawRows
    .map((row) => ({
      supplierCode: pick(row, ['supplierCode', 'supplier_code', '供应商编码', '供应商代码', '发货方编码']),
      supplierName: pick(row, ['supplierName', 'supplier_name', '供应商名称', '供应商', '供货商', '发货方名称']),
      productName: pick(row, ['productName', 'product_name', '商品名称', '品名', '商品', '货品名称']),
      productCode: pick(row, ['productCode', 'product_code', '商品编码', 'SKU', 'sku', '货号', '商品代码']),
      productSpec: pick(row, ['spec', 'productSpec', 'product_spec', '规格', '规格型号', '型号规格', '型号']),
      quantity: toNumber(pick(row, ['quantity', '库存', '数量', '库存数量', '可用库存'])),
      unitPrice: toNumber(pick(row, ['unitPrice', 'unit_price', 'price', '单价', '价格', '采购价', '成本价'])),
      warehouseName: pick(row, ['warehouseName', 'warehouse_name', 'warehouse', '仓库', '仓库名称']),
      remark: pick(row, ['remark', '备注', '说明']),
    }))
    .filter((row) => row.productName || row.productCode || row.productSpec);
}

async function parseRequestRows(request: NextRequest): Promise<NormalizedStockRow[]> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      throw new Error('请上传库存文件');
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: false }) as Record<string, unknown>[];
    return normalizeRows(rows);
  }

  const body = await request.json();
  const rows = Array.isArray(body) ? body : (body.data || body.rows || []);
  return normalizeRows(rows);
}

async function findSupplier(
  client: ReturnType<typeof getSupabaseClient>,
  row: NormalizedStockRow
): Promise<{ id: string; name: string } | null> {
  if (row.supplierCode) {
    const { data } = await client
      .from('suppliers')
      .select('id, name')
      .eq('id', row.supplierCode)
      .eq('is_active', true)
      .maybeSingle();
    if (data) return { id: data.id as string, name: data.name as string };
  }

  if (row.supplierName) {
    const { data } = await client
      .from('suppliers')
      .select('id, name')
      .ilike('name', `%${row.supplierName}%`)
      .eq('is_active', true)
      .limit(1);
    if (data?.[0]) return { id: data[0].id as string, name: data[0].name as string };
  }

  return null;
}

async function matchProduct(
  client: ReturnType<typeof getSupabaseClient>,
  row: NormalizedStockRow
): Promise<ProductMatch> {
  if (row.productCode) {
    const { data } = await client
      .from('products')
      .select('id, code, name')
      .eq('code', row.productCode)
      .eq('is_active', true)
      .limit(1);
    if (data?.[0]) {
      return {
        productId: data[0].id as string,
        productCode: data[0].code as string,
        productName: data[0].name as string,
        matchType: 'code',
        matchHint: `按商品编码匹配：${row.productCode}`,
      };
    }
  }

  if (row.productSpec) {
    const { data } = await client
      .from('products')
      .select('id, code, name')
      .eq('spec', row.productSpec)
      .eq('is_active', true)
      .limit(1);
    if (data?.[0]) {
      return {
        productId: data[0].id as string,
        productCode: data[0].code as string,
        productName: data[0].name as string,
        matchType: 'spec',
        matchHint: `按规格型号匹配：${row.productSpec}`,
      };
    }
  }

  if (row.productName) {
    const { data } = await client
      .from('products')
      .select('id, code, name')
      .ilike('name', `%${row.productName}%`)
      .eq('is_active', true)
      .limit(1);
    if (data?.[0]) {
      return {
        productId: data[0].id as string,
        productCode: data[0].code as string,
        productName: data[0].name as string,
        matchType: 'name',
        matchHint: `按商品名称模糊匹配：${row.productName}`,
      };
    }
  }

  const generatedCode = (row.productCode || row.productSpec || `AUTO-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 6)}`).slice(0, 50);
  const generatedName = row.productName || row.productSpec || generatedCode;
  const { data, error } = await client
    .from('products')
    .insert({
      id: crypto.randomUUID(),
      code: generatedCode,
      name: generatedName,
      spec: row.productSpec || row.productCode || null,
      cost_price: row.unitPrice || 0,
      lifecycle_status: '在售',
      is_active: true,
      remark: '库存导入时自动创建的商品档案',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, code, name')
    .single();

  if (error) {
    throw new Error(`自动创建商品档案失败: ${error.message}`);
  }

  return {
    productId: data.id as string,
    productCode: data.code as string,
    productName: data.name as string,
    matchType: 'none',
    matchHint: `未匹配到商品档案，已自动创建：${generatedName}`,
  };
}

async function findWarehouseId(
  client: ReturnType<typeof getSupabaseClient>,
  warehouseName: string
): Promise<string | null> {
  if (!warehouseName) return null;
  const { data } = await client
    .from('warehouses')
    .select('id')
    .ilike('name', `%${warehouseName}%`)
    .limit(1);
  return (data?.[0]?.id as string) || null;
}

async function recordStockVersion(
  client: ReturnType<typeof getSupabaseClient>,
  payload: {
    stockId: string;
    productCode: string;
    productName: string;
    supplierId: string;
    supplierName: string;
    warehouseId: string | null;
    warehouseName: string;
    beforeQuantity: number;
    afterQuantity: number;
    beforePrice: number;
    afterPrice: number;
    reason: string;
  }
) {
  await client.from('stock_versions').insert({
    stock_id: payload.stockId,
    product_code: payload.productCode,
    product_name: payload.productName,
    supplier_id: payload.supplierId,
    supplier_name: payload.supplierName,
    warehouse_id: payload.warehouseId,
    warehouse_name: payload.warehouseName || null,
    before_quantity: payload.beforeQuantity,
    after_quantity: payload.afterQuantity,
    change_quantity: payload.afterQuantity - payload.beforeQuantity,
    before_price: payload.beforePrice,
    after_price: payload.afterPrice,
    change_price: payload.afterPrice - payload.beforePrice,
    change_type: 'import',
    change_reason: payload.reason,
    operator: 'system',
  });
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const rows = await parseRequestRows(request);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '没有有效的库存数据' }, { status: 400 });
    }

    const stats = { inserted: 0, updated: 0, matched: 0, unmatched: 0 };
    const supplierNotFound: string[] = [];
    const errors: string[] = [];

    for (const row of rows) {
      const supplier = await findSupplier(client, row);
      if (!supplier) {
        const key = row.supplierCode || row.supplierName || '未知供应商';
        if (!supplierNotFound.includes(key)) supplierNotFound.push(key);
        continue;
      }

      const product = await matchProduct(client, row);
      if (product.productId) stats.matched += 1;
      else stats.unmatched += 1;

      const warehouseId = await findWarehouseId(client, row.warehouseName);
      const stockIdentity = { column: 'product_id', value: product.productId };

      const existingQuery = client
        .from('stocks')
        .select('*')
        .eq('supplier_id', supplier.id)
        .eq(stockIdentity.column, stockIdentity.value);

      const { data: existing } = await existingQuery.maybeSingle();

      const stockData = {
        product_id: product.productId,
        product_code: product.productCode || row.productCode || null,
        product_name: product.productName || row.productName,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        warehouse_id: warehouseId,
        warehouse_name: row.warehouseName || null,
        quantity: row.quantity,
        reserved_quantity: 0,
        unit_price: row.unitPrice,
        min_stock: 2,
        status: 'active',
        remark: [row.remark, product.matchHint].filter(Boolean).join('；'),
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const beforeQuantity = Number(existing.quantity || 0);
        const beforePrice = Number(existing.unit_price || 0);
        const { error } = await client
          .from('stocks')
          .update(stockData)
          .eq('id', existing.id);
        if (error) {
          errors.push(`${row.productName || row.productCode}: ${error.message}`);
          continue;
        }

        await recordStockVersion(client, {
          stockId: existing.id as string,
          productCode: stockData.product_code || '',
          productName: stockData.product_name || '',
          supplierId: supplier.id,
          supplierName: supplier.name,
          warehouseId,
          warehouseName: row.warehouseName,
          beforeQuantity,
          afterQuantity: row.quantity,
          beforePrice,
          afterPrice: row.unitPrice,
          reason: '库存导入更新',
        });
        stats.updated += 1;
      } else {
        const id = crypto.randomUUID();
        const { error } = await client
          .from('stocks')
          .insert({ id, ...stockData, created_at: new Date().toISOString() });
        if (error) {
          errors.push(`${row.productName || row.productCode}: ${error.message}`);
          continue;
        }

        await recordStockVersion(client, {
          stockId: id,
          productCode: stockData.product_code || '',
          productName: stockData.product_name || '',
          supplierId: supplier.id,
          supplierName: supplier.name,
          warehouseId,
          warehouseName: row.warehouseName,
          beforeQuantity: 0,
          afterQuantity: row.quantity,
          beforePrice: 0,
          afterPrice: row.unitPrice,
          reason: '库存导入新增',
        });
        stats.inserted += 1;
      }
    }

    const total = stats.inserted + stats.updated;
    return NextResponse.json({
      success: errors.length === 0,
      data: { ...stats, total },
      supplierNotFound,
      errors,
      message: `库存导入完成：新增 ${stats.inserted} 条，更新 ${stats.updated} 条，匹配商品 ${stats.matched} 条，未匹配 ${stats.unmatched} 条`,
    }, { status: errors.length > 0 && total === 0 ? 500 : 200 });
  } catch (error) {
    console.error('供应商库存导入失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '导入失败',
    }, { status: 500 });
  }
}
