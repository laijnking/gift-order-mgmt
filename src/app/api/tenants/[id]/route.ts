import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireSuperadmin } from '@/lib/server-auth';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

    const { count } = await client
      .from('user_tenants')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id);

    // 管理员信息
    let adminUsername = '';
    const { data: adminLink } = await client
      .from('user_tenants')
      .select('user_id')
      .eq('tenant_id', id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (adminLink) {
      const { data: adminUser } = await client
        .from('users')
        .select('username')
        .eq('id', adminLink.user_id)
        .maybeSingle();
      adminUsername = (adminUser?.username as string) || '';
    }

    return NextResponse.json({
      success: true,
      data: { ...data, member_count: count ?? 0, admin_username: adminUsername },
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

    // 重置管理员密码
    if (body.resetAdminPassword === true) {
      const { data: adminLink } = await client
        .from('user_tenants')
        .select('user_id')
        .eq('tenant_id', id)
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();

      if (!adminLink) {
        return NextResponse.json({ success: false, error: '未找到租户管理员' }, { status: 404 });
      }

      const newPassword = body.newPassword || `Admin123!`;
      const { error: pwError } = await client
        .from('users')
        .update({ password_hash: hashPassword(newPassword) })
        .eq('id', adminLink.user_id);

      if (pwError) throw new Error(`重置密码失败: ${pwError.message}`);

      return NextResponse.json({ success: true, message: '密码已重置', data: { newPassword } });
    }

    // 更换管理员
    if (body.changeAdminUserId) {
      const newAdminId = body.changeAdminUserId as string;

      // 校验该用户是否已是本租户成员
      const { data: member } = await client
        .from('user_tenants')
        .select('id, role')
        .eq('tenant_id', id)
        .eq('user_id', newAdminId)
        .maybeSingle();

      if (!member) {
        // 如果不是成员，先加入
        await client.from('user_tenants').insert({
          user_id: newAdminId,
          tenant_id: id,
          role: 'admin',
          is_default: true,
        });
      } else {
        // 已经是成员，升级为admin
        await client
          .from('user_tenants')
          .update({ role: 'admin', is_default: true })
          .eq('tenant_id', id)
          .eq('user_id', newAdminId);
      }

      // 将原管理员降为 member
      await client
        .from('user_tenants')
        .update({ role: 'member', is_default: false })
        .eq('tenant_id', id)
        .eq('role', 'admin')
        .neq('user_id', newAdminId);

      return NextResponse.json({ success: true, message: '管理员已更换' });
    }

    // 常规更新：status / name / plan
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
