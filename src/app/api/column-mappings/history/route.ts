import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { supportsColumnMappingMetadata } from '@/lib/column-mapping-metadata';
import { requirePermission } from '@/lib/server-auth';

// 获取客户字段映射历史版本
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'orders:create');
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const customerCode = searchParams.get('customerCode');

  try {
    if (!customerCode) {
      return NextResponse.json({ success: false, error: '缺少customerCode参数' }, { status: 400 });
    }

    const selectColumns = await supportsColumnMappingMetadata(client)
      ? 'id, version, header_row, is_active, created_at, created_by, remark, header_fingerprint, template_signature, source_headers'
      : 'id, version, header_row, is_active, created_at, created_by, remark';

    const { data, error } = await client
      .from('column_mappings')
      .select(selectColumns)
      .eq('customer_code', customerCode)
      .order('version', { ascending: false });

    if (error) throw new Error(`查询历史版本失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取历史版本失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
