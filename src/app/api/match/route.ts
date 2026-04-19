import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface OrderItem {
  product_id?: string | null;
  product_name?: string;
  product_code?: string;
  product_spec?: string;
  productName?: string;
  productCode?: string;
  productSpec?: string;
  cu_product_name?: string;
  cu_product_code?: string;
  cu_product_spec?: string;
  cuProductName?: string;
  cuProductCode?: string;
  cuProductSpec?: string;
  quantity?: number;
}

function parseItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value as OrderItem[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function extractProvince(address: string): string | null {
  if (!address) return null;
  const directCities = ['北京', '天津', '上海', '重庆'];
  for (const city of directCities) {
    if (address.includes(city)) return city;
  }

  const match = address.match(/(河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)/);
  return match?.[1] || null;
}

function getProvinceScore(supplierProvince: string | undefined, receiverProvince: string | null): number {
  if (!receiverProvince) return 30;
  if (!supplierProvince) return 10;
  if (supplierProvince.includes(receiverProvince) || receiverProvince.includes(supplierProvince)) return 100;

  const adjacent: Record<string, string[]> = {
    广东: ['广西', '海南', '湖南', '江西', '福建'],
    北京: ['天津', '河北', '山东'],
    上海: ['江苏', '浙江', '安徽'],
    浙江: ['上海', '江苏', '安徽', '江西', '福建'],
    江苏: ['上海', '浙江', '安徽', '山东'],
    山东: ['江苏', '河北', '河南'],
    河南: ['山东', '河北', '湖北', '安徽'],
    湖北: ['河南', '湖南', '江西', '安徽'],
    湖南: ['湖北', '江西', '广东', '广西', '贵州'],
    四川: ['重庆', '云南', '贵州', '陕西', '甘肃', '青海'],
  };
  return adjacent[receiverProvince]?.includes(supplierProvince) ? 60 : 20;
}

function provinceText(supplierProvince: string | undefined, receiverProvince: string | null): string {
  if (!receiverProvince) return '';
  if (!supplierProvince) return '省份未知';
  const score = getProvinceScore(supplierProvince, receiverProvince);
  if (score >= 100) return '同省';
  if (score >= 60) return '邻近';
  return '较远';
}

function expressAllowed(supplier: Record<string, unknown>, order: Record<string, unknown>): boolean {
  const req = String(order.express_requirement || '');
  if (req.includes('京东') && supplier.can_jd === false) return false;

  const address = String(order.receiver_address || '');
  const restrictions = supplier.express_restrictions;
  const parsed = typeof restrictions === 'string'
    ? (() => {
      try { return JSON.parse(restrictions); } catch { return []; }
    })()
    : restrictions;

  const list = Array.isArray(parsed) ? parsed : [];
  if (list.includes('不发偏远地区') && (address.includes('新疆') || address.includes('西藏'))) {
    return false;
  }
  return true;
}

async function resolveProduct(
  client: ReturnType<typeof getSupabaseClient>,
  item: OrderItem
): Promise<{ id: string | null; code: string; name: string; spec: string; matchType: string }> {
  const productId = item.product_id || null;
  const code = item.product_code || item.productCode || item.cu_product_code || item.cuProductCode || '';
  const spec = item.product_spec || item.productSpec || item.cu_product_spec || item.cuProductSpec || '';
  const name = item.product_name || item.productName || item.cu_product_name || item.cuProductName || '';

  if (productId) {
    const { data } = await client.from('products').select('id, code, name, spec').eq('id', productId).maybeSingle();
    if (data) {
      return {
        id: data.id as string,
        code: (data.code as string) || code,
        name: (data.name as string) || name,
        spec: (data.spec as string) || spec,
        matchType: 'product_id',
      };
    }
  }

  if (code) {
    const { data } = await client.from('products').select('id, code, name, spec').eq('code', code).eq('is_active', true).maybeSingle();
    if (data) {
      return {
        id: data.id as string,
        code: data.code as string,
        name: data.name as string,
        spec: (data.spec as string) || spec,
        matchType: 'code',
      };
    }
  }

  if (spec) {
    const { data } = await client.from('products').select('id, code, name, spec').eq('spec', spec).eq('is_active', true).limit(1);
    if (data?.[0]) {
      return {
        id: data[0].id as string,
        code: data[0].code as string,
        name: data[0].name as string,
        spec: data[0].spec as string,
        matchType: 'spec',
      };
    }
  }

  if (name) {
    const { data } = await client.from('products').select('id, code, name, spec').ilike('name', `%${name}%`).eq('is_active', true).limit(1);
    if (data?.[0]) {
      return {
        id: data[0].id as string,
        code: data[0].code as string,
        name: data[0].name as string,
        spec: (data[0].spec as string) || spec,
        matchType: 'name',
      };
    }
  }

  return { id: null, code, name, spec, matchType: 'none' };
}

function stockMatchesProduct(stock: Record<string, unknown>, product: { id: string | null; code: string; name: string; spec: string }) {
  if (product.id && stock.product_id === product.id) return true;
  if (product.code && stock.product_code === product.code) return true;
  if (product.name && String(stock.product_name || '').includes(product.name)) return true;
  return false;
}

function normalizeTransientOrder(input: Record<string, unknown>): Record<string, unknown> {
  const item: OrderItem = {
    product_id: (input.systemProductId || input.productId) as string | undefined,
    product_name: (input.mappedProductName || input.product_name || input.productName) as string | undefined,
    product_code: (input.mappedProductCode || input.product_code || input.productCode) as string | undefined,
    product_spec: (input.mappedProductSpec || input.product_spec || input.productSpec) as string | undefined,
    cu_product_name: (input.product_name || input.productName) as string | undefined,
    cu_product_code: (input.product_code || input.productCode) as string | undefined,
    cu_product_spec: (input.product_spec || input.productSpec) as string | undefined,
    quantity: toNumber(input.quantity, 1),
  };

  return {
    id: input.id,
    order_no: input.orderNo || input.order_no || input.billNo || input.id,
    receiver_name: input.receiver_name || input.receiverName || '',
    receiver_phone: input.receiver_phone || input.receiverPhone || '',
    receiver_address: input.receiver_address || input.receiverAddress || '',
    express_requirement: input.expressRequirement || input.express_requirement || '',
    items: [item],
  };
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const transientOrders = Array.isArray(body.orders)
      ? (body.orders as Record<string, unknown>[]).map(normalizeTransientOrder)
      : [];
    const orderIds = (body.orderIds || []).map((id: unknown) => typeof id === 'string' ? id : (id as { id?: string })?.id).filter(Boolean);

    if ((!Array.isArray(orderIds) || orderIds.length === 0) && transientOrders.length === 0) {
      return NextResponse.json({ success: false, error: '请选择要匹配的订单' }, { status: 400 });
    }

    const [{ data: dbOrders, error: orderError }, { data: suppliers, error: supplierError }, { data: stocks, error: stockError }, { data: costHistory }] = await Promise.all([
      orderIds.length > 0
        ? client.from('orders').select('*').in('id', orderIds)
        : Promise.resolve({ data: [], error: null }),
      client.from('suppliers').select('*').eq('is_active', true),
      client.from('stocks').select('*').eq('status', 'active'),
      client.from('order_cost_history').select('product_code, supplier_id, unit_cost').order('created_at', { ascending: false }),
    ]);

    if (orderError) throw new Error(`查询订单失败: ${orderError.message}`);
    if (supplierError) throw new Error(`查询供应商失败: ${supplierError.message}`);
    if (stockError) throw new Error(`查询库存失败: ${stockError.message}`);

    const activeSuppliers = (suppliers || []) as Record<string, unknown>[];
    const activeStocks = ((stocks || []) as Record<string, unknown>[]).filter((stock) => toNumber(stock.quantity) > 0);
    const costs = (costHistory || []) as Record<string, unknown>[];
    const dbOrderIds = new Set(((dbOrders || []) as Record<string, unknown>[]).map((order) => order.id));
    const orders = [
      ...((dbOrders || []) as Record<string, unknown>[]),
      ...transientOrders.filter((order) => !dbOrderIds.has(order.id)),
    ];

    const results = [];
    for (const order of orders) {
      const items = parseItems(order.items);
      const item = items[0] || {};
      const product = await resolveProduct(client, item);
      const quantity = toNumber(item.quantity, 1);
      const receiverProvince = extractProvince(String(order.receiver_address || ''));

      const matchedStocks = activeStocks
        .filter((stock) => stockMatchesProduct(stock, product))
        .filter((stock) => toNumber(stock.quantity) >= quantity || toNumber(stock.quantity) > 0);

      const supplierOptions = matchedStocks
        .map((stock) => {
          const supplier = activeSuppliers.find((s) => s.id === stock.supplier_id);
          if (!supplier || !expressAllowed(supplier, order)) return null;

          const unitPrice = toNumber(stock.unit_price);
          const stockQty = toNumber(stock.quantity);
          const historyCost = costs.find((c) => c.product_code === stock.product_code && c.supplier_id === supplier.id)?.unit_cost;
          const provinceScore = getProvinceScore(supplier.province as string | undefined, receiverProvince);
          const stockScore = stockQty > quantity ? 20 : 0;
          const priceScore = unitPrice > 0 ? Math.max(0, 50 - unitPrice / 10) : 0;
          const selfScore = supplier.type === 'self' ? 30 : 0;
          const score = provinceScore + stockScore + priceScore + selfScore;

          return {
            supplierId: supplier.id as string,
            supplierName: supplier.name as string,
            supplierType: supplier.type as string,
            province: supplier.province as string | undefined,
            provinceMatch: provinceText(supplier.province as string | undefined, receiverProvince),
            productCode: String(stock.product_code || product.code || ''),
            productName: String(stock.product_name || product.name || ''),
            quantity: stockQty,
            price: unitPrice,
            historyCost: historyCost ? Number(historyCost) : null,
            stockId: stock.id as string,
            warehouseId: stock.warehouse_id as string | undefined,
            warehouseName: stock.warehouse_name as string | undefined,
            score,
            hasStock: true,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (!a || !b) return 0;
          if (b.score !== a.score) return b.score - a.score;
          return a.price - b.price;
        }) as Array<{
          supplierId: string;
          supplierName: string;
          supplierType?: string;
          province?: string;
          provinceMatch?: string;
          productCode: string;
          productName: string;
          quantity: number;
          price: number;
          historyCost?: number | null;
          stockId: string;
          warehouseId?: string;
          warehouseName?: string;
          score: number;
          hasStock: boolean;
        }>;

      const fallbackSuppliers = supplierOptions.length > 0
        ? supplierOptions
        : activeSuppliers.map((supplier) => ({
          supplierId: supplier.id as string,
          supplierName: supplier.name as string,
          supplierType: supplier.type as string,
          province: supplier.province as string | undefined,
          provinceMatch: provinceText(supplier.province as string | undefined, receiverProvince),
          productCode: product.code || '',
          productName: product.name || '',
          quantity: 0,
          price: 0,
          historyCost: null,
          stockId: '',
          warehouseId: undefined,
          warehouseName: undefined,
          score: getProvinceScore(supplier.province as string | undefined, receiverProvince),
          hasStock: false,
        })).sort((a, b) => b.score - a.score);

      const recommended = supplierOptions[0] || null;
      const matchReasons = [
        product.id ? `商品已匹配：${product.name || product.code}` : `商品未精确匹配：${product.name || product.code || '未知商品'}`,
        recommended ? `推荐 ${recommended.supplierName}，库存 ${recommended.quantity}，单价 ${recommended.price}` : '未找到有库存的供应商',
      ];

      const warning = recommended && recommended.quantity <= 2
        ? `尾货预警：${recommended.supplierName} 库存仅剩 ${recommended.quantity} 台`
        : undefined;

      results.push({
        orderId: order.id,
        orderNo: order.order_no,
        customerProductName: item.cu_product_name || item.cuProductName || item.product_name || item.productName || '',
        customerProductCode: item.cu_product_code || item.cuProductCode || item.product_code || item.productCode || '',
        customerProductSpec: item.cu_product_spec || item.cuProductSpec || item.product_spec || item.productSpec || '',
        systemProductId: product.id,
        systemProductName: product.name,
        systemProductCode: product.code,
        systemProductSpec: product.spec,
        productName: product.name,
        productCode: product.code,
        quantity,
        receiverProvince,
        receiverAddress: order.receiver_address,
        recommendedSupplier: recommended ? {
          id: recommended.supplierId,
          name: recommended.supplierName,
          type: recommended.supplierType,
          province: recommended.province,
          provinceMatch: recommended.provinceMatch,
        } : null,
        stockInfo: recommended ? {
          stockId: recommended.stockId,
          productCode: recommended.productCode,
          productName: recommended.productName,
          quantity: recommended.quantity,
          price: recommended.price,
          warehouseId: recommended.warehouseId,
          warehouseName: recommended.warehouseName,
        } : null,
        allSupplierOptions: fallbackSuppliers,
        availableSuppliers: fallbackSuppliers,
        alternativeSuppliers: fallbackSuppliers.slice(1, 4).map((s) => ({ id: s.supplierId, name: s.supplierName })),
        hasStockForProduct: supplierOptions.length > 0,
        matchReasons,
        warning,
        newProductHint: supplierOptions.length === 0 ? `商品「${product.name || product.code || '未知'}」暂无库存，请先导入库存或手动选择供应商` : undefined,
      });
    }

    return NextResponse.json({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error('匹配供应商失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
