import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformUser(dbUser: Record<string, unknown>) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    realName: dbUser.real_name,
    role: dbUser.role,
    department: dbUser.department,
    isActive: dbUser.is_active,
    lastLoginAt: dbUser.last_login_at,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

// 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.USERS_VIEW);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 });
      }
      throw new Error(`查询用户失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: transformUser(data as Record<string, unknown>) });
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.USERS_EDIT);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseClient();

  try {
    const body = await request.json();

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      real_name: body.realName,
      role: body.role,
      department: body.department,
      is_active: body.isActive,
      updated_at: new Date().toISOString(),
    };

    // 如果提供了新密码，则更新
    if (body.password) {
      updateData.password_hash = crypto.createHash('sha256').update(body.password).digest('hex');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新用户失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, data: transformUser(data as Record<string, unknown>) });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.USERS_DELETE);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`删除用户失败: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
