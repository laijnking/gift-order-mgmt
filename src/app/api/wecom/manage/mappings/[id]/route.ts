/**
 * WeCom Group Mapping by ID Management API
 * GET: Get mapping by ID
 * PUT: Update mapping
 * DELETE: Soft delete mapping
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
    .from('wecom_group_mappings')
    .select('*, customers(id, code, name, is_active)')
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
    const {
      customer_id,
      is_active,
      auto_create_order,
      auto_send_feedback,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (auto_create_order !== undefined) updateData.auto_create_order = auto_create_order;
    if (auto_send_feedback !== undefined) updateData.auto_send_feedback = auto_send_feedback;

    const { data, error } = await client
      .from('wecom_group_mappings')
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
    .from('wecom_group_mappings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
