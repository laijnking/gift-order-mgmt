/**
 * 订单解析共享模块
 *
 * 从 src/app/api/order-parse/excel/route.ts 提取，
 * 供 API route 和 WeCom Worker 共用。
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { extractAddressParts } from '@/lib/column-mapping-rules';
import { SKU_MATCH_ORDER, PRODUCT_MATCH_SCORES, MATCH_TYPE_LABELS } from '@/lib/order-parse/match-policy';
import type {
  ParsedOrderBundleDraft,
  ParsedOrderDraftItem,
} from '@/types/order-parse';

// 字段别名映射（前端字段名 -> 后端内部字段名）
const FIELD_ALIASES: Record<string, string[]> = {
  'customer_product_name': ['customer_product_name'],
  'customer_product_spec': ['customer_product_spec'],
  'customer_product_code': ['customer_product_code'],
};

/**
 * 获取字段值（支持别名）
 */
export function getFieldValue(
  row: (string | number | null)[],
  columnMapping: Record<string, string>,
  field: string
): string {
  const possibleFields = [field, ...(FIELD_ALIASES[field] || [])];

  for (const f of possibleFields) {
    for (const [colIdx, mappedField] of Object.entries(columnMapping)) {
      if (mappedField === f) {
        const value = row[parseInt(colIdx)];
        return value === null || value === undefined ? '' : String(value).trim();
      }
    }
  }
  return '';
}

/**
 * 确保"商品待匹配"默认档案存在，不存在则自动创建
 */
export async function ensurePendingMatchProduct(
  client: ReturnType<typeof getSupabaseClient>,
): Promise<Record<string, unknown>> {
  // 先查找是否已存在
  const { data: existing } = await client
    .from('products')
    .select('*')
    .eq('code', 'PENDING_MATCH')
    .limit(1);

  if (existing && existing.length > 0) {
    return existing[0] as Record<string, unknown>;
  }

  // 不存在则创建（upsert 防竞态）
  const { data: created, error } = await client
    .from('products')
    .upsert(
      {
        code: 'PENDING_MATCH',
        name: '商品待匹配',
        spec: '商品待匹配',
        is_active: true,
      },
      { onConflict: 'code' },
    )
    .select()
    .single();

  if (error) {
    console.error('【order-parser】创建"商品待匹配"档案失败:', error);
    throw error;
  }

  return created as Record<string, unknown>;
}

/**
 * 匹配系统商品
 */
export async function matchSystemProduct(
  client: ReturnType<typeof getSupabaseClient>,
  customerCode: string,
  productName: unknown,
  productSpec: unknown,
  productCode: unknown,
  barcode: unknown,
  tenantId?: string
): Promise<{
  productId: string | null;
  productName: string | null;
  productSpec: string | null;
  productCode: string | null;
  brand: string | null;
  price: number | null;
  matchType: string | null;
  matchHint: string | null;
}> {
  const result = {
    productId: null as string | null,
    productName: null as string | null,
    productSpec: null as string | null,
    productCode: null as string | null,
    brand: null as string | null,
    price: null as number | null,
    matchType: null as string | null,
    matchHint: null as string | null,
  };

  const str = (v: unknown): string => (v == null ? '' : String(v));

  // 1. 先查找客户商品映射
  let mappings: Record<string, unknown>[] = [];
  if (customerCode) {
    let customerQuery = client.from('customers').select('id').eq('code', customerCode);
    if (tenantId) customerQuery = customerQuery.eq('tenant_id', tenantId);
    const { data: customer } = await customerQuery.maybeSingle();

    if (customer?.id) {
      let mappingQuery = client.from('product_mappings').select('*').eq('customer_id', customer.id).eq('is_active', true);
      if (tenantId) mappingQuery = mappingQuery.eq('tenant_id', tenantId);
      const { data } = await mappingQuery;
      mappings = (data || []) as Record<string, unknown>[];
    }
  }

  for (const match of SKU_MATCH_ORDER) {
    const matchValue = match.type === 'code' ? str(productCode)
      : match.type === 'barcode' ? str(barcode)
      : match.type === 'spec' ? str(productSpec)
      : str(productName);

    if (!matchValue) continue;

    const mapping = mappings.find((m: Record<string, unknown>) => {
      const fieldValue = str(m[match.field]);
      if (!fieldValue) return false;
      return fieldValue === matchValue;
    });

    if (mapping) {
      const pmProductId = str(mapping.product_id);
      const pmProductCode = str(mapping.product_code);

      if (pmProductId) {
        let q = client.from('products').select('*').eq('id', pmProductId);
        if (tenantId) q = q.or(`owner_tenant_id.eq.${tenantId},visibility.eq.global`);
        const { data: productsById } = await q.limit(1);
        if (productsById && productsById.length > 0) {
          const p = productsById[0] as Record<string, unknown>;
          result.productId = str(p.id);
          result.productName = str(p.name);
          result.productSpec = str(p.spec);
          result.productCode = str(p.code);
          result.brand = str(p.brand);
          result.price = Number(mapping.price) || null;
        }
      } else if (pmProductCode) {
        let q = client.from('products').select('*').eq('code', pmProductCode);
        if (tenantId) q = q.or(`owner_tenant_id.eq.${tenantId},visibility.eq.global`);
        const { data: productsByCode } = await q.limit(1);
        if (productsByCode && productsByCode.length > 0) {
          const p = productsByCode[0] as Record<string, unknown>;
          result.productId = str(p.id);
          result.productName = str(p.name);
          result.productSpec = str(p.spec);
          result.productCode = pmProductCode;
          result.brand = str(p.brand);
          result.price = Number(mapping.price) || null;
        }
      }
      if (result.productId) {
        result.matchType = 'mapping';
        result.matchHint = `通过SKU映射匹配 (${match.type})`;
        break;
      }
    }
  }

  // 2. 如果没有找到映射，直接在商品档案中匹配
  if (!result.productId) {
    let generalQuery = client.from('products').select('*').eq('is_active', true);
    if (tenantId) generalQuery = generalQuery.or(`owner_tenant_id.eq.${tenantId},visibility.eq.global`);
    const { data: products } = await generalQuery.limit(1000);

    if (products && products.length > 0) {
      let bestMatch: { product: Record<string, unknown>; score: number; matchType: string } | null = null;

    for (const product of products) {
      const pName = str(product.name);
      const pSpec = str(product.spec);
      const pCode = str(product.code);
      const pBarcode = str(product.barcode);

      let score = 0;
      let matchType = '';

      if (productCode && pCode && str(productCode) === pCode) {
        score = PRODUCT_MATCH_SCORES.CODE_EXACT;
        matchType = 'code';
      } else if (barcode && pBarcode && str(barcode) === pBarcode) {
        score = PRODUCT_MATCH_SCORES.BARCODE_EXACT;
        matchType = 'barcode';
      } else if (productSpec && pSpec && str(productSpec) === pSpec) {
        score = PRODUCT_MATCH_SCORES.SPEC_EXACT;
        matchType = 'spec';
      } else if (productName && pName && str(productName) === pName) {
        score = PRODUCT_MATCH_SCORES.NAME_EXACT;
        matchType = 'name';
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { product, score, matchType };
      }
    }

    if (bestMatch) {
      const p = bestMatch.product;
      result.productId = p.id as string;
      result.productName = p.name as string;
      result.productSpec = p.spec as string;
      result.productCode = p.code as string;
      result.brand = p.brand as string;
      result.price = p.retail_price as number;
      result.matchType = bestMatch.matchType;
      result.matchHint = `通过商品档案${MATCH_TYPE_LABELS[bestMatch.matchType] || bestMatch.matchType}精确匹配`;
    }
    }
  }

  // 3. 未精确匹配到系统商品，回退到"商品待匹配"默认档案
  if (!result.productId) {
    try {
      const pendingProduct = await ensurePendingMatchProduct(client);
      result.productId = str(pendingProduct.id);
      result.productName = str(pendingProduct.name);
      result.productSpec = str(pendingProduct.spec);
      result.productCode = str(pendingProduct.code);
      result.brand = str(pendingProduct.brand);
      result.price = Number(pendingProduct.retail_price || pendingProduct.cost_price) || null;
      result.matchType = 'unmatched';
      result.matchHint = '未精确匹配到系统商品，已关联默认"商品待匹配"档案';
    } catch (fallbackErr) {
      console.error('【order-parser】获取"商品待匹配"档案失败:', fallbackErr);
    }
  }

  return result;
}

/**
 * 匹配发货方库存
 */
export async function matchSupplierStocks(
  client: ReturnType<typeof getSupabaseClient>,
  productId: string | null,
  productSpec: string | null,
  productCode: string | null,
  province: string,
  tenantId?: string
): Promise<{
  supplierId: string;
  supplierName: string;
  stockQuantity: number;
  stockPrice: number;
  warehouseName: string;
  matchType: string;
}[]> {
  let query = client
    .from('stocks')
    .select('*')
    .gt('quantity', 0)
    .eq('status', 'active');

  if (tenantId) query = query.eq('tenant_id', tenantId);

  if (productId) {
    query = query.eq('product_id', productId);
  } else if (productCode) {
    query = query.eq('product_code', productCode);
  } else if (productSpec) {
    query = query.ilike('product_name', `%${productSpec}%`);
  } else {
    return [];
  }

  const { data: stocks } = await query;

  if (!stocks || stocks.length === 0) return [];

  const sortedStocks = stocks
    .map((s: Record<string, unknown>) => ({
      supplierId: s.supplier_id as string,
      supplierName: s.supplier_name as string,
      stockQuantity: s.quantity as number,
      stockPrice: Number(s.unit_price || 0),
      warehouseName: (s.warehouse_name as string) || '',
      matchType: productId ? 'product_id' : productCode ? 'product_code' : 'product_name',
      isSameProvince: (s.supplier_name as string)?.includes(province) || false,
    }))
    .sort((a, b) => {
      const aLowStock = a.stockQuantity <= 2 ? -1000 : 0;
      const bLowStock = b.stockQuantity <= 2 ? -1000 : 0;
      const aProvince = a.isSameProvince ? 1000 : 0;
      const bProvince = b.isSameProvince ? 1000 : 0;
      return (b.stockQuantity + bLowStock + bProvince) - (a.stockQuantity + aLowStock + aProvince);
    });

  return sortedStocks.slice(0, 5);
}

/**
 * 批量解析Excel数据
 */
export async function parseExcelData(
  client: ReturnType<typeof getSupabaseClient>,
  rows: (string | number | null)[][],
  columnMapping: Record<string, string>,
  customerCode: string,
  tenantId?: string
): Promise<ParsedOrderBundleDraft[]> {
  const orders: Map<string, ParsedOrderBundleDraft> = new Map();

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];

      const customerOrderNo = getFieldValue(row, columnMapping, 'customer_order_no');
      const orderNo = getFieldValue(row, columnMapping, 'order_no') || customerOrderNo || `AUTO-${Date.now()}-${i}`;

      const customerProductName = getFieldValue(row, columnMapping, 'customer_product_name');
      const customerProductSpec = getFieldValue(row, columnMapping, 'customer_product_spec');
      const customerProductCode = getFieldValue(row, columnMapping, 'customer_product_code');
      const productName = getFieldValue(row, columnMapping, 'product_name');
      const productSpec = getFieldValue(row, columnMapping, 'product_spec');
      const productCode = getFieldValue(row, columnMapping, 'product_code');
      const barcode = getFieldValue(row, columnMapping, 'barcode');
      const quantity = parseInt(getFieldValue(row, columnMapping, 'quantity')) || 1;
      const price = parseFloat(getFieldValue(row, columnMapping, 'price')) || null;
      const receiverName = getFieldValue(row, columnMapping, 'receiver_name');
      const receiverPhone = getFieldValue(row, columnMapping, 'receiver_phone');
      const receiverAddress = getFieldValue(row, columnMapping, 'receiver_address');
      const expressCompany = getFieldValue(row, columnMapping, 'express_company');
      const trackingNo = getFieldValue(row, columnMapping, 'tracking_no');
      const remark = getFieldValue(row, columnMapping, 'remark');
      const billDate = getFieldValue(row, columnMapping, 'bill_date');
      const channelRemark = getFieldValue(row, columnMapping, 'channel_remark');
      const suggestedShipper = getFieldValue(row, columnMapping, 'suggested_shipper');
      const originalStatus = getFieldValue(row, columnMapping, 'original_status');

      // 提取扩展字段
      const extFields: Record<string, string> = {};
      for (const [colIdx, mappedField] of Object.entries(columnMapping)) {
        if (mappedField.startsWith('ext_field_')) {
          const value = getFieldValue(row, columnMapping, mappedField);
          if (value) {
            extFields[mappedField] = value;
          }
        }
      }

      const finalProductName = customerProductName || productName;
      const finalProductSpec = customerProductSpec || productSpec;
      const finalProductCode = customerProductCode || productCode;

      if (!finalProductName || finalProductName.trim() === '') continue;

      let order = orders.get(orderNo);
      if (!order) {
        try {
          const addressParts = extractAddressParts(receiverAddress);
          order = {
            id: `order_${Date.now()}_${orders.size}_${Math.random().toString(36).slice(2, 8)}`,
            orderNo,
            customerOrderNo,
            billDate,
            receiverName,
            receiverPhone,
            receiverAddress,
            province: addressParts.province,
            city: addressParts.city,
            district: addressParts.district,
            items: [],
            expressCompany,
            trackingNo,
            remark,
            channelRemark,
            suggestedShipper,
            originalStatus,
            extFields,
          };
          orders.set(orderNo, order);
        } catch (orderErr) {
          console.error('【order-parser】创建订单失败:', orderErr, { orderNo, receiverAddress });
          continue;
        }
      }

      let matchedProduct;
      try {
        matchedProduct = await matchSystemProduct(
          client,
          customerCode,
          finalProductName,
          finalProductSpec,
          finalProductCode,
          barcode,
          tenantId
        );
      } catch (matchErr) {
        console.error('【order-parser】matchSystemProduct失败:', matchErr, { productName: finalProductName, spec: finalProductSpec, code: finalProductCode });
        throw matchErr;
      }

      const supplierMatches = await matchSupplierStocks(
        client,
        matchedProduct.productId,
        matchedProduct.productSpec,
        matchedProduct.productCode,
        order.province,
        tenantId
      );

      const orderItem: ParsedOrderDraftItem = {
        id: `item_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
        customerProductName: finalProductName,
        customerProductSpec: finalProductSpec,
        customerProductCode: finalProductCode,
        customerBarcode: barcode,
        systemProductId: matchedProduct.productId,
        systemProductName: matchedProduct.productName,
        systemProductSpec: matchedProduct.productSpec,
        systemProductCode: matchedProduct.productCode,
        systemProductBrand: matchedProduct.brand,
        systemProductPrice: matchedProduct.price,
        matchType: matchedProduct.matchType,
        matchHint: matchedProduct.matchHint,
        supplierMatches,
        quantity,
        price: price || matchedProduct.price,
        remark: '',
      };

      order.items.push(orderItem);
    } catch (parseRowErr) {
      console.error(`【order-parser】第${i}行解析失败:`, parseRowErr);
      continue;
    }
  }

  return Array.from(orders.values());
}
