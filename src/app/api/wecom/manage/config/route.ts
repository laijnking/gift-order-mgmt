/**
 * WeCom App Config Management API
 * GET: List all configs
 * POST: Create new config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

export async function GET() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('wecom_app_config')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

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
    const { name, corp_id, agent_id, secret, token, encoding_aes_key } = body;

    if (!name || !corp_id || !agent_id || !secret || !token || !encoding_aes_key) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('wecom_app_config')
      .insert({
        name,
        corp_id,
        agent_id,
        secret,
        token,
        encoding_aes_key,
        is_active: true,
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
