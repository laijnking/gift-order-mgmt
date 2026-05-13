import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { Pool } from 'pg';

export type ServerAuthUser = {
  id?: string;
  username?: string;
  role?: string;
  isSuperadmin?: boolean;
  dataScope?: string;
  permissions?: string[];
  tenantId?: string;
  tenantCode?: string;
};

const AUTH_SECRET = process.env.AUTH_SECRET || 'gift-order-mgmt-secret-key-change-in-production';
const SIGNATURE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

  // 如果没有签名头，检查兼容模式或 DEV 环境
  if (!signature || !timestamp || !userInfoRaw) {
    if (process.env.AUTH_LEGACY_HEADER_MODE === 'true') {
      return { valid: true };
    }
    // DEV 环境允许无签名但需有 x-user-info（权限测试与 API 集成测试兼容）
    if (process.env.COZE_PROJECT_ENV === 'DEV') {
      const userInfo = parseUserInfoHeader(request);
      if (!userInfo) {
        return { valid: false, reason: '缺少用户上下文' };
      }
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
    // 分两步查询：先获取 role_permissions 的 permission_id 列表，再查询对应的 permissions code
    const { data: permissionLinks } = await client
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', role.id);

    if (permissionLinks && permissionLinks.length > 0) {
      const permIds = permissionLinks.map((p: Record<string, unknown>) => p.permission_id as string);

      // 直接用 Pool 查询避免 LocalSupabaseClient 的跨表查询限制
      const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || process.env.DATABASE_URL;
      if (dbUrl) {
        const pool = new Pool({ connectionString: dbUrl });
        const idsParam = permIds.map((_, i) => `$${i + 1}`).join(', ');
        const result = await pool.query(
          `SELECT code FROM permissions WHERE id IN (${idsParam})`,
          permIds
        );
        realPermissions = result.rows.map(r => r.code as string);
        await pool.end();
      }
    }
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

export async function requirePermission(request: NextRequest, permission: string) {
  const sigResult = await verifyUserSignature(request);
  if (!sigResult.valid) {
    return NextResponse.json(
      { success: false, error: sigResult.reason || '签名验证失败' },
      { status: 401 }
    );
  }

  const user = parseUserInfoHeader(request);

  // AUTH_LEGACY_HEADER_MODE=true 时允许无签名请求通过，但如果有 x-user-info 则仍需解析
  const isLegacyMode = process.env.AUTH_LEGACY_HEADER_MODE === 'true';
  const hasUserInfoHeader = request.headers.has('x-user-info');

  if (!user && !(isLegacyMode && !hasUserInfoHeader)) {
    return NextResponse.json(
      { success: false, error: '未登录或缺少用户上下文' },
      { status: 401 }
    );
  }

  if (user && !user.permissions?.includes(permission)) {
    return NextResponse.json(
      { success: false, error: '当前账号没有执行此操作的权限' },
      { status: 403 }
    );
  }

  return null;
}

export async function requireAnyPermission(request: NextRequest, permissions: string[]) {
  const sigResult = await verifyUserSignature(request);
  if (!sigResult.valid) {
    return NextResponse.json(
      { success: false, error: sigResult.reason || '签名验证失败' },
      { status: 401 }
    );
  }

  const user = parseUserInfoHeader(request);

  // AUTH_LEGACY_HEADER_MODE=true 时允许无签名请求通过，但如果有 x-user-info 则仍需解析
  const isLegacyMode = process.env.AUTH_LEGACY_HEADER_MODE === 'true';
  const hasUserInfoHeader = request.headers.has('x-user-info');

  if (!user && !(isLegacyMode && !hasUserInfoHeader)) {
    return NextResponse.json(
      { success: false, error: '未登录或缺少用户上下文' },
      { status: 401 }
    );
  }

  if (user && !permissions.some(p => user.permissions?.includes(p))) {
    return NextResponse.json(
      { success: false, error: '当前账号没有执行此操作的权限' },
      { status: 403 }
    );
  }

  return null;
}
