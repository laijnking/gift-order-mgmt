import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 获取AI执行日志
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.AI_LOGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const agentCode = searchParams.get('agentCode');
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  try {
    let query = client.from('ai_logs').select('*', { count: 'exact' });

    if (agentCode) {
      query = query.eq('agent_code', agentCode);
    }

    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`查询AI日志失败: ${error.message}`);

    const total = count ?? (data?.length || 0);
    return NextResponse.json({
      success: true,
      data: data || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('获取AI日志失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
