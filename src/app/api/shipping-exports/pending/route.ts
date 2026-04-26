import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取待发货供应商列表（从订单出发，只返回有待发货的供应商）
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';

  try {
    // 第一步：从 pending/assigned 订单中找出所有有供应商的订单
    const { data: pendingOrders, error: ordersError } = await client
      .from('orders')
      .select('id, supplier_id, supplier_name, status')
      .in('status', ['pending', 'assigned'])
      .or('supplier_id.not.is.null,supplier_name.not.is.null');

    if (ordersError) throw new Error(`查询待发货订单失败: ${ordersError.message}`);

    // 第二步：从第一步结果中找出已分配供应商的订单
    const assignedOrders = (pendingOrders || []).filter(
      (o) => o.supplier_id || o.supplier_name
    );

    if (assignedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        unassignedCount: (pendingOrders || []).length,
      });
    }

    // 第三步：查询 export_records，标记出哪些订单已经导出发货通知单
    // order_ids 是 text[] 数组列，用 overlaps (PostgreSQL &&) 判断是否有交集
    const allOrderIds = assignedOrders.map((o) => o.id);
    const { data: exportRecords } = await client
      .from('export_records')
      .select('order_ids')
      .eq('export_type', 'shipping_notice')
      .overlaps('order_ids', allOrderIds);

    // 收集所有已导出的订单ID
    const exportedOrderIds = new Set<string>();
    for (const record of (exportRecords || [])) {
      for (const id of (record.order_ids || [])) {
        exportedOrderIds.add(id);
      }
    }

    // 第四步：过滤出"未导出"的订单（已派发但未在 export_records 中）
    const unexportedOrders = assignedOrders.filter((o) => !exportedOrderIds.has(o.id));

    // 第五步：从未导出订单中收集供应商 ID 和 name
    const supplierIds = [...new Set(
      unexportedOrders
        .map((o) => o.supplier_id)
        .filter(Boolean)
    )];
    const supplierNames = [...new Set(
      unexportedOrders
        .map((o) => o.supplier_name)
        .filter(Boolean)
    )];

    if (unexportedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        unassignedCount: (pendingOrders || []).filter(
          (o) => !o.supplier_id && !o.supplier_name
        ).length,
      });
    }

    // 第六步：查询供应商信息
    let supplierQuery = client.from('suppliers').select('*');
    if (supplierIds.length > 0 && supplierNames.length > 0) {
      supplierQuery = supplierQuery.or(
        `id.in.(${supplierIds.join(',')}),name.in.(${supplierNames.map(n => `"${n}"`).join(',')})`
      );
    } else if (supplierIds.length > 0) {
      supplierQuery = supplierQuery.in('id', supplierIds);
    } else {
      supplierQuery = supplierQuery.in('name', supplierNames);
    }

    if (status !== 'all') {
      supplierQuery = supplierQuery.eq('is_active', status === 'active');
    }

    const { data: suppliers, error: suppliersError } = await supplierQuery;
    if (suppliersError) throw new Error(`查询供应商失败: ${suppliersError.message}`);

    // 第七步：为每个供应商计算未导出订单数，并获取上次导出时间
    const results = [];
    for (const supplier of (suppliers || [])) {
      // 按 supplier_id 精确匹配
      const { data: ordersById } = supplier.id
        ? await client
            .from('orders')
            .select('id, status')
            .eq('supplier_id', supplier.id)
            .in('status', ['pending', 'assigned'])
        : { data: [] };

      // 按 supplier_name 匹配 supplier_id 为 null 的订单
      const { data: ordersByName } = supplier.name
        ? await client
            .from('orders')
            .select('id, status')
            .is('supplier_id', null)
            .eq('supplier_name', supplier.name)
            .in('status', ['pending', 'assigned'])
        : { data: [] };

      // 合并去重，过滤掉已导出的
      const allIds = new Set([
        ...(ordersById || []).map((o) => o.id),
        ...(ordersByName || []).map((o) => o.id),
      ]);

      const unexportedCount = [...allIds].filter((id) => !exportedOrderIds.has(id)).length;

      // 跳过 pending=0 的供应商（不显示）
      if (unexportedCount === 0) continue;

      // 获取上次导出记录
      const { data: lastExport } = await client
        .from('export_records')
        .select('created_at')
        .eq('supplier_id', supplier.id)
        .eq('export_type', 'shipping_notice')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      results.push({
        id: supplier.id,
        name: supplier.name,
        code: (supplier as Record<string, unknown>).code as string || String(supplier.id).slice(0, 8),
        type: supplier.type,
        pendingOrderCount: unexportedCount,
        lastExportTime: lastExport?.created_at || null,
      });
    }

    // 第八步：统计完全未分配供应商的订单数
    const unassignedCount = (pendingOrders || []).filter(
      (o) => !o.supplier_id && !o.supplier_name
    ).length;

    // 按 pending 数量降序，上次导出时间升序（未导出的在前）
    results.sort((a, b) => {
      if (b.pendingOrderCount !== a.pendingOrderCount) {
        return b.pendingOrderCount - a.pendingOrderCount;
      }
      if (a.lastExportTime !== b.lastExportTime) {
        return a.lastExportTime ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: results,
      unassignedCount,
    });
  } catch (error) {
    console.error('获取待发货供应商列表失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
