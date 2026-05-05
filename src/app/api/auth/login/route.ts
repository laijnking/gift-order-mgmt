import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 签名密钥（生产环境应从环境变量读取）
const AUTH_SECRET = process.env.AUTH_SECRET || 'gift-order-mgmt-secret-key-change-in-production';
const SIGNATURE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// 密码哈希配置（使用 PBKDF2，比 SHA256 更安全）
const HASH_SECRET = process.env.PASSWORD_HASH_SECRET || AUTH_SECRET;
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
 * 支持旧格式（SHA256 明文存储）和新格式（PBKDF2）
 */
function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;

  // 检测哈希格式
  // 新格式：salt$hash（PBKDF2）
  if (storedHash.includes('$')) {
    const parts = storedHash.split('$');
    if (parts.length === 2) {
      const [salt, hash] = parts;
      const { hash: expectedHash } = hashPassword(password, salt);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
    }
  }

  // 旧格式检测：SHA256 哈希（32 字符 hex）
  if (storedHash.length === 64 && /^[a-f0-9]+$/.test(storedHash)) {
    const hash = sha256(password);
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

const FALLBACK_PERMISSIONS: Record<string, string[]> = {
  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_EDIT, PERMISSIONS.ORDERS_DELETE, PERMISSIONS.ORDERS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT, PERMISSIONS.CUSTOMERS_DELETE,
    PERMISSIONS.SUPPLIERS_VIEW, PERMISSIONS.SUPPLIERS_CREATE, PERMISSIONS.SUPPLIERS_EDIT, PERMISSIONS.SUPPLIERS_DELETE,
    PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_EDIT, PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.STOCKS_VIEW, PERMISSIONS.STOCKS_EDIT,
    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT, PERMISSIONS.USERS_DELETE,
    PERMISSIONS.AGENT_CONFIGS_VIEW, PERMISSIONS.AGENT_CONFIGS_EDIT,
    PERMISSIONS.AI_LOGS_VIEW,
    PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_EDIT,
  ],
  salesperson: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_EDIT, PERMISSIONS.ORDERS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.STOCKS_VIEW,
  ],
  operator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.STOCKS_VIEW,
  ],
  sales_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_CREATE, PERMISSIONS.ORDERS_EDIT, PERMISSIONS.ORDERS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.STOCKS_VIEW,
  ],
  finance: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.STOCKS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
};

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * 生成用户信息签名
 * 签名包含用户 ID 和权限，服务端验证时根据用户 ID 查询真实权限进行对比
 */
function generateUserSignature(userId: string, permissions: string[]): { signature: string; timestamp: number } {
  const timestamp = Date.now();
  const dataToSign = `${userId}:${permissions.sort().join(',')}:${timestamp}`;
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(dataToSign).digest('hex');
  return { signature, timestamp };
}

/**
 * 验证用户信息签名
 * 通过用户 ID 查询数据库获取当前真实权限，与签名中的权限进行对比
 */
async function verifyUserSignature(
  client: ReturnType<typeof getSupabaseClient>,
  userId: string,
  permissions: string[],
  signature: string,
  timestamp: number
): Promise<{ valid: boolean; reason?: string }> {
  // 检查时间戳是否过期
  const now = Date.now();
  if (Math.abs(now - timestamp) > SIGNATURE_MAX_AGE_MS) {
    return { valid: false, reason: '签名已过期' };
  }

  // 获取用户在数据库中的真实权限
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

  // 获取真实权限
  const roleMeta = await getRoleMeta(client, user.role || '');
  const realPermissions = roleMeta.permissions.sort();

  // 对比签名中的权限与真实权限
  const signedPermissions = [...permissions].sort();
  if (JSON.stringify(signedPermissions) !== JSON.stringify(realPermissions)) {
    return { valid: false, reason: '权限已变更，请重新登录' };
  }

  // 重新计算签名并验证
  const dataToSign = `${userId}:${realPermissions.join(',')}:${timestamp}`;
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

async function getRoleMeta(client: ReturnType<typeof getSupabaseClient>, roleCode: string) {
  const { data: role } = await client
    .from('roles')
    .select('id, code, name, data_scope')
    .eq('code', roleCode)
    .maybeSingle();

  if (!role) {
    return {
      roleName: roleCode,
      dataScope: roleCode === 'admin' ? 'all' : 'self',
      permissions: FALLBACK_PERMISSIONS[roleCode] || [],
    };
  }

  // 使用 Pool 直接查询获取权限，避免 LocalSupabaseClient 不支持跨表 join 的问题
  let permissions: string[] = [];
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    const pool = new Pool({ connectionString: dbUrl });
    try {
      const { data: permissionLinks } = await client
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', role.id);

      if (permissionLinks && permissionLinks.length > 0) {
        const permIds = permissionLinks.map((p: Record<string, unknown>) => p.permission_id as string);
        const idsParam = permIds.map((_, i) => `$${i + 1}`).join(', ');
        const result = await pool.query(
          `SELECT code FROM permissions WHERE id IN (${idsParam})`,
          permIds
        );
        permissions = result.rows.map(r => r.code as string);
      }
    } finally {
      await pool.end();
    }
  }

  // 如果数据库查询结果为空，使用 fallback
  if (permissions.length === 0) {
    permissions = FALLBACK_PERMISSIONS[role.code] || [];
  }

  return {
    roleName: role.name,
    dataScope: role.data_scope || 'self',
    permissions,
  };
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return NextResponse.json({ success: false, error: '用户名和密码不能为空' }, { status: 400 });
    }

    const { data: user, error } = await client
      .from('users')
      .select('id, username, real_name, role, department, is_active, password_hash')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }

    if (!user || !user.is_active) {
      return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 });
    }

    // 验证密码（支持旧格式 SHA256 和新格式 PBKDF2）
    const passwordValid = verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 });
    }

    // 如果是旧格式 SHA256，自动升级到 PBKDF2
    if (user.password_hash && user.password_hash.length === 64 && /^[a-f0-9]+$/.test(user.password_hash)) {
      const { hash, salt } = hashPassword(password);
      await client
        .from('users')
        .update({ password_hash: `${salt}$${hash}` })
        .eq('id', user.id);
    }

    const roleMeta = await getRoleMeta(client, user.role || '');

    // 生成签名
    const { signature, timestamp } = generateUserSignature(user.id, roleMeta.permissions);

    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name || user.username,
        role: user.role || '',
        roleName: roleMeta.roleName,
        department: user.department || '',
        dataScope: roleMeta.dataScope,
        permissions: roleMeta.permissions,
        // 添加签名信息
        authSignature: signature,
        authTimestamp: timestamp,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
