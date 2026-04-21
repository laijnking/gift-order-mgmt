import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { ORDER_STATUS_ASSIGNED, ORDER_STATUS_PARTIAL_RETURNED, ORDER_STATUS_RETURNED, ORDER_STATUS_FEEDBACKED, ORDER_STATUS_COMPLETED } from '@/lib/order-status';

// 获取回单时效分析数据
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.DASHBOARD_VIEW);
  if (authError) return authError;
  try {
    const supabase = await getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString().slice(0, 10);

    // 查询已完成和已回传的订单
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .in('status', [ORDER_STATUS_ASSIGNED, ORDER_STATUS_PARTIAL_RETURNED, ORDER_STATUS_RETURNED, ORDER_STATUS_FEEDBACKED, ORDER_STATUS_COMPLETED]);

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

    // 计算时效数据
    interface OrderTiming {
      orderId: string;
      sysOrderNo: string;
      createdAt: string;
      assignedAt: string | null;
      returnedAt: string | null;
      completedAt: string | null;
      trackingNo: string;
      expressCompany: string;
      supplierName: string;
      customerName: string;
      // 时效天数
      dispatchDays: number | null;  // 下单到派发
      returnDays: number | null;     // 派发到回传
      totalDays: number | null;      // 下单到完成
    }

    const timingData: OrderTiming[] = [];
    const dispatchDaysList: number[] = [];
    const returnDaysList: number[] = [];
    const totalDaysList: number[] = [];

    allOrders.forEach(order => {
      const createdAt = order.created_at ? new Date(order.created_at) : null;
      const assignedAt = order.assigned_at ? new Date(order.assigned_at) : null;
      const returnedAt = order.returned_at ? new Date(order.returned_at) : null;
      const completedAt = order.completed_at ? new Date(order.completed_at) : null;

      // 计算时效天数
      let dispatchDays: number | null = null;
      let returnDays: number | null = null;
      let totalDays: number | null = null;

      if (createdAt && assignedAt) {
        dispatchDays = Math.ceil((assignedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        dispatchDaysList.push(dispatchDays);
      }

      if (assignedAt && returnedAt) {
        returnDays = Math.ceil((returnedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60 * 24));
        returnDaysList.push(returnDays);
      }

      if (createdAt && (returnedAt || completedAt)) {
        const endDate = returnedAt || completedAt;
        if (endDate) {
          totalDays = Math.ceil((endDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          totalDaysList.push(totalDays);
        }
      }

      timingData.push({
        orderId: order.id,
        sysOrderNo: order.sys_order_no || order.sysOrderNo || '',
        createdAt: order.created_at || '',
        assignedAt: order.assigned_at || null,
        returnedAt: order.returned_at || null,
        completedAt: order.completed_at || null,
        trackingNo: order.tracking_no || order.trackingNo || '',
        expressCompany: order.express_company || order.expressCompany || '',
        supplierName: order.supplier_name || order.supplierName || '',
        customerName: order.customer_name || order.customerName || '',
        dispatchDays,
        returnDays,
        totalDays,
      });
    });

    // 计算平均时效
    const calcAvg = (arr: number[]) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '0';
    const calcMedian = (arr: number[]) => {
      if (arr.length === 0) return '0';
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? String(sorted[mid]) : ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
    };

    // 时效分布
    const dispatchDistribution: Record<string, number> = {
      '0-1天': 0,
      '2-3天': 0,
      '4-7天': 0,
      '8-14天': 0,
      '15天以上': 0,
    };
    const returnDistribution: Record<string, number> = {
      '0-1天': 0,
      '2-3天': 0,
      '4-7天': 0,
      '8-14天': 0,
      '15天以上': 0,
    };

    dispatchDaysList.forEach(days => {
      if (days <= 1) dispatchDistribution['0-1天']++;
      else if (days <= 3) dispatchDistribution['2-3天']++;
      else if (days <= 7) dispatchDistribution['4-7天']++;
      else if (days <= 14) dispatchDistribution['8-14天']++;
      else dispatchDistribution['15天以上']++;
    });

    returnDaysList.forEach(days => {
      if (days <= 1) returnDistribution['0-1天']++;
      else if (days <= 3) returnDistribution['2-3天']++;
      else if (days <= 7) returnDistribution['4-7天']++;
      else if (days <= 14) returnDistribution['8-14天']++;
      else returnDistribution['15天以上']++;
    });

    // 按快递公司统计
    const byExpress: Record<string, {
      company: string;
      orderCount: number;
      avgReturnDays: number[];
      totalDays: number;
    }> = {};

    timingData.forEach(t => {
      if (!t.expressCompany) return;
      if (!byExpress[t.expressCompany]) {
        byExpress[t.expressCompany] = {
          company: t.expressCompany,
          orderCount: 0,
          avgReturnDays: [],
          totalDays: 0,
        };
      }
      byExpress[t.expressCompany].orderCount++;
      if (t.returnDays !== null) {
        byExpress[t.expressCompany].avgReturnDays.push(t.returnDays);
        byExpress[t.expressCompany].totalDays += t.returnDays;
      }
    });

    const expressStats = Object.values(byExpress)
      .map(item => ({
        company: item.company,
        orderCount: item.orderCount,
        avgReturnDays: item.avgReturnDays.length > 0
          ? (item.totalDays / item.avgReturnDays.length).toFixed(1)
          : '0',
      }))
      .sort((a, b) => parseFloat(b.avgReturnDays) - parseFloat(a.avgReturnDays));

    // 按供应商统计
    const bySupplier: Record<string, {
      name: string;
      orderCount: number;
      avgReturnDays: number[];
      totalDays: number;
    }> = {};

    timingData.forEach(t => {
      const name = t.supplierName || '未知供应商';
      if (!bySupplier[name]) {
        bySupplier[name] = {
          name,
          orderCount: 0,
          avgReturnDays: [],
          totalDays: 0,
        };
      }
      bySupplier[name].orderCount++;
      if (t.returnDays !== null) {
        bySupplier[name].avgReturnDays.push(t.returnDays);
        bySupplier[name].totalDays += t.returnDays;
      }
    });

    const supplierStats = Object.values(bySupplier)
      .map(item => ({
        name: item.name,
        orderCount: item.orderCount,
        avgReturnDays: item.avgReturnDays.length > 0
          ? (item.totalDays / item.avgReturnDays.length).toFixed(1)
          : '0',
      }))
      .sort((a, b) => parseFloat(b.avgReturnDays) - parseFloat(a.avgReturnDays))
      .slice(0, 10);

    // 汇总统计
    const summary = {
      totalOrders: allOrders.length,
      ordersWithDispatch: dispatchDaysList.length,
      ordersWithReturn: returnDaysList.length,
      avgDispatchDays: calcAvg(dispatchDaysList),
      avgReturnDays: calcAvg(returnDaysList),
      avgTotalDays: calcAvg(totalDaysList),
      medianDispatchDays: calcMedian(dispatchDaysList),
      medianReturnDays: calcMedian(returnDaysList),
      medianTotalDays: calcMedian(totalDaysList),
      dispatchOnTimeRate: dispatchDaysList.filter(d => d <= 1).length > 0
        ? Math.round((dispatchDaysList.filter(d => d <= 1).length / dispatchDaysList.length) * 100)
        : 0,
      returnOnTimeRate: returnDaysList.filter(d => d <= 3).length > 0
        ? Math.round((returnDaysList.filter(d => d <= 3).length / returnDaysList.length) * 100)
        : 0,
    };

    // 时效明细
    const timingList = timingData
      .filter(t => t.totalDays !== null)
      .sort((a, b) => (b.totalDays || 0) - (a.totalDays || 0))
      .slice(0, 50);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        dispatchDistribution: Object.entries(dispatchDistribution).map(([range, count]) => ({ range, count })),
        returnDistribution: Object.entries(returnDistribution).map(([range, count]) => ({ range, count })),
        byExpress: expressStats,
        bySupplier: supplierStats,
        timingList,
      },
    });
  } catch (error) {
    console.error('回单时效分析查询错误:', error);
    return NextResponse.json(
      { success: false, error: '获取回单时效分析数据失败' },
      { status: 500 }
    );
  }
}
