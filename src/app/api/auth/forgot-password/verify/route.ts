import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Store verified codes temporarily (in production, use Redis or session)
const verifiedCodes = new Map<string, { email: string; verifiedAt: number }>();

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();

    if (!email || !code) {
      return NextResponse.json({
        success: false,
        error: '请输入邮箱和验证码',
      }, { status: 400 });
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json({
        success: false,
        error: '验证码格式错误',
      }, { status: 400 });
    }

    // Find the valid code
    const { data: resetCode } = await client
      .from('password_reset_codes')
      .select('id, email, code, expires_at, used_at')
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

    // Store verification state (valid for 15 minutes)
    const verificationToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    verifiedCodes.set(verificationToken, {
      email,
      verifiedAt: Date.now(),
    });

    // Clean up old verified codes (older than 15 minutes)
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    for (const [token, data] of verifiedCodes.entries()) {
      if (data.verifiedAt < fifteenMinutesAgo) {
        verifiedCodes.delete(token);
      }
    }

    return NextResponse.json({
      success: true,
      verificationToken,
    });
  } catch (error) {
    console.error('[Password Reset Verify] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// Export for use in reset route
export function getVerifiedEmail(token: string): string | null {
  const data = verifiedCodes.get(token);
  if (!data) return null;

  // Check if token is still valid (15 minutes)
  if (Date.now() - data.verifiedAt > 15 * 60 * 1000) {
    verifiedCodes.delete(token);
    return null;
  }

  return data.email;
}
