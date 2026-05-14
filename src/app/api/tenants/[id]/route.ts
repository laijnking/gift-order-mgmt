import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireSuperadmin } from '@/lib/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = getSupabaseClient();

  try {
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`查询租户失败: ${error.message}`);
    if (!data) return NextResponse.json({ success: false, error: '租户不存在' }, { status: 404 });

    // 统计成员数
    const { count } = await client
      .from('user_tenants')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id);

    return NextResponse.json({
      success: true,
      data: { ...data, member_count: count ?? 0 },
    });
  } catch (error) {
    console.error('获取租户失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireSuperadmin(request);
  if (authError) return authError;

  const { id } = await params;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.plan !== undefined) updateData.plan = body.plan;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new Error(`更新租户失败: ${error.message}`);
    if (!data) return NextResponse.json({ success: false, error: '租户不存在' }, { status: 404 });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('更新租户失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}
