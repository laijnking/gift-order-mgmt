/**
 * WeCom Group Mappings Management API
 * GET: List all mappings
 * POST: Create new mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, 'wecom:manage');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('app_id');
  const isActive = searchParams.get('is_active');

  let query = client
    .from('wecom_group_mappings')
    .select('*, customers(id, code, name, is_active)')
    .is('deleted_at', null);

  if (appId) {
    query = query.eq('app_id', appId);
  }
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, 'wecom:manage');
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const {
      app_id,
      group_id,
      group_name,
      customer_id,
      is_active = true,
      auto_create_order = true,
      auto_send_feedback = true,
    } = body;

    if (!app_id || !group_id || !customer_id) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('wecom_group_mappings')
      .insert({
        app_id,
        group_id,
        group_name,
        customer_id,
        match_source: 'manual',
        match_score: 100,
        is_active,
        auto_create_order,
        auto_send_feedback,
      })
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
