import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getTenantFromRequest } from '@/lib/tenant-context';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getSupabaseClient();
  const { data, error } = await client.from('brand_configs').select('*').eq('tenant_id', id).maybeSingle();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = getSupabaseClient();
  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.brand_name !== undefined) updateData.brand_name = body.brand_name;
  if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
  if (body.theme_color !== undefined) updateData.theme_color = body.theme_color;
  if (body.welcome_message !== undefined) updateData.welcome_message = body.welcome_message;
  if (body.footer_text !== undefined) updateData.footer_text = body.footer_text;
  const { error } = await client.from('brand_configs').upsert({ tenant_id: id, ...updateData }, { onConflict: 'tenant_id' });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, message: '品牌配置已更新' });
}
