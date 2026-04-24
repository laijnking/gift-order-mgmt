import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Simple email sending function (placeholder - needs SMTP configuration)
async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // TODO: Implement actual email sending with SMTP
  // For now, we'll log the code to console for development
  console.log(`[Password Reset] Email: ${email}, Code: ${code}`);

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@example.com';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('[Password Reset] SMTP not configured, code logged to console');
    return true; // For development, return success
  }

  try {
    // Dynamic import nodemailer
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort || '587'),
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: '礼品订单管理系统 - 密码重置验证码',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">密码重置验证码</h2>
          <p style="color: #666; font-size: 16px;">您收到这封邮件是因为您请求重置密码。</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 8px; color: #333;">
              ${code}
            </p>
          </div>
          <p style="color: #666; font-size: 14px;">验证码有效期为 10 分钟。</p>
          <p style="color: #666; font-size: 14px;">如果您没有请求重置密码，请忽略此邮件。</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('[Password Reset] Failed to send email:', error);
    return false;
  }
}

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired codes
async function cleanupExpiredCodes(client: ReturnType<typeof getSupabaseClient>) {
  await client
    .from('password_reset_codes')
    .delete()
    .eq('used_at', null)
    .lt('expires_at', new Date().toISOString());
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: '请输入邮箱地址' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // Check if user exists with this email
    const { data: user } = await client
      .from('users')
      .select('id, email')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    // For security, don't reveal whether email exists
    // Always return success to prevent email enumeration attacks
    if (!user) {
      console.log(`[Password Reset] No user found with email: ${email}`);
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: '如果该邮箱已注册，验证码已发送',
      });
    }

    // Clean up expired codes
    await cleanupExpiredCodes(client);

    // Check rate limiting - max 3 codes per email per hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const { count } = await client
      .from('password_reset_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('used_at', null)
      .gt('created_at', oneHourAgo.toISOString());

    if (count !== null && count >= 3) {
      return NextResponse.json({
        success: false,
        error: '请求过于频繁，请稍后再试',
      }, { status: 429 });
    }

    // Generate new code
    const code = generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Store code in database
    const { error: insertError } = await client
      .from('password_reset_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[Password Reset] Failed to store code:', insertError);
      return NextResponse.json({
        success: false,
        error: '发送失败，请重试',
      }, { status: 500 });
    }

    // Send email
    const sent = await sendVerificationEmail(email, code);
    if (!sent) {
      // Delete the code if email failed
      await client
        .from('password_reset_codes')
        .delete()
        .eq('email', email)
        .eq('code', code);

      return NextResponse.json({
        success: false,
        error: '发送失败，请重试',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '验证码已发送至您的邮箱',
    });
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
