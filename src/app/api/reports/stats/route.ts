import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取报表统计数据
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString().slice(0, 10);
    const groupBy = searchParams.get('groupBy') || 'day'; // day, week, month

    // 构建日期筛选
    let dateFilter = '';
    const params: Record<string, string> = {};
    if (startDate) {
      dateFilter = `created_at >= '${startDate}' AND created_at <= '${endDate}'`;
      params.startDate = startDate;
      params.endDate = endDate;
    }

    // 1. 订单统计
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate) {
      orderQuery = orderQuery
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');
    }

    const { data: orders, error: ordersError } = await orderQuery;

    if (ordersError) {
      console.error('订单查询错误:', ordersError);
    }

    const allOrders = orders || [];

    // 订单状态统计
    const orderStatusStats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      assigned: allOrders.filter(o => o.status === 'assigned').length,
      partial_returned: allOrders.filter(o => o.status === 'partial_returned').length,
      returned: allOrders.filter(o => o.status === 'returned').length,
      feedbacked: allOrders.filter(o => o.status === 'feedbacked').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    };

    // 2. 按时间维度统计订单
    const orderTrend: Record<string, number> = {};
    allOrders.forEach(order => {
      const date = order.created_at?.slice(0, 10) || '';
      if (date) {
        orderTrend[date] = (orderTrend[date] || 0) + 1;
      }
    });

    // 按周/月聚合
    const aggregatedTrend: Record<string, number> = {};
    Object.entries(orderTrend).forEach(([date, count]) => {
      const d = new Date(date);
      let key = date;
      if (groupBy === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().slice(0, 10);
      } else if (groupBy === 'month') {
        key = date.slice(0, 7);
      }
      aggregatedTrend[key] = (aggregatedTrend[key] || 0) + count;
    });

    // 3. 客户统计
    const { data: customers } = await supabase
      .from('customers')
      .select('*');

    const allCustomers = customers || [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const customerStats = {
      total: allCustomers.length,
      active: allCustomers.filter(c => c.is_active !== false).length,
      newThisMonth: allCustomers.filter(c => c.created_at >= monthStart).length,
    };

    // 4. 供应商统计
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*');

    const allSuppliers = suppliers || [];
    const supplierTypeStats: Record<string, number> = {};
    allSuppliers.forEach(s => {
      const type = s.type || 'other';
      supplierTypeStats[type] = (supplierTypeStats[type] || 0) + 1;
    });

    const supplierStats = {
      total: allSuppliers.length,
      active: allSuppliers.filter(s => s.status === 'active').length,
      byType: supplierTypeStats,
    };

    // 5. 库存统计
    const { data: stocks } = await supabase
      .from('stocks')
      .select('*');

    const allStocks = stocks || [];
    const stockStats = {
      totalProducts: allStocks.length,
      totalQuantity: allStocks.reduce((sum, s) => sum + (s.quantity || 0), 0),
      lowStock: allStocks.filter(s => s.quantity <= 2 && s.quantity > 0).length,
      outOfStock: allStocks.filter(s => s.quantity === 0).length,
      totalValue: allStocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.price || 0)), 0),
    };

    // 6. 商品销售排行
    const productSales: Record<string, { name: string; quantity: number; amount: number }> = {};
    allOrders.forEach(order => {
      const items = order.items || [];
      items.forEach((item: Record<string, unknown>) => {
        const name = (item.productName as string) || (item.product_name as string) || '未知商品';
        const quantity = (item.quantity as number) || 1;
        const price = (item.unitPrice as number) || (item.unit_price as number) || 0;
        if (!productSales[name]) {
          productSales[name] = { name, quantity: 0, amount: 0 };
        }
        productSales[name].quantity += quantity;
        productSales[name].amount += quantity * price;
      });
    });

    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(([name, data]) => ({ name, quantity: data.quantity, amount: data.amount }));

    // 7. 订单来源统计（按客户分组）
    const orderByCustomer: Record<string, number> = {};
    allOrders.forEach(order => {
      const customerName = order.customer_name || order.customerName || '未知客户';
      orderByCustomer[customerName] = (orderByCustomer[customerName] || 0) + 1;
    });

    const topCustomers = Object.entries(orderByCustomer)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([customerName, orderCount]) => ({ customerName, orderCount }));

    // 8. 快递使用统计
    const expressStats: Record<string, number> = {};
    allOrders.forEach(order => {
      const express = order.express_company || order.expressCompany || '未设置';
      expressStats[express] = (expressStats[express] || 0) + 1;
    });

    const topExpress = Object.entries(expressStats)
      .filter(([name]) => name !== '未设置')
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([expressCompany, count]) => ({ expressCompany, count }));

    return NextResponse.json({
      success: true,
      data: {
        orderStatus: orderStatusStats,
        orderTrend: Object.entries(aggregatedTrend)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        customer: customerStats,
        supplier: supplierStats,
        stock: stockStats,
        topProducts,
        topCustomers,
        topExpress,
        summary: {
          totalOrders: orderStatusStats.total,
          totalCustomers: customerStats.total,
          totalSuppliers: supplierStats.total,
          totalProducts: stockStats.totalProducts,
          avgOrdersPerDay: orderStatusStats.total / Math.max(1, Object.keys(orderTrend).length),
        },
      },
    });
  } catch (error) {
    console.error('报表统计错误:', error);
    return NextResponse.json(
      { success: false, error: '获取报表数据失败' },
      { status: 500 }
    );
  }
}
