import {
  ADMIN_USER,
  assert,
  buildAuthedHeaders,
  DEFAULT_HOST,
  fetchJson,
  startServer,
  stopServer,
  type MockUser,
  waitForServer,
} from './lib/api-test-harness';

type ApiEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  total?: number;
  error?: string;
  message?: string;
};

const PORT = 5226;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;

const CUSTOMERS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-customers-viewer',
  username: 'customers-viewer',
  permissions: ['customers:view'],
};

const PRODUCTS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-products-viewer',
  username: 'products-viewer',
  permissions: ['products:view'],
};

const SUPPLIERS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-suppliers-viewer',
  username: 'suppliers-viewer',
  permissions: ['suppliers:view'],
};

const ORDERS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-orders-viewer',
  username: 'orders-viewer',
  permissions: ['orders:view'],
};

const DASHBOARD_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-dashboard-viewer',
  username: 'dashboard-viewer',
  permissions: ['dashboard:view'],
};

const SETTINGS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-settings-viewer',
  username: 'settings-viewer',
  permissions: ['settings:view'],
};

const AGENT_CONFIGS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-agent-configs-viewer',
  username: 'agent-configs-viewer',
  permissions: ['agent_configs:view'],
};

const AI_LOGS_VIEWER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-ai-logs-viewer',
  username: 'ai-logs-viewer',
  permissions: ['ai_logs:view'],
};

const NO_PERMISSION_USER: MockUser = {
  ...ADMIN_USER,
  id: 'permission-none',
  username: 'permission-none',
  permissions: [],
};

function logPass(step: string) {
  console.log(`PASS ${step}`);
}

async function expectUnauthorized(path: string, init?: RequestInit) {
  const response = await fetchJson<ApiEnvelope>(`${BASE_URL}${path}`, init);
  assert(response.status === 401, `${path} should return 401 without user context`);
  assert(response.data.success === false, `${path} should fail without user context`);
  assert(response.data.error?.includes('未登录') || response.data.error?.includes('缺少用户上下文'), `${path} should explain missing auth context`);
}

async function expectForbidden(path: string, user: MockUser, init?: RequestInit) {
  const headers = {
    ...buildAuthedHeaders(user),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetchJson<ApiEnvelope>(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  assert(response.status === 403, `${path} should return 403 for ${user.username}`);
  assert(response.data.success === false, `${path} should fail for ${user.username}`);
  assert(response.data.error?.includes('没有执行此操作的权限'), `${path} should explain permission denial`);
}

async function expectNotDenied(path: string, user: MockUser, init?: RequestInit) {
  const headers = {
    ...buildAuthedHeaders(user),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetchJson<ApiEnvelope>(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  assert(
    response.status !== 401 && response.status !== 403,
    `${path} should not be denied for ${user.username}, got ${response.status}`
  );
}

async function run() {
  const child = startServer(PORT);

  try {
    await waitForServer(BASE_URL, child);

    await expectUnauthorized('/api/customers');
    logPass('customers GET requires user context');

    await expectNotDenied('/api/customers', CUSTOMERS_VIEWER);
    logPass('customers GET allows customers:view without auth denial');

    await expectForbidden('/api/import/customers', CUSTOMERS_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ name: 'Permission Customer' }] }),
    });
    logPass('customer import blocks customers:view-only user');

    await expectNotDenied('/api/products', PRODUCTS_VIEWER);
    logPass('products GET allows products:view without auth denial');

    await expectForbidden('/api/products', PRODUCTS_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'PERM-PROD-1', name: 'Permission Product' }),
    });
    logPass('products POST blocks products:view-only user');

    await expectNotDenied('/api/suppliers', SUPPLIERS_VIEWER);
    logPass('suppliers GET allows suppliers:view without auth denial');

    await expectForbidden('/api/shippers/batch', SUPPLIERS_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'import', items: [] }),
    });
    logPass('shippers batch blocks suppliers:view-only user');

    await expectNotDenied('/api/alert-records', ORDERS_VIEWER);
    logPass('alert records GET allows orders:view without auth denial');

    await expectForbidden('/api/alert-records', ORDERS_VIEWER, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['fake-id'], isRead: true }),
    });
    logPass('alert records PATCH blocks orders:view-only user');

    await expectNotDenied('/api/reports/stats', DASHBOARD_VIEWER);
    logPass('reports stats allows dashboard:view without auth denial');

    await expectForbidden('/api/reports/stats', NO_PERMISSION_USER);
    logPass('reports stats blocks user without dashboard:view');

    await expectNotDenied('/api/permissions', SETTINGS_VIEWER);
    logPass('permissions GET allows settings:view without auth denial');

    await expectForbidden('/api/fetch-url', SETTINGS_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });
    logPass('fetch-url POST blocks settings:view-only user');

    await expectNotDenied('/api/agent-configs', AGENT_CONFIGS_VIEWER);
    logPass('agent-configs GET allows agent_configs:view without auth denial');

    await expectForbidden('/api/agent-configs', AGENT_CONFIGS_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'perm-agent', name: 'Permission Agent', type: 'custom' }),
    });
    logPass('agent-configs POST blocks agent_configs:view-only user');

    await expectNotDenied('/api/ai-logs', AI_LOGS_VIEWER);
    logPass('ai-logs GET allows ai_logs:view without auth denial');

    await expectForbidden('/api/ai-test', AGENT_CONFIGS_VIEWER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'permission test' }),
    });
    logPass('ai-test POST blocks agent_configs:view-only user');

    console.log('All permission regression checks passed.');
  } finally {
    await stopServer(child);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
