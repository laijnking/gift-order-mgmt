import { NextRequest, NextResponse } from 'next/server';
import { isReturnProgressStatus } from '@/lib/order-status';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

// 获取销售业绩数据
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'dashboard:view');
  if (authError) return authError;
  try {
    const supabase = await getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString().slice(0, 10);
    const groupBy = searchParams.get('groupBy') || 'salesperson'; // salesperson, operator, customer

    // 构建日期筛选
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      orderQuery = orderQuery
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');
    }

    const { data: orders, error } = await orderQuery;

    if (error) {
      console.error('订单查询错误:', error);
      return NextResponse.json(
        { success: false, error: '查询订单失败' },
        { status: 500 }
      );
    }

    const allOrders = orders || [];

    // 按业务员统计
    const bySalesperson: Record<string, {
      name: string;
      orderCount: number;
      pendingCount: number;
      assignedCount: number;
      returnedCount: number;
      completedCount: number;
      cancelledCount: number;
      totalQuantity: number;
    }> = {};

    // 按跟单员统计
    const byOperator: Record<string, {
      name: string;
      orderCount: number;
      pendingCount: number;
      assignedCount: number;
      returnedCount: number;
      completedCount: number;
      cancelledCount: number;
      totalQuantity: number;
    }> = {};

    // 按客户统计
    const byCustomer: Record<string, {
      name: string;
      orderCount: number;
      totalQuantity: number;
    }> = {};

    allOrders.forEach(order => {
      const salesperson = order.salesperson_name || order.salespersonName || '未分配';
      const operator = order.operator_name || order.operatorName || '未分配';
      const customer = order.customer_name || order.customerName || '未知客户';

      // 初始化
      if (!bySalesperson[salesperson]) {
        bySalesperson[salesperson] = {
          name: salesperson,
          orderCount: 0,
          pendingCount: 0,
          assignedCount: 0,
          returnedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          totalQuantity: 0,
        };
      }

      if (!byOperator[operator]) {
        byOperator[operator] = {
          name: operator,
          orderCount: 0,
          pendingCount: 0,
          assignedCount: 0,
          returnedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          totalQuantity: 0,
        };
      }

      if (!byCustomer[customer]) {
        byCustomer[customer] = {
          name: customer,
          orderCount: 0,
          totalQuantity: 0,
        };
      }

      // 累计
      bySalesperson[salesperson].orderCount++;
      byOperator[operator].orderCount++;
      byCustomer[customer].orderCount++;

      // 状态统计
      if (order.status === 'pending') {
        bySalesperson[salesperson].pendingCount++;
        byOperator[operator].pendingCount++;
      } else if (order.status === 'assigned') {
        bySalesperson[salesperson].assignedCount++;
        byOperator[operator].assignedCount++;
      } else if (isReturnProgressStatus(order.status)) {
        bySalesperson[salesperson].returnedCount++;
        byOperator[operator].returnedCount++;
      } else if (order.status === 'completed') {
        bySalesperson[salesperson].completedCount++;
        byOperator[operator].completedCount++;
      } else if (order.status === 'cancelled') {
        bySalesperson[salesperson].cancelledCount++;
        byOperator[operator].cancelledCount++;
      }

      // 商品数量
      const items = order.items || [];
      const qty = items.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.quantity as number) || 1), 0);
      bySalesperson[salesperson].totalQuantity += qty;
      byOperator[operator].totalQuantity += qty;
      byCustomer[customer].totalQuantity += qty;
    });

    // 计算完成率
    const calculateCompletionRate = (data: { orderCount: number; completedCount: number }) => {
      if (data.orderCount === 0) return 0;
      return Math.round((data.completedCount / data.orderCount) * 100);
    };

    // 排序并格式化
    const salespersonList = Object.values(bySalesperson)
      .map(item => ({
        ...item,
        completionRate: calculateCompletionRate(item),
      }))
      .sort((a, b) => b.orderCount - a.orderCount);

    const operatorList = Object.values(byOperator)
      .map(item => ({
        ...item,
        completionRate: calculateCompletionRate(item),
      }))
      .sort((a, b) => b.orderCount - a.orderCount);

    const customerList = Object.values(byCustomer)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 20);

    // 汇总统计
    const summary = {
      totalOrders: allOrders.length,
      totalSalesperson: Object.keys(bySalesperson).length,
      totalOperator: Object.keys(byOperator).length,
      avgOrdersPerSalesperson: Object.keys(bySalesperson).length > 0
        ? Math.round(allOrders.length / Object.keys(bySalesperson).length)
        : 0,
      avgOrdersPerOperator: Object.keys(byOperator).length > 0
        ? Math.round(allOrders.length / Object.keys(byOperator).length)
        : 0,
    };

    // 按时间统计趋势（按月）
    const monthlyTrend: Record<string, { month: string; salesperson: Record<string, number> }> = {};
    allOrders.forEach(order => {
      const month = order.created_at?.slice(0, 7) || '';
      const salesperson = order.salesperson_name || order.salespersonName || '未分配';

      if (!monthlyTrend[month]) {
        monthlyTrend[month] = { month, salesperson: {} };
      }
      monthlyTrend[month].salesperson[salesperson] = (monthlyTrend[month].salesperson[salesperson] || 0) + 1;
    });

    const trendData = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month,
        ...data.salesperson,
      }));

    return NextResponse.json({
      success: true,
      data: {
        bySalesperson: salespersonList,
        byOperator: operatorList,
        byCustomer: customerList,
        summary,
        trend: trendData,
      },
    });
  } catch (error) {
    console.error('销售业绩查询错误:', error);
    return NextResponse.json(
      { success: false, error: '获取销售业绩数据失败' },
      { status: 500 }
    );
  }
}
