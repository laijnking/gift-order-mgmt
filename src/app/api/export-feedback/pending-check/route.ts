import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { CUSTOMER_FEEDBACK_SOURCE_STATUSES } from '@/lib/order-status';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 导出前校验订单回单状态
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'orders:export');
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerIds } = body;

    if (!customerIds || !Array.isArray(customerIds)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const results = [];

    for (const customerId of customerIds) {
      // 获取可用于客户反馈导出的订单
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('id, order_no, customer_order_no, tracking_no, assigned_at, returned_at, completed_at, status')
        .eq('customer_id', customerId)
        .in('status', CUSTOMER_FEEDBACK_SOURCE_STATUSES);

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);

      // 获取客户信息
      const { data: customer } = await client
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();

      const shippedOrders = orders?.filter(o => o.tracking_no && o.tracking_no.trim() !== '') || [];
      const pendingOrders = orders?.filter(o => !o.tracking_no || o.tracking_no.trim() === '') || [];

      results.push({
        customerId,
        customerName: customer?.name || '未知客户',
        totalOrderCount: orders?.length || 0,
        shippedOrderCount: shippedOrders.length,
        pendingReceiptCount: pendingOrders.length,
        pendingOrders: pendingOrders.map(o => ({
          orderId: o.id,
          orderNo: o.order_no,
          customerOrderNo: o.customer_order_no,
        })),
      });
    }

    // 计算汇总
    const summary = {
      totalCustomers: results.length,
      totalOrders: results.reduce((sum, r) => sum + r.totalOrderCount, 0),
      shippedOrders: results.reduce((sum, r) => sum + r.shippedOrderCount, 0),
      pendingReceipts: results.reduce((sum, r) => sum + r.pendingReceiptCount, 0),
    };

    // 检查是否有待回单订单
    const hasPendingReceipts = summary.pendingReceipts > 0;

    return NextResponse.json({
      success: true,
      data: {
        summary,
        details: results,
        hasPendingReceipts,
        warning: hasPendingReceipts 
          ? `共有${summary.pendingReceipts}个订单尚未回单导入，快递信息将为空`
          : null,
      },
    });
  } catch (error) {
    console.error('校验订单回单状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
