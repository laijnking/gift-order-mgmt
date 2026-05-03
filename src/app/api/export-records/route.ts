import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取导出记录列表
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const exportType = searchParams.get('exportType'); // shipping_notice, customer_feedback
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const supplierId = searchParams.get('supplierId');
  const customerId = searchParams.get('customerId');

  try {
    let query = client
      .from('export_records')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (exportType) {
      query = query.eq('export_type', exportType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`查询导出记录失败: ${error.message}`);

    // 收集 supplier_ids 和 customer_ids
    const supplierIds = [...new Set((data || []).map(r => r.supplier_id).filter(Boolean))];
    const customerIds = [...new Set((data || []).map(r => r.customer_id).filter(Boolean))];

    // 批量查询发货方和客户名称
    const [shippersResult, customersResult] = await Promise.all([
      supplierIds.length > 0
        ? client.from('shippers').select('id, name').in('id', supplierIds)
        : { data: [], error: null },
      customerIds.length > 0
        ? client.from('customers').select('id, name').in('id', customerIds)
        : { data: [], error: null },
    ]);

    // 构建名称映射
    const shipperMap = new Map((shippersResult.data || []).map(s => [s.id, s.name]));
    const customerMap = new Map((customersResult.data || []).map(c => [c.id, c.name]));

    // 组合数据，附加关联名称
    const dataWithNames = (data || []).map(record => ({
      ...record,
      supplier_name: record.supplier_id ? shipperMap.get(record.supplier_id) || null : null,
      customer_name: record.customer_id ? customerMap.get(record.customer_id) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: dataWithNames,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('获取导出记录列表失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
