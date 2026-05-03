import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export type ServerAuthUser = {
  id?: string;
  username?: string;
  role?: string;
  dataScope?: string;
  permissions?: string[];
};

const AUTH_SECRET = process.env.AUTH_SECRET || 'gift-order-mgmt-secret-key-change-in-production';
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function parseUserInfoHeader(request: NextRequest): ServerAuthUser | null {
  const raw = request.headers.get('x-user-info');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ServerAuthUser;
    return {
      ...parsed,
      permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
    };
  } catch {
    return null;
  }
}

/**
 * 验证用户签名 - 通过数据库查询验证权限是否匹配
 * 此函数在中间件中调用，每个请求只执行一次
 */
export async function verifyUserSignature(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
  const signature = request.headers.get('x-user-signature');
  const timestamp = request.headers.get('x-timestamp');
  const userInfoRaw = request.headers.get('x-user-info');

  // 如果没有签名头，检查兼容模式
  if (!signature || !timestamp || !userInfoRaw) {
    if (process.env.AUTH_LEGACY_HEADER_MODE === 'true') {
      return { valid: true };
    }
    return { valid: false, reason: '缺少签名验证头' };
  }

  // 解析用户信息
  let userInfo: { id?: string; permissions?: string[] };
  try {
    userInfo = JSON.parse(userInfoRaw);
  } catch {
    return { valid: false, reason: '用户信息格式无效' };
  }

  const userId = userInfo.id;
  const permissions = userInfo.permissions || [];

  if (!userId) {
    return { valid: false, reason: '缺少用户ID' };
  }

  // 检查时间戳是否过期
  const ts = parseInt(timestamp, 10);
  const now = Date.now();
  if (isNaN(ts) || Math.abs(now - ts) > SIGNATURE_MAX_AGE_MS) {
    return { valid: false, reason: '签名已过期' };
  }

  // 从数据库获取用户真实权限
  const client = getSupabaseClient();
  const { data: user, error } = await client
    .from('users')
    .select('id, username, role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user) {
    return { valid: false, reason: '用户不存在' };
  }

  if (!user.is_active) {
    return { valid: false, reason: '用户已被禁用' };
  }

  // 获取角色权限
  const { data: role } = await client
    .from('roles')
    .select('id, code, name, data_scope')
    .eq('code', user.role)
    .maybeSingle();

  let realPermissions: string[] = [];
  if (role) {
    const { data: permissionLinks } = await client
      .from('role_permissions')
      .select('permissions(code)')
      .eq('role_id', role.id);

    realPermissions = (permissionLinks || [])
      .map((item: Record<string, unknown>) => {
        const permission = item.permissions as Record<string, unknown> | null;
        return typeof permission?.code === 'string' ? permission.code : null;
      })
      .filter((code): code is string => Boolean(code));
  }

  // 对比签名中的权限与真实权限
  const signedPermissions = [...permissions].sort();
  const dbPermissions = realPermissions.sort();

  if (JSON.stringify(signedPermissions) !== JSON.stringify(dbPermissions)) {
    return { valid: false, reason: '权限已变更，请重新登录' };
  }

  // 重新计算签名验证
  const dataToSign = `${userId}:${dbPermissions.join(',')}:${ts}`;
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(dataToSign).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      return { valid: false, reason: '签名验证失败' };
    }
  } catch {
    return { valid: false, reason: '签名格式无效' };
  }

  return { valid: true };
}

export function getRequestUser(request: NextRequest) {
  return parseUserInfoHeader(request);
}

export function requirePermission(request: NextRequest, permission: string) {
  const user = parseUserInfoHeader(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: '未登录或缺少用户上下文' },
      { status: 401 }
    );
  }

  if (!user.permissions?.includes(permission)) {
    return NextResponse.json(
      { success: false, error: '当前账号没有执行此操作的权限' },
      { status: 403 }
    );
  }

  return null;
}

export function requireAnyPermission(request: NextRequest, permissions: string[]) {
  const user = parseUserInfoHeader(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: '未登录或缺少用户上下文' },
      { status: 401 }
    );
  }

  if (!permissions.some(p => user.permissions?.includes(p))) {
    return NextResponse.json(
      { success: false, error: '当前账号没有执行此操作的权限' },
      { status: 403 }
    );
  }

  return null;
}
