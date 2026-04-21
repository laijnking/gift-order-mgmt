import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取单个角色
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 获取角色信息
    const { data: role, error } = await client
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询角色失败: ${error.message}`);
    if (!role) {
      return NextResponse.json({ success: false, error: '角色不存在' }, { status: 404 });
    }

    // 获取角色权限
    const { data: perms } = await client
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (
          code,
          name,
          category
        )
      `)
      .eq('role_id', id);

    (role as Record<string, unknown>).permissions = perms?.map((p: Record<string, unknown>) => 
      (p.permissions as Record<string, unknown>)?.code
    ) || [];

    return NextResponse.json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('获取角色失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新角色
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 检查是否为 admin 角色（admin 不能修改）
    const { data: existing } = await client
      .from('roles')
      .select('code, is_system')
      .eq('id', id)
      .single();
    
    if (existing?.code === 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: '管理员角色不能修改' 
      }, { status: 400 });
    }

    // 非 admin 角色（包括其他系统角色）都可以修改
    const body = await request.json();
    
    const roleData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.name !== undefined) roleData.name = body.name;
    if (body.description !== undefined) roleData.description = body.description;
    if (body.dataScope !== undefined) roleData.data_scope = body.dataScope;
    if (body.isActive !== undefined) roleData.is_active = body.isActive;

    const { error } = await client
      .from('roles')
      .update(roleData)
      .eq('id', id);
    
    if (error) throw new Error(`更新角色失败: ${error.message}`);

    // 更新权限
    if (body.permissions !== undefined) {
      // 删除旧权限
      await client.from('role_permissions').delete().eq('role_id', id);
      
      // 添加新权限
      if (Array.isArray(body.permissions) && body.permissions.length > 0) {
        const permissionLinks = body.permissions.map((permId: string) => ({
          role_id: id,
          permission_id: permId,
        }));
        await client.from('role_permissions').insert(permissionLinks);
      }
    }

    return NextResponse.json({
      success: true,
      message: '角色更新成功'
    });
  } catch (error) {
    console.error('更新角色失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 检查是否为系统角色
    const { data: existing } = await client
      .from('roles')
      .select('code, is_system')
      .eq('id', id)
      .single();
    
    if (existing?.is_system) {
      return NextResponse.json({ 
        success: false, 
        error: '系统内置角色不能删除' 
      }, { status: 400 });
    }

    // 检查是否有用户使用此角色
    const { data: users } = await client
      .from('users')
      .select('id')
      .eq('role', existing?.code || '')
      .limit(1);

    if (users && users.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该角色下有用户，无法删除' 
      }, { status: 400 });
    }

    const { error } = await client
      .from('roles')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`删除角色失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '角色删除成功'
    });
  } catch (error) {
    console.error('删除角色失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
