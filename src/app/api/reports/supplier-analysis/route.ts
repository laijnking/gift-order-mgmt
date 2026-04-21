import { NextRequest, NextResponse } from 'next/server';
import { isReturnProgressStatus, ORDER_STATUS_PENDING, ORDER_STATUS_ASSIGNED, ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED } from '@/lib/order-status';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取供应商分析数据
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.DASHBOARD_VIEW);
  if (authError) return authError;
  try {
    const supabase = await getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || new Date().toISOString().slice(0, 10);

    // 查询所有供应商
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (supplierError) {
      console.error('供应商查询错误:', supplierError);
    }

    // 查询所有订单
    let orderQuery = supabase
      .from('orders')
      .select('*');

    if (startDate) {
      orderQuery = orderQuery
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59');
    }

    const { data: orders, error: orderError } = await orderQuery;

    if (orderError) {
      console.error('订单查询错误:', orderError);
    }

    const allOrders = orders || [];
    const allSuppliers = suppliers || [];

    // 按供应商统计
    const bySupplier: Record<string, {
      id: string;
      name: string;
      code: string;
      type: string;
      orderCount: number;
      totalQuantity: number;
      statusBreakdown: {
        pending: number;
        assigned: number;
        returned: number;
        completed: number;
        cancelled: number;
      };
      products: Record<string, number>;
      lastOrderDate: string | null;
    }> = {};

    // 初始化供应商统计
    allSuppliers.forEach(supplier => {
      const name = supplier.name || '未知供应商';
      bySupplier[supplier.id] = {
        id: supplier.id,
        name,
        code: supplier.code || '',
        type: supplier.type || 'supplier',
        orderCount: 0,
        totalQuantity: 0,
        statusBreakdown: {
          pending: 0,
          assigned: 0,
          returned: 0,
          completed: 0,
          cancelled: 0,
        },
        products: {},
        lastOrderDate: null,
      };
    });

    // 遍历订单，统计每个供应商的数据
    allOrders.forEach(order => {
      const supplierId = order.supplier_id || order.supplierId;
      const supplierName = order.supplier_name || order.supplierName || '';

      // 尝试通过名称匹配供应商
      let matchedSupplierId = supplierId;
      if (!matchedSupplierId && supplierName) {
        const matched = allSuppliers.find(s => s.name === supplierName);
        if (matched) {
          matchedSupplierId = matched.id;
        }
      }

      if (!matchedSupplierId) {
        // 未匹配的订单，创建一个虚拟供应商
        const unMatchedKey = '__unmatched__';
        if (!bySupplier[unMatchedKey]) {
          bySupplier[unMatchedKey] = {
            id: unMatchedKey,
            name: supplierName || '未分配供应商',
            code: '',
            type: 'supplier',
            orderCount: 0,
            totalQuantity: 0,
            statusBreakdown: {
              pending: 0,
              assigned: 0,
              returned: 0,
              completed: 0,
              cancelled: 0,
            },
            products: {},
            lastOrderDate: null,
          };
        }
        matchedSupplierId = unMatchedKey;
      }

      if (bySupplier[matchedSupplierId]) {
        bySupplier[matchedSupplierId].orderCount++;

        const items = order.items || [];
        const qty = items.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.quantity as number) || 1), 0);
        bySupplier[matchedSupplierId].totalQuantity += qty;

        // 商品明细
        items.forEach((item: Record<string, unknown>) => {
          const productName = (item.productName as string) || (item.product_name as string) || '未知商品';
          bySupplier[matchedSupplierId].products[productName] =
            (bySupplier[matchedSupplierId].products[productName] || 0) + ((item.quantity as number) || 1);
        });

        // 状态统计
        if (order.status === ORDER_STATUS_PENDING) {
          bySupplier[matchedSupplierId].statusBreakdown.pending++;
        } else if (order.status === ORDER_STATUS_ASSIGNED) {
          bySupplier[matchedSupplierId].statusBreakdown.assigned++;
        } else if (isReturnProgressStatus(order.status)) {
          bySupplier[matchedSupplierId].statusBreakdown.returned++;
        } else if (order.status === ORDER_STATUS_COMPLETED) {
          bySupplier[matchedSupplierId].statusBreakdown.completed++;
        } else if (order.status === ORDER_STATUS_CANCELLED) {
          bySupplier[matchedSupplierId].statusBreakdown.cancelled++;
        }

        // 最后订单时间
        const orderDate = order.created_at;
        const supplier = bySupplier[matchedSupplierId];
        if (orderDate && supplier && (!supplier.lastOrderDate || orderDate > supplier.lastOrderDate)) {
          supplier.lastOrderDate = orderDate;
        }
      }
    });

    // 计算完成率
    const supplierList = Object.values(bySupplier)
      .map(item => ({
        ...item,
        completionRate: item.orderCount > 0
          ? Math.round((item.statusBreakdown.completed / item.orderCount) * 100)
          : 0,
        activeRate: item.orderCount > 0
          ? Math.round(((item.statusBreakdown.completed + item.statusBreakdown.returned) / item.orderCount) * 100)
          : 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount);

    // 按类型汇总
    const byType: Record<string, {
      type: string;
      supplierCount: number;
      orderCount: number;
      totalQuantity: number;
    }> = {};

    supplierList.forEach(s => {
      if (!byType[s.type]) {
        byType[s.type] = {
          type: s.type,
          supplierCount: 0,
          orderCount: 0,
          totalQuantity: 0,
        };
      }
      if (s.id !== '__unmatched__') {
        byType[s.type].supplierCount++;
      }
      byType[s.type].orderCount += s.orderCount;
      byType[s.type].totalQuantity += s.totalQuantity;
    });

    // 热门供应商 TOP 10
    const topSuppliers = supplierList.slice(0, 10);

    // 汇总统计
    const summary = {
      totalSuppliers: allSuppliers.length,
      totalOrders: allOrders.length,
      avgOrdersPerSupplier: allSuppliers.length > 0
        ? Math.round(allOrders.length / allSuppliers.length)
        : 0,
      totalQuantity: supplierList.reduce((sum, s) => sum + s.totalQuantity, 0),
      unmatchedOrders: bySupplier['__unmatched__']?.orderCount || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        bySupplier: supplierList,
        byType: Object.values(byType),
        topSuppliers,
        summary,
      },
    });
  } catch (error) {
    console.error('供应商分析查询错误:', error);
    return NextResponse.json(
      { success: false, error: '获取供应商分析数据失败' },
      { status: 500 }
    );
  }
}
