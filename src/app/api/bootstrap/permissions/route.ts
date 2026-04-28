import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST() {
  const client = getSupabaseClient();

  try {
    // 1. 确保 settings:view 权限存在
    const { error: viewError } = await client.from('permissions').upsert({
      id: 'e0000000-0000-0000-0000-000000000028',
      code: 'settings:view',
      name: '设置查看',
      category: '系统',
      description: '查看系统设置',
    }, { onConflict: 'code' });

    if (viewError) {
      console.error('Failed to upsert settings:view:', viewError);
    }

    // 2. 确保 settings:edit 权限存在
    const { error: editError } = await client.from('permissions').upsert({
      id: 'e0000000-0000-0000-0000-000000000029',
      code: 'settings:edit',
      name: '设置编辑',
      category: '系统',
      description: '编辑系统设置',
    }, { onConflict: 'code' });

    if (editError) {
      console.error('Failed to upsert settings:edit:', editError);
    }

    // 3. 确保 admin 角色有所需权限
    const { data: adminRole, error: roleError } = await client
      .from('roles')
      .select('id')
      .eq('code', 'admin')
      .single();

    if (roleError || !adminRole) {
      return NextResponse.json({
        success: false,
        error: '找不到 admin 角色',
      }, { status: 500 });
    }

    // 4. 查询权限 ID
    const { data: perms, error: permsError } = await client
      .from('permissions')
      .select('id, code')
      .in('code', ['settings:view', 'settings:edit']);

    if (permsError) {
      return NextResponse.json({
        success: false,
        error: `查询权限失败: ${permsError.message}`,
      }, { status: 500 });
    }

    // 5. 为 admin 添加权限
    for (const perm of perms || []) {
      await client.from('role_permissions').upsert({
        role_id: adminRole.id,
        permission_id: perm.id,
      }, { onConflict: 'role_id,permission_id' });
    }

    // 6. 验证 system_configs
    const { data: configs, error: configsError } = await client
      .from('system_configs')
      .select('code, editable');

    if (configsError) {
      return NextResponse.json({
        success: false,
        error: `查询 system_configs 失败: ${configsError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '权限初始化成功',
      permissionsAdded: perms?.map(p => p.code),
      existingConfigs: configs,
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
