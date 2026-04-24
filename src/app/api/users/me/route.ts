import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

// 获取当前用户资料
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    // Require authentication
    const authError = requirePermission(request, 'users:view');
    if (authError) return authError;

    // Get current user from header
    const userInfoHeader = request.headers.get('x-user-info');
    if (!userInfoHeader) {
      return NextResponse.json({
        success: false,
        error: '未登录或登录已过期',
      }, { status: 401 });
    }

    const currentUser = JSON.parse(userInfoHeader);
    const userId = currentUser.id;

    const { data: user, error } = await client
      .from('users')
      .select('id, username, real_name, role, department, is_active, last_login_at, created_at, phone, email, remark, data_scope')
      .eq('id', userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        department: user.department,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        phone: user.phone || '',
        email: user.email || '',
        remark: user.remark || '',
        dataScope: user.data_scope || 'self',
      },
    });
  } catch (error) {
    console.error('[Get Profile] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 更新当前用户资料（仅限手机号和邮箱）
export async function PUT(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    // Require authentication
    const authError = requirePermission(request, 'users:view');
    if (authError) return authError;

    // Get current user from header
    const userInfoHeader = request.headers.get('x-user-info');
    if (!userInfoHeader) {
      return NextResponse.json({
        success: false,
        error: '未登录或登录已过期',
      }, { status: 401 });
    }

    const currentUser = JSON.parse(userInfoHeader);
    const userId = currentUser.id;

    const body = await request.json();
    const { phone, email } = body;

    // 验证邮箱格式
    if (email !== undefined && email !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({
          success: false,
          error: '请输入有效的邮箱地址',
        }, { status: 400 });
      }
    }

    // 验证手机号格式
    if (phone !== undefined && phone !== '') {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({
          success: false,
          error: '请输入有效的手机号',
        }, { status: 400 });
      }
    }

    // 只允许更新 phone 和 email
    const updateData: Record<string, unknown> = {};
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;

    const { data: user, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, username, real_name, role, phone, email')
      .single();

    if (error) {
      console.error('[Update Profile] Failed to update:', error);
      return NextResponse.json({
        success: false,
        error: '资料更新失败，请重试',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '资料更新成功',
      data: {
        phone: user.phone || '',
        email: user.email || '',
      },
    });
  } catch (error) {
    console.error('[Update Profile] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
