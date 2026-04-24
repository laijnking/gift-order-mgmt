/**
 * 生产环境验收测试 - 华为云服务器
 * 测试目标: http://1.95.139.195
 */
import {
  ADMIN_USER,
  assert,
  buildAuthedHeaders,
  type MockUser,
} from './lib/api-test-harness';

const BASE = 'http://1.95.139.195';

type ApiEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
};

async function fetchApi<T = unknown>(
  path: string,
  init?: RequestInit & { user?: MockUser }
): Promise<{ status: number; body: ApiEnvelope<T> }> {
  const { user, ...rest } = (init || {}) as (typeof init) & { user?: MockUser };
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(user ? buildAuthedHeaders(user) : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...rest, headers });
  const body = (await res.json()) as ApiEnvelope<T>;
  return { status: res.status, body };
}

async function login(): Promise<MockUser> {
  const { status, body } = await fetchApi<{
    id: string;
    username: string;
    realName: string;
    role: string;
    roleName: string;
    dataScope: string;
    permissions: string[];
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });

  if (status !== 200 || !body.success) {
    throw new Error(`登录失败: ${status} ${body.error}`);
  }

  const u = body.data!;
  return {
    id: u.id,
    username: u.username,
    realName: u.realName,
    role: u.role,
    roleName: u.roleName,
    dataScope: u.dataScope,
    permissions: u.permissions,
  };
}

async function runCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  }
}

// ─── 1. 认证 ───────────────────────────────────────────────
async function testAuth() {
  await runCase('登录 admin/admin123', async () => {
    const { status, body } = await fetchApi<{
      id: string;
      username: string;
      realName: string;
      role: string;
      roleName: string;
      dataScope: string;
      permissions: string[];
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `登录失败: ${body.error}`);
    assert((body.data?.permissions?.length ?? 0) > 0, 'permissions 为空');
  });

  await runCase('登录失败（错误密码）', async () => {
    const { status, body } = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
    });
    assert(status === 401, `预期 401，实际 ${status}`);
    assert(body.success === false, '应返回 success=false');
  });

  await runCase('未登录访问受保护 API', async () => {
    const { status, body } = await fetchApi('/api/customers');
    assert(status === 401, `预期 401，实际 ${status}`);
    assert(body.success === false, '应返回 success=false');
  });
}

// ─── 2. 用户管理 ───────────────────────────────────────────
async function testUsers(admin: MockUser) {
  await runCase('GET /api/users 列出用户', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/users', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
    assert((body.data as unknown[]).length >= 3, '应至少有 3 个预设用户');
    const names = (body.data as { username: string }[]).map((u) => u.username);
    assert(names.includes('admin'), '应包含 admin');
  });
}

// ─── 3. 客户管理 ───────────────────────────────────────────
async function testCustomers(admin: MockUser) {
  await runCase('GET /api/customers 列出客户', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/customers', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('POST /api/customers 创建客户', async () => {
    const { status, body } = await fetchApi<{ id: string }>('/api/customers', {
      user: admin,
      method: 'POST',
      body: JSON.stringify({
        code: `TEST-C-${Date.now()}`,
        name: '自动化测试客户',
        type: 'normal',
        status: 'active',
      }),
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(body.data?.id, '应返回 id');
  });
}

// ─── 4. 商品管理 ───────────────────────────────────────────
async function testProducts(admin: MockUser) {
  await runCase('GET /api/products 列出商品', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/products', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('POST /api/products 创建商品', async () => {
    const { status, body } = await fetchApi<{ id: string }>('/api/products', {
      user: admin,
      method: 'POST',
      body: JSON.stringify({
        sku: `TEST-SKU-${Date.now()}`,
        name: '自动化测试商品',
        brand: '测试品牌',
        category: '测试分类',
        cost_price: 99.9,
        retail_price: 199.9,
        lifecycle_status: '在售',
      }),
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
  });
}

// ─── 5. 供应商/发货方管理 ───────────────────────────────────
async function testSuppliers(admin: MockUser) {
  await runCase('GET /api/suppliers 列出供应商', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/suppliers', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('POST /api/suppliers 创建供应商', async () => {
    const { status, body } = await fetchApi<{ id: string }>('/api/suppliers', {
      user: admin,
      method: 'POST',
      body: JSON.stringify({
        name: '自动化测试供应商',
        short_name: '测试',
        type: 'supplier',
        send_type: '直发',
        province: '广东',
        is_active: true,
      }),
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
  });

  await runCase('GET /api/shippers 列出发货方', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/shippers', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });
}

// ─── 6. 仓库管理 ────────────────────────────────────────────
async function testWarehouses(admin: MockUser) {
  await runCase('GET /api/warehouses 列出仓库', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/warehouses', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('POST /api/warehouses 创建仓库', async () => {
    const { status, body } = await fetchApi<{ id: string }>('/api/warehouses', {
      user: admin,
      method: 'POST',
      body: JSON.stringify({
        code: `TEST-WH-${Date.now()}`,
        name: '自动化测试仓库',
        type: '自有',
        province: '广东',
        city: '深圳',
        status: 'active',
      }),
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
  });
}

// ─── 7. 库存管理 ────────────────────────────────────────────
async function testStocks(admin: MockUser) {
  await runCase('GET /api/stocks 列出库存', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/stocks', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });
}

// ─── 8. 订单管理 ────────────────────────────────────────────
async function testOrders(admin: MockUser) {
  await runCase('GET /api/orders 列出订单', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/orders', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('POST /api/orders 创建订单', async () => {
    const { status, body } = await fetchApi<{ id: string }[]>('/api/orders', {
      user: admin,
      method: 'POST',
      body: JSON.stringify({
        customerCode: 'TEST-C001',
        customerName: '测试客户',
        salespersonName: 'admin',
        operatorName: 'admin',
        receiver: {
          name: '收件人测试',
          phone: '13800138000',
          address: '广东省深圳市南山区测试地址',
        },
        items: [
          {
            productName: '测试商品',
            quantity: 2,
            price: 100,
          },
        ],
      }),
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data) && body.data.length > 0, '应返回订单');
  });
}

// ─── 9. 模板管理 ────────────────────────────────────────────
async function testTemplates(admin: MockUser) {
  await runCase('GET /api/templates 列出模板', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/templates', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('GET /api/templates/default/shipping 获取默认发货模板', async () => {
    const { status, body } = await fetchApi<{ id: string }>('/api/templates/default/shipping', {
      user: admin,
    });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(body.data?.id, '应返回模板 id');
  });
}

// ─── 10. 列映射管理 ─────────────────────────────────────────
async function testColumnMappings(admin: MockUser) {
  await runCase('GET /api/column-mappings 列出列映射', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/column-mappings', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });
}

// ─── 11. 报表统计 ───────────────────────────────────────────
async function testReports(admin: MockUser) {
  await runCase('GET /api/reports/stats 统计面板', async () => {
    const { status, body } = await fetchApi<unknown>('/api/reports/stats', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
  });
}

// ─── 12. 角色与权限 ─────────────────────────────────────────
async function testRolesPermissions(admin: MockUser) {
  await runCase('GET /api/roles 列出角色', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/roles', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });

  await runCase('GET /api/permissions 列出权限', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/permissions', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });
}

// ─── 13. 预警规则 ───────────────────────────────────────────
async function testAlertRules(admin: MockUser) {
  await runCase('GET /api/alert-rules 列出预警规则', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/alert-rules', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });
}

// ─── 14. 导出记录 ───────────────────────────────────────────
async function testExportRecords(admin: MockUser) {
  await runCase('GET /api/export-records 列出导出记录', async () => {
    const { status, body } = await fetchApi<unknown[]>('/api/export-records', { user: admin });
    assert(status === 200, `预期 200，实际 ${status}`);
    assert(body.success === true, `失败: ${body.error}`);
    assert(Array.isArray(body.data), 'data 应为数组');
  });
}

// ─── 15. 权限回归 ───────────────────────────────────────────
async function testPermissionRegression() {
  const noPermUser: MockUser = {
    ...ADMIN_USER,
    id: 'no-perm-test',
    username: 'no-perm-test',
    permissions: [],
  };

  const ordersOnlyUser: MockUser = {
    ...ADMIN_USER,
    id: 'orders-only-test',
    username: 'orders-only-test',
    permissions: ['orders:view'],
  };

  await runCase('无权限用户 GET /api/customers 应拒绝', async () => {
    const { status, body } = await fetchApi('/api/customers', { user: noPermUser });
    assert(status === 403, `预期 403，实际 ${status}`);
  });

  await runCase('orders:view 用户 GET /api/customers 应拒绝', async () => {
    const { status, body } = await fetchApi('/api/customers', { user: ordersOnlyUser });
    assert(status === 403, `预期 403，实际 ${status}`);
  });

  await runCase('orders:view 用户 GET /api/orders 不应拒绝', async () => {
    const { status, body } = await fetchApi('/api/orders', { user: ordersOnlyUser });
    assert(status !== 401 && status !== 403, `预期通过，实际 ${status}`);
  });

  await runCase('orders:view 用户 POST /api/orders 应拒绝', async () => {
    const { status } = await fetchApi('/api/orders', {
      user: ordersOnlyUser,
      method: 'POST',
      body: JSON.stringify({ customerCode: 'C1', items: [] }),
    });
    assert(status === 403, `预期 403，实际 ${status}`);
  });
}

// ─── 16. 页面可访问性 ───────────────────────────────────────
async function testPages() {
  const pages = [
    '/',
    '/login',
    '/orders',
    '/customers',
    '/products',
    '/suppliers-manage',
    '/warehouses-manage',
    '/stocks',
    '/templates',
    '/shipping-export',
    '/export-records',
    '/return-receipt',
    '/order-parse',
    '/order-cost-history',
    '/reports',
    '/alerts',
    '/users',
    '/roles',
  ];

  for (const page of pages) {
    await runCase(`页面 GET ${page}`, async () => {
      const res = await fetch(`${BASE}${page}`, { method: 'GET' });
      assert(res.status === 200, `预期 200，实际 ${res.status}`);
    });
  }
}

// ─── 17. 静态资源 ───────────────────────────────────────────
async function testStaticAssets() {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();

  const hasNextJs = html.includes('/_next/static/');
  assert(hasNextJs, '首页应包含 Next.js 静态资源引用');

  // 提取一个 JS chunk URL 并测试可访问性
  const match = html.match(/"\/_next\/static\/chunks\/[^"]+\.js"/);
  if (match) {
    const jsPath = match[0].slice(1, -1);
    const jsRes = await fetch(`${BASE}${jsPath}`);
    assert(jsRes.status === 200, `JS chunk ${jsPath} 应可访问`);
  }
}

// ─── 主流程 ─────────────────────────────────────────────────
async function main() {
  console.log('========================================');
  console.log(' 生产环境验收测试 - 华为云服务器');
  console.log(` 测试目标: ${BASE}`);
  console.log('========================================\n');

  const admin = await login();
  console.log(`\n已登录: ${admin.username} (${admin.role})\n`);

  console.log('--- 1. 认证 ---');
  await testAuth();

  console.log('\n--- 2-15. API 模块测试 ---');
  await testUsers(admin);
  await testCustomers(admin);
  await testProducts(admin);
  await testSuppliers(admin);
  await testWarehouses(admin);
  await testStocks(admin);
  await testOrders(admin);
  await testTemplates(admin);
  await testColumnMappings(admin);
  await testReports(admin);
  await testRolesPermissions(admin);
  await testAlertRules(admin);
  await testExportRecords(admin);

  console.log('\n--- 16. 权限回归 ---');
  await testPermissionRegression();

  console.log('\n--- 17-18. 前端验证 ---');
  await testPages();
  await testStaticAssets();

  console.log('\n========================================');
  if (!process.exitCode) {
    console.log(' 全部验收测试通过！');
  } else {
    console.log(' 部分测试失败，请查看上方输出。');
  }
  console.log('========================================');
}

main().catch((e) => {
  console.error('测试执行异常:', e);
  process.exitCode = 1;
});
