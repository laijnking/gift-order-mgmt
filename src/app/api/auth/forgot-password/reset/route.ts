import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const newPassword = String(body.newPassword || '');

    if (!email || !code || !newPassword) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    // Validate password
    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: '密码长度不能少于6位',
      }, { status: 400 });
    }

    // Find the valid code
    const { data: resetCode } = await client
      .from('password_reset_codes')
      .select('id, email, expires_at')
      .eq('email', email)
      .eq('code', code)
      .is('used_at', null)
      .maybeSingle();

    if (!resetCode) {
      return NextResponse.json({
        success: false,
        error: '验证码错误或已过期',
      }, { status: 400 });
    }

    // Check if expired
    const expiresAt = new Date(resetCode.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({
        success: false,
        error: '验证码已过期，请重新获取',
      }, { status: 400 });
    }

    // Mark code as used
    await client
      .from('password_reset_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetCode.id);

    // Update user password
    const { error: updateError } = await client
      .from('users')
      .update({ password_hash: newPassword }) // Store as plain text for now, matching login verification
      .eq('email', email)
      .eq('is_active', true);

    if (updateError) {
      console.error('[Password Reset] Failed to update password:', updateError);
      return NextResponse.json({
        success: false,
        error: '密码重置失败，请重试',
      }, { status: 500 });
    }

    // Clean up all unused codes for this email
    await client
      .from('password_reset_codes')
      .delete()
      .eq('email', email)
      .is('used_at', null);

    return NextResponse.json({
      success: true,
      message: '密码重置成功，请使用新密码登录',
    });
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
