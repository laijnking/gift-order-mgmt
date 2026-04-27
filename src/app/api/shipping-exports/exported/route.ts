import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取已导出发货通知的供应商列表（从 export_records 出发）
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';

  try {
    // 第一步：从 export_records 查出所有已导出的 shipping_notice 记录
    const { data: records, error: recordsError } = await client
      .from('export_records')
      .select('*')
      .eq('export_type', 'shipping_notice')
      .order('exported_at', { ascending: false });

    if (recordsError) throw new Error(`查询导出记录失败: ${recordsError.message}`);
    if (!records || records.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 第二步：收集所有已导出订单的 supplier_id 和 supplier_name
    const supplierIdSet = new Set<string>();
    const supplierNameSet = new Set<string>();
    for (const record of records) {
      const meta = (record as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
      const ids = (record as Record<string, unknown>).supplier_id
        ? [record.supplier_id as string]
        : (meta?.supplier_ids as string[] | undefined) || [];
      for (const id of ids) {
        if (id) supplierIdSet.add(id);
      }
      const orderIds = (record as Record<string, unknown>).order_ids as string[] | undefined;
      if (orderIds && orderIds.length > 0) {
        const { data: orders } = await client
          .from('orders')
          .select('supplier_id, supplier_name')
          .in('id', orderIds);
        for (const order of (orders || [])) {
          if ((order as Record<string, unknown>).supplier_id) {
            supplierIdSet.add((order as Record<string, unknown>).supplier_id as string);
          }
          if ((order as Record<string, unknown>).supplier_name) {
            supplierNameSet.add((order as Record<string, unknown>).supplier_name as string);
          }
        }
      }
    }

    // 第三步：查询供应商信息（统一查询 shippers 表）
    const supplierIds = [...supplierIdSet];
    const supplierNames = [...supplierNameSet];

    let supplierQuery = client.from('shippers').select('*');
    if (supplierIds.length > 0 && supplierNames.length > 0) {
      supplierQuery = supplierQuery.or(
        `id.in.(${supplierIds.join(',')}),name.in.(${supplierNames.map(n => `"${n}"`).join(',')})`
      );
    } else if (supplierIds.length > 0) {
      supplierQuery = supplierQuery.in('id', supplierIds);
    } else if (supplierNames.length > 0) {
      supplierQuery = supplierQuery.in('name', supplierNames);
    }

    if (status !== 'all') {
      supplierQuery = supplierQuery.eq('is_active', status === 'active');
    }

    const { data: shippers, error: shippersError } = await supplierQuery;
    if (shippersError) throw new Error(`查询供应商失败: ${shippersError.message}`);

    // 构造 supplier_id → supplier 映射
    const supplierById = new Map<string, Record<string, unknown>>();
    for (const s of (shippers || [])) {
      supplierById.set(s.id, s);
    }
    const supplierByName = new Map<string, Record<string, unknown>>();
    for (const s of (shippers || [])) {
      supplierByName.set(String((s as Record<string, unknown>).name || ''), s);
    }
    const knownSupplierNames = new Set(supplierByName.keys());

    // 收集虚拟供应商（orders 表有 supplier_name 但 suppliers 表无对应记录）
    const syntheticNames = new Set<string>();
    const { data: allExportedOrders } = await client
      .from('orders')
      .select('id, supplier_id, supplier_name')
      .in('status', ['assigned']);

    for (const order of (allExportedOrders || [])) {
      const sid = (order as Record<string, unknown>).supplier_id as string | null;
      const sname = (order as Record<string, unknown>).supplier_name as string | null;
      if (sid && !supplierById.has(sid) && sname) {
        syntheticNames.add(sname);
      }
      if (!sid && sname && !knownSupplierNames.has(sname)) {
        syntheticNames.add(sname);
      }
    }

    // 第四步：按供应商聚合导出记录
    const results = [];
    const processedRecords = new Set<string>();

    // 处理有数据库记录的供应商
    for (const supplier of (shippers || [])) {
      const supplierId = supplier.id;
      const supplierName = String((supplier as Record<string, unknown>).name || '');

      // 找出该供应商的所有导出记录
      const relatedRecords = (records || []).filter((r) => {
        const meta = (r as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
        const recordSupplierId = r.supplier_id as string | null;
        const metaSupplierIds = (meta?.supplier_ids as string[] | undefined) || [];
        const recordOrderIds = (r as Record<string, unknown>).order_ids as string[] | undefined;

        if (recordSupplierId === supplierId) return true;
        if (metaSupplierIds.includes(supplierId)) return true;
        if (recordOrderIds && recordOrderIds.length > 0) {
          return true; // 需要进一步按订单匹配
        }
        return false;
      });

      const exportCount = relatedRecords.length;
      const lastExportAt = relatedRecords[0]?.exported_at || null;
      const lastRecordId = relatedRecords[0]?.id || null;

      // 统计该供应商已导出订单数
      const exportedOrderIds = new Set<string>();
      for (const record of relatedRecords) {
        for (const id of ((record as Record<string, unknown>).order_ids as string[] || [])) {
          exportedOrderIds.add(id);
        }
      }

      if (exportCount === 0) continue;

      results.push({
        id: supplierId,
        name: supplierName,
        code: (supplier as Record<string, unknown>).code as string || String(supplierId).slice(0, 8),
        type: supplier.type,
        exportCount,
        lastExportAt,
        lastRecordId,
        exportedOrderCount: exportedOrderIds.size,
      });
      for (const r of relatedRecords) {
        processedRecords.add(r.id);
      }
    }

    // 处理虚拟供应商
    for (const syntheticName of syntheticNames) {
      const relatedRecords = (records || []).filter((r) => {
        const meta = (r as Record<string, unknown>).metadata as Record<string, unknown> | undefined;
        const metaSupplierIds = (meta?.supplier_ids as string[] | undefined) || [];
        if (metaSupplierIds.some((id: string) => id.startsWith('synthetic-'))) return true;
        const recordOrderIds = (r as Record<string, unknown>).order_ids as string[] | undefined;
        if (!recordOrderIds) return false;
        return recordOrderIds.length > 0;
      });

      // 检查这些记录是否已归属真实供应商
      const syntheticRecords = relatedRecords.filter((r) => {
        if (processedRecords.has(r.id)) return false;
        const recordOrderIds = (r as Record<string, unknown>).order_ids as string[] | undefined;
        if (!recordOrderIds) return false;
        return true; // 简化：只要有订单 ID 就认为是该虚拟供应商的
      });

      if (syntheticRecords.length === 0) continue;

      const lastExportAt = syntheticRecords[0]?.exported_at || null;
      const lastRecordId = syntheticRecords[0]?.id || null;
      const exportedOrderIds = new Set<string>();
      for (const record of syntheticRecords) {
        for (const id of ((record as Record<string, unknown>).order_ids as string[] || [])) {
          exportedOrderIds.add(id);
        }
      }

      results.push({
        id: `synthetic-${syntheticName}`,
        name: syntheticName,
        code: `(${syntheticName.slice(0, 6)})`,
        type: 'supplier',
        exportCount: syntheticRecords.length,
        lastExportAt,
        lastRecordId,
        exportedOrderCount: exportedOrderIds.size,
      });
    }

    // 按最近导出时间降序
    results.sort((a, b) => {
      if (!a.lastExportAt && !b.lastExportAt) return 0;
      if (!a.lastExportAt) return 1;
      if (!b.lastExportAt) return -1;
      return b.lastExportAt.localeCompare(a.lastExportAt);
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('获取已导出供应商列表失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
