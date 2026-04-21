import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 获取历史成本库列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_VIEW);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('orderNo');
    const supplierId = searchParams.get('supplierId');
    const productCode = searchParams.get('productCode');
    const customerCode = searchParams.get('customerCode');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    let query = client
      .from('order_cost_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (orderNo) {
      query = query.ilike('order_no', `%${orderNo}%`);
    }
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (productCode) {
      query = query.ilike('product_code', `%${productCode}%`);
    }
    if (customerCode) {
      query = query.ilike('customer_code', `%${customerCode}%`);
    }
    if (startDate) {
      query = query.gte('order_date', startDate);
    }
    if (endDate) {
      query = query.lte('order_date', endDate);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`查询历史成本失败: ${error.message}`);

    const orderIds = Array.from(
      new Set((data || []).map((item) => item.order_id).filter((value): value is string => Boolean(value)))
    );
    const orderSummaryMap = new Map<string, {
      expressFee: number;
      otherFee: number;
      totalAmount: number;
      totalCost: number;
      lineCount: number;
    }>();

    if (orderIds.length > 0) {
      const { data: summaryRows, error: summaryError } = await client
        .from('order_cost_history')
        .select('order_id, express_fee, other_fee, total_amount, total_cost')
        .in('order_id', orderIds);

      if (summaryError) throw new Error(`查询历史成本汇总失败: ${summaryError.message}`);

      for (const row of (summaryRows || [])) {
        const orderId = row.order_id;
        if (!orderId) continue;

        const current = orderSummaryMap.get(orderId) || {
          expressFee: 0,
          otherFee: 0,
          totalAmount: 0,
          totalCost: 0,
          lineCount: 0,
        };

        current.expressFee += parseFloat(String(row.express_fee || 0));
        current.otherFee += parseFloat(String(row.other_fee || 0));
        current.totalAmount += parseFloat(String(row.total_amount || 0));
        current.totalCost += parseFloat(String(row.total_cost || 0));
        current.lineCount += 1;
        orderSummaryMap.set(orderId, current);
      }
    }

    // 获取汇总统计
    let statsQuery = client
      .from('order_cost_history')
      .select('total_cost, express_fee, other_fee, total_amount, quantity');

    if (supplierId) {
      statsQuery = statsQuery.eq('supplier_id', supplierId);
    }
    if (productCode) {
      statsQuery = statsQuery.ilike('product_code', `%${productCode}%`);
    }
    if (customerCode) {
      statsQuery = statsQuery.ilike('customer_code', `%${customerCode}%`);
    }
    if (startDate) {
      statsQuery = statsQuery.gte('order_date', startDate);
    }
    if (endDate) {
      statsQuery = statsQuery.lte('order_date', endDate);
    }

    const { data: statsData } = await statsQuery;

    const stats = {
      totalQuantity: 0,
      totalCost: 0,
      totalExpressFee: 0,
      totalOtherFee: 0,
      totalAmount: 0
    };

    if (statsData) {
      statsData.forEach((item: Record<string, number | null>) => {
        stats.totalQuantity += item.quantity || 0;
        stats.totalCost += parseFloat(String(item.total_cost || 0));
        stats.totalExpressFee += parseFloat(String(item.express_fee || 0));
        stats.totalOtherFee += parseFloat(String(item.other_fee || 0));
        stats.totalAmount += parseFloat(String(item.total_amount || 0));
      });
    }

    // 转换数据格式
    const history = (data || []).map(h => ({
      id: h.id,
      orderId: h.order_id,
      orderNo: h.order_no,
      matchCode: h.match_code,
      supplierId: h.supplier_id,
      supplierName: h.supplier_name,
      warehouseId: h.warehouse_id,
      warehouseName: h.warehouse_name,
      productCode: h.product_code,
      productName: h.product_name,
      quantity: h.quantity,
      unitCost: h.unit_cost,
      totalCost: h.total_cost,
      expressFee: h.express_fee,
      otherFee: h.other_fee,
      totalAmount: h.total_amount,
      orderExpressFee: orderSummaryMap.get(h.order_id)?.expressFee ?? h.express_fee ?? 0,
      orderOtherFee: orderSummaryMap.get(h.order_id)?.otherFee ?? h.other_fee ?? 0,
      orderTotalAmount: orderSummaryMap.get(h.order_id)?.totalAmount ?? h.total_amount ?? 0,
      orderGoodsCost: orderSummaryMap.get(h.order_id)?.totalCost ?? h.total_cost ?? 0,
      orderLineCount: orderSummaryMap.get(h.order_id)?.lineCount ?? 1,
      expressCompany: h.express_company,
      trackingNo: h.tracking_no,
      receiverName: h.receiver_name,
      receiverPhone: h.receiver_phone,
      receiverAddress: h.receiver_address,
      customerCode: h.customer_code,
      customerName: h.customer_name,
      salesperson: h.salesperson,
      operatorName: h.operator_name,
      orderDate: h.order_date,
      shippedDate: h.shipped_date,
      returnedDate: h.returned_date,
      dispatchBatch: h.dispatch_batch,
      remark: h.remark,
      createdAt: h.created_at,
      updatedAt: h.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: history,
      stats,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });

  } catch (error) {
    console.error('查询历史成本失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 批量导入历史成本（从订单数据）
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { orderIds, startDate, endDate } = body;

    // 如果指定了订单ID，导入指定订单
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .in('id', orderIds);

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
      if (!orders || orders.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: '未找到订单' 
        }, { status: 404 });
      }

      await importOrders(client, orders);
      return NextResponse.json({
        success: true,
        message: `成功导入 ${orders.length} 条订单成本数据`
      });
    }

    // 如果指定了日期范围，导入该范围内的订单
    if (startDate && endDate) {
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
      if (!orders || orders.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: '该日期范围内未找到订单' 
        }, { status: 404 });
      }

      await importOrders(client, orders);
      return NextResponse.json({
        success: true,
        message: `成功导入 ${orders.length} 条订单成本数据`
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: '请提供订单ID列表或日期范围' 
    }, { status: 400 });

  } catch (error) {
    console.error('导入历史成本失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 辅助函数：导入订单到历史成本库
async function importOrders(client: ReturnType<typeof getSupabaseClient>, orders: Record<string, unknown>[]) {
  // 获取供应商和仓库信息
  const { data: suppliers } = await client.from('suppliers').select('*');
  const { data: warehouses } = await client.from('warehouses').select('*');

  const supplierMap = new Map((suppliers || []).map((s: Record<string, unknown>) => [s.id, s]));
  const warehouseMap = new Map((warehouses || []).map((w: Record<string, unknown>) => [w.id, w]));

  const historyRecords = [];
  const now = new Date().toISOString();

  for (const order of orders) {
    const items = (order.items as { product_name?: string; product_code?: string; quantity?: number; price?: number; amount?: number }[]) || [];
    
    const supplier = supplierMap.get(order.supplier_id as string);
    const warehouse = warehouseMap.get(order.warehouse_id as string);

    // 为每个商品创建一条记录
    for (const item of items) {
      const unitCost = parseFloat(String(item.price || 0));
      const quantity = parseInt(String(item.quantity || 0));
      const itemAmount = parseFloat(String(item.amount || 0));

      historyRecords.push({
        order_id: order.id,
        order_no: order.order_no,
        match_code: order.match_code,
        supplier_id: order.supplier_id,
        supplier_name: supplier?.name || order.supplier_name || '',
        warehouse_id: order.warehouse_id,
        warehouse_name: warehouse?.name || order.warehouse_name || '',
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: quantity,
        unit_cost: unitCost,
        total_cost: isNaN(itemAmount) ? 0 : itemAmount,
        express_fee: order.express_fee ? parseFloat(String(order.express_fee)) : 0,
        other_fee: order.other_fee ? parseFloat(String(order.other_fee)) : 0,
        total_amount: isNaN(itemAmount) ? 0 : itemAmount,
        express_company: order.express_company || '',
        tracking_no: order.tracking_no || '',
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address,
        customer_code: order.customer_code,
        customer_name: order.customer_name,
        salesperson: order.salesperson,
        operator_name: order.operator_name,
        order_date: order.created_at ? (order.created_at as string).split('T')[0] : null,
        shipped_date: order.assigned_at ? (order.assigned_at as string).split('T')[0] : null,
        returned_date: order.returned_at ? (order.returned_at as string).split('T')[0] : null,
        dispatch_batch: order.assigned_batch,
        remark: order.remark || '',
        created_at: now,
        updated_at: now
      });
    }

    // 如果订单没有商品，也创建一条记录
    if (items.length === 0) {
      const supplier = supplierMap.get(order.supplier_id as string);
      const warehouse = warehouseMap.get(order.warehouse_id as string);

      historyRecords.push({
        order_id: order.id,
        order_no: order.order_no,
        match_code: order.match_code,
        supplier_id: order.supplier_id,
        supplier_name: supplier?.name || order.supplier_name || '',
        warehouse_id: order.warehouse_id,
        warehouse_name: warehouse?.name || order.warehouse_name || '',
        product_code: '',
        product_name: '',
        quantity: 0,
        unit_cost: 0,
        total_cost: parseFloat(String(order.amount || 0)),
        express_fee: order.express_fee ? parseFloat(String(order.express_fee)) : 0,
        other_fee: order.other_fee ? parseFloat(String(order.other_fee)) : 0,
        total_amount: parseFloat(String(order.amount || 0)),
        express_company: order.express_company || '',
        tracking_no: order.tracking_no || '',
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address,
        customer_code: order.customer_code,
        customer_name: order.customer_name,
        salesperson: order.salesperson,
        operator_name: order.operator_name,
        order_date: order.created_at ? (order.created_at as string).split('T')[0] : null,
        shipped_date: order.assigned_at ? (order.assigned_at as string).split('T')[0] : null,
        returned_date: order.returned_at ? (order.returned_at as string).split('T')[0] : null,
        dispatch_batch: order.assigned_batch,
        remark: order.remark || '',
        created_at: now,
        updated_at: now
      });
    }
  }

  if (historyRecords.length > 0) {
    const { error } = await client
      .from('order_cost_history')
      .insert(historyRecords);

    if (error) throw new Error(`导入历史成本失败: ${error.message}`);
  }
}
