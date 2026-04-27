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
    // 注：不在这里用 .or() 做服务器端过滤，避免 Supabase PostgREST 不支持 "not.is.null" 语法
    // 改为取全部订单后用 JS 过滤（见第二步）
    const { data: pendingOrders, error: ordersError } = await client
      .from('orders')
      .select('id, supplier_id, supplier_name, status')
      .in('status', ['pending', 'assigned']);

    if (ordersError) throw new Error(`查询待发货订单失败: ${ordersError.message}`);

    // 第二步：从第一步结果中找出已分配供应商的订单
    // 有 supplier_id OR 有非空 supplier_name（空字符串不算）
    const assignedOrders = (pendingOrders || []).filter(
      (o) => o.supplier_id || (o.supplier_name && o.supplier_name.trim() !== '')
    );

    if (assignedOrders.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        unassignedCount: (pendingOrders || []).filter(
          (o) => !o.supplier_id && (!o.supplier_name || o.supplier_name.trim() === '')
        ).length,
      });
    }

    // 第三步：查询 export_records，标记出哪些订单已经导出发货通知单
    const { data: allExportRecords } = await client
      .from('export_records')
      .select('order_ids')
      .eq('export_type', 'shipping_notice');

    // 收集所有已导出的订单ID（在内存中做交集）
    const exportedOrderIds = new Set<string>();
    for (const record of (allExportRecords || [])) {
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

    // 第六步：查询供应商信息，并补充未在 suppliers 表中存在或已停用的供应商名称
    // 分两次查询：先按 id 查，再按 name 查，然后合并
    const suppliersById = new Map<string, Record<string, unknown>>();
    const suppliersByName = new Map<string, Record<string, unknown>>();
    const knownSupplierNames = new Set<string>();

    if (supplierIds.length > 0) {
      const { data: byId } = await client.from('shippers').select('*').in('id', supplierIds);
      for (const s of (byId || [])) {
        if (status !== 'all' && (s as Record<string, unknown>).is_active !== (status === 'active')) continue;
        suppliersById.set(s.id, s);
        suppliersByName.set(String((s as Record<string, unknown>).name || ''), s);
        knownSupplierNames.add(String((s as Record<string, unknown>).name || ''));
      }
    }
    if (supplierNames.length > 0) {
      const { data: byName } = await client.from('shippers').select('*').in('name', supplierNames);
      for (const s of (byName || [])) {
        if (suppliersById.has(s.id)) continue;
        if (status !== 'all' && (s as Record<string, unknown>).is_active !== (status === 'active')) continue;
        suppliersById.set(s.id, s);
        suppliersByName.set(String((s as Record<string, unknown>).name || ''), s);
        knownSupplierNames.add(String((s as Record<string, unknown>).name || ''));
      }
    }

    // 收集需要补充的虚拟供应商条目：
    // - 按 supplier_name 匹配的订单中，supplier_name 在 shippers 表里找不到记录的
    // - 按 supplier_id 匹配的订单中，supplier_name 有值但对应的 supplier_id 不存在于 shippers 表的
    const syntheticNames = new Set<string>();
    for (const order of unexportedOrders) {
      if (order.supplier_id && !suppliersById.has(order.supplier_id) && order.supplier_name && order.supplier_name.trim() !== '') {
        // 有 supplier_id 但该 ID 不存在于 suppliers 表，且有 supplier_name → 补充虚拟条目
        syntheticNames.add(order.supplier_name);
      }
      if (!order.supplier_id && order.supplier_name && order.supplier_name.trim() !== '' && !knownSupplierNames.has(order.supplier_name)) {
        // 无 supplier_id，纯靠 supplier_name 匹配，且该名称不在 suppliers 表 → 补充虚拟条目
        syntheticNames.add(order.supplier_name);
      }
    }

    // 第七步：为每个供应商计算未导出订单数，并获取上次导出时间
    const results = [];

    // 7a. 处理有数据库记录的供应商
    for (const supplier of Array.from(suppliersById.values())) {
      const supplierId = supplier.id as string;
      const supplierName = String((supplier as Record<string, unknown>).name || '');
      const supplierCode = String((supplier as Record<string, unknown>).code || supplierId.slice(0, 8));

      // 按 supplier_id 精确匹配
      const { data: ordersById } = await client
        .from('orders')
        .select('id, status')
        .eq('supplier_id', supplierId)
        .in('status', ['pending', 'assigned']);

      // 按 supplier_name 匹配 supplier_id 为 null 的订单
      const { data: ordersByName } = supplierName
        ? await client
            .from('orders')
            .select('id, status')
            .is('supplier_id', null)
            .eq('supplier_name', supplierName)
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
        .eq('supplier_id', supplierId)
        .eq('export_type', 'shipping_notice')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      results.push({
        id: supplierId,
        name: supplierName,
        code: supplierCode,
        type: (supplier as Record<string, unknown>).type as string || 'supplier',
        pendingOrderCount: unexportedCount,
        lastExportTime: lastExport?.created_at || null,
      });
    }

    // 7b. 处理"虚拟供应商"——订单有 supplier_name 但在 suppliers 表中找不到对应记录
    for (const syntheticName of syntheticNames) {
      // 匹配两种情况：
      // 1. supplier_id = null 且 supplier_name = syntheticName（正常情况）
      // 2. supplier_id 存在但不在 suppliers 表中，且 supplier_name = syntheticName（supplier_id 已失效）
      const { data: ordersByName } = await client
        .from('orders')
        .select('id, status')
        .eq('supplier_name', syntheticName)
        .in('status', ['pending', 'assigned']);

      const unexportedCount = (ordersByName || [])
        .map((o: { id: string }) => o.id)
        .filter((id: string) => !exportedOrderIds.has(id)).length;

      if (unexportedCount === 0) continue;

      const { data: lastExport } = await client
        .from('export_records')
        .select('created_at')
        .eq('supplier_name', syntheticName)
        .eq('export_type', 'shipping_notice')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      results.push({
        id: `synthetic-${syntheticName}`,
        name: syntheticName,
        code: `(${syntheticName.slice(0, 6)})`,
        type: 'supplier',
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
