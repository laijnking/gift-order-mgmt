/**
 * WeCom File Process Queue Management API
 * GET: List queue items
 * POST: Manual retry
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, 'wecom:manage');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const appId = searchParams.get('app_id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  let query = client
    .from('wecom_file_process_queue')
    .select('*, customers(name), wecom_app_config(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (appId) {
    query = query.eq('app_id', appId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data,
    total: count || data?.length || 0,
  });
}

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, 'wecom:manage');
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { task_id } = body;

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: '缺少 task_id' },
        { status: 400 }
      );
    }

    // 重置任务状态为 pending 并清空错误
    const { data, error } = await client
      .from('wecom_file_process_queue')
      .update({
        status: 'pending',
        error_message: null,
        retry_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    );
  }
}
