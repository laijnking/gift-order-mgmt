import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

// 密码哈希配置（使用 PBKDF2）
const HASH_SECRET = process.env.PASSWORD_HASH_SECRET || process.env.AUTH_SECRET || 'gift-order-mgmt-secret-key-change-in-production';
const HASH_ITERATIONS = 100000;
const HASH_KEYLEN = 64;
const HASH_DIGEST = 'sha512';

/**
 * 使用 PBKDF2 生成密码哈希
 */
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, HASH_ITERATIONS, HASH_KEYLEN, HASH_DIGEST).toString('hex');
  return { hash, salt: generatedSalt };
}

/**
 * 验证密码是否匹配
 * 支持旧格式（SHA256）和新格式（PBKDF2）
 */
function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;

  // 新格式：salt$hash（PBKDF2）
  if (storedHash.includes('$')) {
    const parts = storedHash.split('$');
    if (parts.length === 2) {
      const [salt, hash] = parts;
      const { hash: expectedHash } = hashPassword(password, salt);
      try {
        return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
      } catch {
        return false;
      }
    }
  }

  // 旧格式检测：SHA256 哈希（64 字符 hex）
  if (storedHash.length === 64 && /^[a-f0-9]+$/.test(storedHash)) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * 检查密码强度
 */
function isPasswordStrong(password: string): { valid: boolean; reason?: string } {
  if (password.length < 8) {
    return { valid: false, reason: '密码长度至少 8 位' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: '密码必须包含大写字母' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: '密码必须包含小写字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: '密码必须包含数字' };
  }
  return { valid: true };
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

    // 新密码长度验证（已在 isPasswordStrong 中检查，但保留此检查作为前端提示）

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
    if (!verifyPassword(oldPassword, user.password_hash)) {
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

    // Validate new password strength
    const strengthCheck = isPasswordStrong(newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json({
        success: false,
        error: strengthCheck.reason || '密码强度不足',
      }, { status: 400 });
    }

    // Hash new password with PBKDF2 and update
    const { hash, salt } = hashPassword(newPassword);
    const { error: updateError } = await client
      .from('users')
      .update({ password_hash: `${salt}$${hash}` })
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
