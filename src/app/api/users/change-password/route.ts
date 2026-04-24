import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

const BUILTIN_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  salesperson: 'sales123',
  operator: 'operator123',
};

function verifyPassword(username: string, password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;

  // Direct match
  if (storedHash === password) return true;

  // SHA256 hash match
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  if (storedHash === sha256Hash) return true;

  // Built-in password match
  const builtinPassword = BUILTIN_PASSWORDS[username];
  if (builtinPassword && password === builtinPassword) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    // Require authentication (any logged in user can change their own password)
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
    const username = currentUser.username;

    const body = await request.json();
    const { oldPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: '请填写所有字段',
      }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: '新密码长度不能少于6位',
      }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({
        success: false,
        error: '两次输入的新密码不一致',
      }, { status: 400 });
    }

    // Get current user from database
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, username, password_hash')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
      }, { status: 404 });
    }

    // Verify old password
    if (!verifyPassword(username, oldPassword, user.password_hash)) {
      return NextResponse.json({
        success: false,
        error: '原密码错误',
      }, { status: 400 });
    }

    // Check if new password is same as old
    if (oldPassword === newPassword) {
      return NextResponse.json({
        success: false,
        error: '新密码不能与原密码相同',
      }, { status: 400 });
    }

    // Update password
    const { error: updateError } = await client
      .from('users')
      .update({ password_hash: newPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('[Change Password] Failed to update:', updateError);
      return NextResponse.json({
        success: false,
        error: '密码修改失败，请重试',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
