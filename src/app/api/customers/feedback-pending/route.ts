import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取有待导出（已回单）订单的客户列表
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  try {
    // 查询有 returned 状态订单的客户
    let query = client
      .from('orders')
      .select(`
        customer_id,
        status,
        tracking_no
      `)
      .eq('status', 'returned');

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_code.ilike.%${search}%`);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }

    // 按客户 ID 分组统计
    const customerStats = new Map<string, { returnedOrderCount: number }>();

    for (const order of orders) {
      if (!order.customer_id) continue;
      const existing = customerStats.get(order.customer_id);
      if (existing) {
        existing.returnedOrderCount++;
      } else {
        customerStats.set(order.customer_id, { returnedOrderCount: 1 });
      }
    }

    // 获取客户详情
    const customerIds = Array.from(customerStats.keys());
    const { data: customers, error: customersError } = await client
      .from('customers')
      .select('id, name, code')
      .in('id', customerIds)
      .order('name');

    if (customersError) throw new Error(`查询客户失败: ${customersError.message}`);

    // 合并数据
    const result = (customers || []).map((customer) => {
      const stats = customerStats.get(customer.id) || { returnedOrderCount: 0 };
      return {
        id: customer.id,
        name: customer.name,
        code: customer.code,
        returnedOrderCount: stats.returnedOrderCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('获取待导出客户列表失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
