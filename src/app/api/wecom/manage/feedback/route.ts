/**
 * WeCom Feedback Tasks Management API
 * GET: List feedback tasks
 * POST: Manual resend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { resendFeedbackTask } from '@/lib/wecom/feedback-sender';

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
    .from('wecom_feedback_tasks')
    .select('*, customers(name), wecom_app_config(name)', { count: 'exact' })
    .is('deleted_at', null)
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

  try {
    const body = await request.json();
    const { task_id, action } = body;

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: '缺少 task_id' },
        { status: 400 }
      );
    }

    if (action === 'resend') {
      const result = await resendFeedbackTask(task_id);
      if (result.success) {
        return NextResponse.json({ success: true, message: '重发成功' });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '未知操作' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    );
  }
}
