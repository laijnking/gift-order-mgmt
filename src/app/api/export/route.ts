import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

interface OrderItem {
  product_id?: string | null;
  product_name?: string;
  product_code?: string;
  product_spec?: string;
  productName?: string;
  productCode?: string;
  productSpec?: string;
  cu_product_name?: string;
  quantity?: number;
  price?: number;
  unit_price?: number;
  remark?: string;
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

function toDateOnly(value?: unknown): string {
  const d = value ? new Date(String(value)) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

async function findStockForDispatch(
  client: ReturnType<typeof getSupabaseClient>,
  supplierId: string,
  item: OrderItem
) {
  const productId = item.product_id;
  const productCode = item.product_code || item.productCode || '';
  const productName = item.product_name || item.productName || item.cu_product_name || '';

  if (productId) {
    const { data } = await client
      .from('stocks')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .eq('status', 'active')
      .maybeSingle();
    if (data) return data as Record<string, unknown>;
  }

  if (productCode) {
    const { data } = await client
      .from('stocks')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('product_code', productCode)
      .eq('status', 'active')
      .maybeSingle();
    if (data) return data as Record<string, unknown>;
  }

  if (productName) {
    const { data } = await client
      .from('stocks')
      .select('*')
      .eq('supplier_id', supplierId)
      .ilike('product_name', `%${productName}%`)
      .eq('status', 'active')
      .limit(1);
    if (data?.[0]) return data[0] as Record<string, unknown>;
  }

  return null;
}

async function createLowStockAlert(
  client: ReturnType<typeof getSupabaseClient>,
  payload: {
    stockId: string;
    orderId: string;
    orderNo: string;
    productName: string;
    supplierName: string;
    quantity: number;
  }
) {
  if (payload.quantity > 2) return;
  await client.from('alert_records').insert({
    stock_id: payload.stockId,
    order_id: payload.orderId,
    order_no: payload.orderNo,
    rule_code: 'LOW_STOCK',
    alert_type: payload.quantity === 0 ? 'out_of_stock' : 'low_stock',
    alert_level: payload.quantity === 0 ? 'error' : 'warning',
    title: payload.quantity === 0 ? '库存已耗尽' : '尾货预警',
    content: `${payload.productName} 在「${payload.supplierName}」库存剩余 ${payload.quantity} 台`,
    data: {
      stockId: payload.stockId,
      productName: payload.productName,
      supplierName: payload.supplierName,
      quantity: payload.quantity,
    },
    is_read: false,
    is_resolved: false,
  });
}

async function dispatchOneOrder(
  client: ReturnType<typeof getSupabaseClient>,
  order: Record<string, unknown>,
  supplier: Record<string, unknown>,
  batchNo: string
) {
  const items = parseItems(order.items);
  if (items.length === 0) {
    throw new Error(`订单 ${order.order_no || order.id} 没有商品明细`);
  }

  const dispatchItems = [];

  for (const item of items) {
    const quantity = toNumber(item.quantity, 1);
    const stock = await findStockForDispatch(client, supplier.id as string, item);
    if (!stock) {
      throw new Error(`订单 ${order.order_no || order.id} 的商品「${item.product_name || item.productName || item.product_code || item.productCode || '未知商品'}」未找到供应商库存`);
    }

    const beforeQuantity = toNumber(stock.quantity);
    if (beforeQuantity < quantity) {
      throw new Error(`库存不足：${stock.product_name} 当前 ${beforeQuantity} 台，订单需要 ${quantity} 台`);
    }

    const afterQuantity = beforeQuantity - quantity;
    const beforePrice = toNumber(stock.unit_price);
    await client
      .from('stocks')
      .update({
        quantity: afterQuantity,
        last_stock_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', stock.id);

    await client.from('stock_versions').insert({
      stock_id: stock.id,
      product_code: stock.product_code,
      product_name: stock.product_name,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      warehouse_id: stock.warehouse_id || null,
      warehouse_name: stock.warehouse_name || null,
      before_quantity: beforeQuantity,
      after_quantity: afterQuantity,
      change_quantity: -quantity,
      before_price: beforePrice,
      after_price: beforePrice,
      change_price: 0,
      change_type: 'order',
      change_reason: `订单派发 ${order.order_no || order.id}`,
      reference_id: order.id,
      operator: 'system',
    });

    await createLowStockAlert(client, {
      stockId: stock.id as string,
      orderId: order.id as string,
      orderNo: String(order.order_no || ''),
      productName: String(stock.product_name || item.product_name || item.productName || ''),
      supplierName: String(supplier.name || ''),
      quantity: afterQuantity,
    });

    const unitCost = beforePrice || toNumber(item.unit_price ?? item.price);
    const totalCost = unitCost * quantity;

    await client.from('order_cost_history').insert({
      order_id: order.id,
      order_no: order.order_no,
      match_code: order.match_code || null,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      warehouse_id: stock.warehouse_id || null,
      warehouse_name: stock.warehouse_name || null,
      product_code: stock.product_code || item.product_code || item.productCode || null,
      product_name: stock.product_name || item.product_name || item.productName || null,
      quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      express_fee: 0,
      other_fee: 0,
      total_amount: totalCost,
      receiver_name: order.receiver_name || null,
      receiver_phone: order.receiver_phone || null,
      receiver_address: order.receiver_address || null,
      customer_code: order.customer_code || null,
      customer_name: order.customer_name || null,
      salesperson: order.salesperson || null,
      operator_name: order.operator_name || null,
      order_date: toDateOnly(order.created_at),
      shipped_date: toDateOnly(),
      dispatch_batch: batchNo,
      remark: order.remark || null,
    });

    dispatchItems.push({
      productCode: stock.product_code || item.product_code || item.productCode || '',
      productName: stock.product_name || item.product_name || item.productName || '',
      quantity,
      unitCost,
      warehouseName: stock.warehouse_name || '',
    });
  }

  await client.from('dispatch_records').insert({
    id: crypto.randomUUID(),
    order_id: order.id,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    batch_no: batchNo,
    dispatch_at: new Date().toISOString(),
    status: 'dispatched',
    items: dispatchItems,
  });

  await client
    .from('orders')
    .update({
      status: 'assigned',
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      assigned_batch: batchNo,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  return dispatchItems;
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const orderIds = body.orderIds;
    const requestedSupplierId = body.supplierId;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择要派发的订单' }, { status: 400 });
    }

    const [{ data: orders, error: ordersError }, { data: suppliers, error: suppliersError }] = await Promise.all([
      client.from('orders').select('*').in('id', orderIds),
      client.from('suppliers').select('*').eq('is_active', true),
    ]);
    if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
    if (suppliersError) throw new Error(`查询供应商失败: ${suppliersError.message}`);
    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: '未找到订单' }, { status: 404 });
    }

    const supplierMap = new Map((suppliers || []).map((supplier) => [supplier.id, supplier as Record<string, unknown>]));
    const batchNo = `DISPATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;
    const rowsBySupplier: Record<string, Record<string, unknown>[]> = {};
    const errors: string[] = [];
    let dispatchedCount = 0;

    for (const order of orders as Record<string, unknown>[]) {
      const supplierId = requestedSupplierId || order.supplier_id;
      if (!supplierId) {
        errors.push(`订单 ${order.order_no || order.id} 未选择供应商`);
        continue;
      }
      const supplier = supplierMap.get(supplierId);
      if (!supplier) {
        errors.push(`订单 ${order.order_no || order.id} 的供应商不存在或未启用`);
        continue;
      }

      try {
        const dispatchItems = await dispatchOneOrder(client, order, supplier, batchNo);
        const supplierName = String(supplier.name || '未知供应商');
        if (!rowsBySupplier[supplierName]) rowsBySupplier[supplierName] = [];

        for (const item of dispatchItems) {
          rowsBySupplier[supplierName].push({
            派发批次: batchNo,
            系统订单号: order.sys_order_no || '',
            客户订单号: order.order_no || '',
            商品编码: item.productCode,
            商品名称: item.productName,
            数量: item.quantity,
            单价: item.unitCost,
            仓库: item.warehouseName,
            收货人: order.receiver_name || '',
            收货电话: order.receiver_phone || '',
            收货地址: order.receiver_address || '',
            客户代码: order.customer_code || '',
            客户名称: order.customer_name || '',
            业务员: order.salesperson || '',
            跟单员: order.operator_name || '',
            备注: order.remark || '',
          });
        }
        dispatchedCount += 1;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    if (dispatchedCount === 0) {
      return NextResponse.json({ success: false, error: errors.join('；') || '没有订单成功派发' }, { status: 400 });
    }

    const workbook = XLSX.utils.book_new();
    for (const [supplierName, rows] of Object.entries(rowsBySupplier)) {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 16 }, { wch: 36 },
        { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 12 }, { wch: 16 },
        { wch: 48 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 24 },
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, supplierName.slice(0, 31));
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const base64 = buffer.toString('base64');

    return NextResponse.json({
      success: errors.length === 0,
      data: {
        batchNo,
        filename: `${batchNo}.xlsx`,
        content: base64,
        sheets: Object.keys(rowsBySupplier),
        totalOrders: dispatchedCount,
        suppliersCount: Object.keys(rowsBySupplier).length,
        errors,
      },
      message: `派发完成：成功 ${dispatchedCount} 条${errors.length ? `，失败 ${errors.length} 条` : ''}`,
    });
  } catch (error) {
    console.error('派发导出失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
