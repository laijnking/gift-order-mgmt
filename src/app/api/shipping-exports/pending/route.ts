import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取待发货供应商列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'active';

  try {
    // 获取供应商列表
    let query = client
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    const { data: suppliers, error: suppliersError } = await query;

    if (suppliersError) {
      throw new Error(`查询供应商失败: ${suppliersError.message}`);
    }

    // 获取各供应商的待发货订单统计
    const results = [];

    for (const supplier of (suppliers || [])) {
      // 查询待发货订单：已选供应商但尚未回单/完成的 pending、assigned 都应该出现在这里。
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('id, order_no, status, assigned_at')
        .eq('supplier_id', supplier.id)
        .in('status', ['pending', 'assigned']);

      if (ordersError) {
        console.error(`查询供应商 ${supplier.id} 订单失败:`, ordersError);
        continue;
      }

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
        code: supplier.code,
        type: supplier.type,
        pendingOrderCount: orders?.length || 0,
        lastExportTime: lastExport?.created_at || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('获取待发货供应商列表失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
