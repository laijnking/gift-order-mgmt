/**
 * WeCom App Config by ID Management API
 * GET: Get config by ID
 * PUT: Update config
 * DELETE: Soft delete config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('wecom_app_config')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ success: false, error: '未找到' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission(request, 'wecom:manage');
  if (authError) return authError;

  const { id } = await params;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { name, corp_id, agent_id, secret, token, encoding_aes_key, is_active } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (corp_id !== undefined) updateData.corp_id = corp_id;
    if (agent_id !== undefined) updateData.agent_id = agent_id;
    if (secret !== undefined) updateData.secret = secret;
    if (token !== undefined) updateData.token = token;
    if (encoding_aes_key !== undefined) updateData.encoding_aes_key = encoding_aes_key;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await client
      .from('wecom_app_config')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission(request, 'wecom:manage');
  if (authError) return authError;

  const { id } = await params;
  const client = getSupabaseClient();

  const { error } = await client
    .from('wecom_app_config')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
