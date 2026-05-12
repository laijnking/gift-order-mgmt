import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

type MatchType = 'mapping' | 'code' | 'spec' | 'name' | 'none';

interface NormalizedStockRow {
  supplierCode: string;
  supplierName: string;
  productName: string;
  productCode: string;
  productSpec: string;
  // 新增：发货方商品信息（来自Excel）
  supplierProductCode: string;
  supplierProductName: string;
  supplierProductSpec: string;
  quantity: number;
  unitPrice: number;
  warehouseName: string;
  remark: string;
}

interface ProductMatch {
  productId: string | null;
  productCode: string;
  productName: string;
  matchType: MatchType;
  matchHint: string;
}

interface SkippedRow {
  supplierCode: string;
  supplierName: string;
  productName: string;
  productCode: string;
  productSpec: string;
  reason: string;
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
      supplierCode: pick(row, ['supplierCode', 'supplier_code', '发货方编码', '发货方代码']),
      supplierName: pick(row, ['supplierName', 'supplier_name', '发货方名称', '发货方', '供货商']),
      productName: pick(row, ['productName', 'product_name', '商品名称', '品名', '商品', '货品名称']),
      productCode: pick(row, ['productCode', 'product_code', '商品编码', 'SKU', 'sku', '货号', '商品代码']),
      productSpec: pick(row, ['spec', 'productSpec', 'product_spec', '规格', '规格型号', '型号规格', '型号']),
      // 新增：发货方商品信息
      supplierProductCode: pick(row, ['supplierProductCode', 'supplier_product_code', '发货方商品编码', '发货方SKU', '商品编码', 'SKU']),
      supplierProductName: pick(row, ['supplierProductName', 'supplier_product_name', '发货方商品名称', '发货方品名']),
      supplierProductSpec: pick(row, ['supplierProductSpec', 'supplier_product_spec', '发货方规格', '发货方型号']),
      quantity: toNumber(pick(row, ['quantity', '库存', '数量', '库存数量', '可用库存'])),
      unitPrice: toNumber(pick(row, ['unitPrice', 'unit_price', 'price', '单价', '价格', '采购价', '成本价'])),
      warehouseName: pick(row, ['warehouseName', 'warehouse_name', 'warehouse', '仓库', '仓库名称']),
      remark: pick(row, ['remark', '备注', '说明']),
    }))
    .filter((row) => row.productName || row.productCode || row.productSpec || row.supplierProductCode || row.supplierProductName);
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
  // 注意：suppliers 表未使用，实际发货方档案在 shippers 表
  // shippers 通过 type 字段区分类型：supplier/jd/self/third_party
  if (row.supplierCode) {
    // 按发货方编码（code字段）精确匹配
    const { data } = await client
      .from('shippers')
      .select('id, name')
      .eq('code', row.supplierCode)
      .eq('is_active', true)
      .maybeSingle();
    if (data) return { id: data.id as string, name: data.name as string };
  }

  if (row.supplierName) {
    // 按发货方名称模糊匹配（优先匹配 supplier 类型）
    const { data } = await client
      .from('shippers')
      .select('id, name')
      .eq('type', 'supplier')
      .eq('is_active', true)
      .ilike('name', `%${row.supplierName}%`)
      .limit(1);
    if (data?.[0]) return { id: data[0].id as string, name: data[0].name as string };
    // 回退：不限类型匹配
    const { data: data2 } = await client
      .from('shippers')
      .select('id, name')
      .eq('is_active', true)
      .ilike('name', `%${row.supplierName}%`)
      .limit(1);
    if (data2?.[0]) return { id: data2[0].id as string, name: data2[0].name as string };
  }

  return null;
}

async function createSupplier(
  client: ReturnType<typeof getSupabaseClient>,
  row: NormalizedStockRow
): Promise<{ id: string; name: string }> {
  const id = crypto.randomUUID();
  const supplierCode = row.supplierCode || `SUP-${Date.now().toString(36)}`;
  const supplierName = row.supplierName || supplierCode;

  // 实际写入 shippers 表（suppliers 表未使用）
  const { error } = await client
    .from('shippers')
    .insert({
      id,
      code: supplierCode,
      name: supplierName,
      type: 'supplier',
      send_type: 'download',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`自动创建发货方档案失败: ${error.message}`);
  }

  return { id, name: supplierName };
}

async function matchProductBySupplierMapping(
  client: ReturnType<typeof getSupabaseClient>,
  supplierId: string,
  row: NormalizedStockRow
): Promise<ProductMatch | null> {
  // 条件：必须有 supplierId + (发货方商品编码 或 发货方商品名称)
  if (!supplierId || (!row.supplierProductCode && !row.supplierProductName)) {
    return null;
  }

  // 查询 product_mappings：supplier_id + supplier_product_code 精确匹配
  let query = client
    .from('product_mappings')
    .select('product_id, product_code, product_name')
    .eq('supplier_id', supplierId)
    .eq('is_active', true);

  if (row.supplierProductCode) {
    query = query.eq('supplier_product_code', row.supplierProductCode);
  } else if (row.supplierProductName) {
    query = query.eq('supplier_product_name', row.supplierProductName);
  }

  const { data } = await query.maybeSingle();

  if (data?.product_id) {
    // 验证 product_id 在 products 表中存在且启用
    const { data: product } = await client
      .from('products')
      .select('id, code, name')
      .eq('id', data.product_id)
      .eq('is_active', true)
      .maybeSingle();

    if (product) {
      return {
        productId: product.id as string,
        productCode: product.code as string,
        productName: product.name as string,
        matchType: 'mapping',
        matchHint: `通过发货方SKU映射匹配（发货方编码：${row.supplierProductCode || row.supplierProductName}）`,
      };
    }
  }

  return null;
}

async function matchProduct(
  client: ReturnType<typeof getSupabaseClient>,
  row: NormalizedStockRow
): Promise<ProductMatch> {
  // 1. 优先：按商品编码精确匹配
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

  // 2. 次优先：按规格型号精确匹配
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

  // 3. 按商品名称模糊匹配
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

  // 4. 兜底：用发货方商品编码去匹配系统的 spec 和 name
  // （适用于 Excel 中只填写了"发货方商品编码"而没有填写"商品编码"的情况）
  if (row.supplierProductCode) {
    // 先精确匹配规格
    const { data: specData } = await client
      .from('products')
      .select('id, code, name')
      .eq('spec', row.supplierProductCode)
      .eq('is_active', true)
      .limit(1);
    if (specData?.[0]) {
      return {
        productId: specData[0].id as string,
        productCode: specData[0].code as string,
        productName: specData[0].name as string,
        matchType: 'spec',
        matchHint: `按发货方商品编码匹配规格：${row.supplierProductCode}`,
      };
    }

    // 再模糊匹配名称
    const { data: nameData } = await client
      .from('products')
      .select('id, code, name')
      .ilike('name', `%${row.supplierProductCode}%`)
      .eq('is_active', true)
      .limit(1);
    if (nameData?.[0]) {
      return {
        productId: nameData[0].id as string,
        productCode: nameData[0].code as string,
        productName: nameData[0].name as string,
        matchType: 'name',
        matchHint: `按发货方商品编码匹配名称：${row.supplierProductCode}`,
      };
    }
  }

  // 无法匹配时返回 null，不再自动创建商品档案
  return {
    productId: null,
    productCode: '',
    productName: '',
    matchType: 'none',
    matchHint: '无法匹配到系统商品档案，也无SKU映射关系',
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
    .eq('status', 'active')
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
  const authError = await requirePermission(request, PERMISSIONS.STOCKS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const rows = await parseRequestRows(request);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '没有有效的库存数据' }, { status: 400 });
    }

    const stats = {
      inserted: 0, updated: 0, matched: 0, unmatched: 0,
      supplierMappingMatched: 0, skuSkipped: 0,
    };
    const supplierNotFound: string[] = [];
    const errors: string[] = [];
    const skippedRows: SkippedRow[] = [];

    for (const row of rows) {
      let supplier = await findSupplier(client, row);
      if (!supplier) {
        try {
          supplier = await createSupplier(client, row);
        } catch (err) {
          const key = row.supplierCode || row.supplierName || '未知发货方';
          if (!supplierNotFound.includes(key)) supplierNotFound.push(key);
          continue;
        }
      }

      let product: ProductMatch | null = null;

      // 1. 优先：通过 SKU 映射匹配
      const mappedProduct = await matchProductBySupplierMapping(client, supplier.id, row);
      if (mappedProduct) {
        product = mappedProduct;
        stats.supplierMappingMatched += 1;
        stats.matched += 1;
      } else {
        // 2. 次优先：通过 products 表匹配
        product = await matchProduct(client, row);

        if (!product || !product.productId) {
          // 3. 兜底：无法匹配 → 记录并跳过，不处理
          stats.skuSkipped += 1;
          stats.unmatched += 1;
          skippedRows.push({
            supplierCode: row.supplierCode,
            supplierName: row.supplierName,
            productName: row.productName || row.supplierProductName,
            productCode: row.productCode || row.supplierProductCode,
            productSpec: row.productSpec || row.supplierProductSpec,
            reason: product?.matchHint || '无法匹配到系统商品，也无SKU映射关系',
          });
          continue;
        }
        stats.matched += 1;
      }

      if (!product.productId) {
        continue;
      }

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
      success: errors.length === 0 && supplierNotFound.length === 0,
      data: { ...stats, total },
      supplierNotFound,
      errors,
      skippedRows,
      message: [
        `库存导入完成：新增 ${stats.inserted} 条，更新 ${stats.updated} 条`,
        stats.supplierMappingMatched > 0 ? `SKU映射匹配 ${stats.supplierMappingMatched} 条` : '',
        stats.skuSkipped > 0 ? `有 ${stats.skuSkipped} 条无法匹配，已跳过` : '',
        supplierNotFound.length > 0 ? `有 ${supplierNotFound.length} 个发货方未找到并跳过` : '',
      ].filter(Boolean).join('，'),
    }, { status: errors.length > 0 && total === 0 ? 500 : 200 });
  } catch (error) {
    console.error('发货方库存导入失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '导入失败',
    }, { status: 500 });
  }
}
