import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 兼容层：保留历史批次详情/重导出入口，实际数据与重导出逻辑均代理到 export_records / shipping-exports 主链路
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'orders:export');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 获取导出记录
    const { data: record, error } = await client
      .from('export_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`查询导出记录失败: ${error.message}`);

    // 解析详情
    const details = record.metadata?.details || [];

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        details,
      },
    });
  } catch (error) {
    console.error('获取批量导出详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 兼容层：按旧路径触发重新导出，但实际仍走 shipping-exports 主导出逻辑
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'orders:export');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const body = await request.json();
    const { supplierId, templateId } = body || {};

    // 获取原导出记录
    const { data: record, error } = await client
      .from('export_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`查询导出记录失败: ${error.message}`);

    const supplierIds = supplierId
      ? [supplierId]
      : record.supplier_id
        ? [record.supplier_id]
        : Array.isArray(record.metadata?.supplier_ids)
          ? record.metadata.supplier_ids
          : [];

    if (supplierIds.length === 0) {
      return NextResponse.json({ success: false, error: '导出记录缺少供应商信息，无法重新导出' }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const response = await fetch(`${origin}/api/shipping-exports/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('x-user-info') ? { 'x-user-info': request.headers.get('x-user-info') as string } : {}),
      },
      body: JSON.stringify({
        supplierIds,
        templateId: templateId ?? record.template_id ?? null,
        exportedBy: record.exported_by || 'system',
        dispatchMode: 'dispatch',
        persistenceMode: 'full',
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('重新导出失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
