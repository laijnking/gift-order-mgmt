import { randomUUID } from 'crypto';
import path from 'path';

import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

import {
  ADMIN_USER,
  assert,
  buildAuthedHeaders,
  DEFAULT_HOST,
  fetchJson,
  startServer,
  stopServer,
  waitForServer,
} from './lib/api-test-harness';
import { loadEnv } from '@/storage/database/supabase-client';

const PORT = 5231;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const RUN_ID = `alert-executor-${Date.now()}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

type JsonObject = Record<string, unknown>;

type TestContext = {
  pool: Pool;
};

type TestCase = {
  name: string;
  run: (ctx: TestContext) => Promise<void>;
};

type ApiEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type ExecuteRuleResponse = {
  executedRules: number;
  summaries: Array<{
    ruleId: string;
    ruleCode: string;
    ruleName: string;
    triggered: number;
    reused: number;
    resolved: number;
  }>;
  totals: {
    triggered: number;
    reused: number;
    resolved: number;
  };
};

const insertedSupplierIds: string[] = [];
const insertedProductIds: string[] = [];
const insertedStockIds: string[] = [];
const insertedOrderIds: string[] = [];
const insertedRuleIds: string[] = [];
const insertedRuleCodes: string[] = [];

function logPass(step: string) {
  console.log(`PASS ${step}`);
}

function getPool() {
  loadEnv();

  if (!process.env.NEXT_PUBLIC_SUPABASE_DB_URL && !process.env.DATABASE_URL) {
    loadDotenv({ path: path.join(process.cwd(), '.env.docker') });
  }

  const connectionString = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || process.env.DATABASE_URL;
  const isPlaceholderConnection =
    !connectionString ||
    connectionString.includes('your-password') ||
    connectionString.includes('localhost:5432/postgres');
  const resolved = isPlaceholderConnection ? DEFAULT_DATABASE_URL : connectionString;
  process.env.DATABASE_URL = resolved;
  process.env.NEXT_PUBLIC_SUPABASE_DB_URL = resolved;

  return new Pool({
    connectionString: resolved,
    max: 4,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });
}

async function assertDatabaseReady(pool: Pool) {
  try {
    await pool.query('select 1');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`数据库不可用，无法执行 alert executor 集成测试: ${message}`);
  }
}

async function queryOne<T extends JsonObject>(pool: Pool, sql: string, params: unknown[]) {
  const result = await pool.query<T>(sql, params);
  return result.rows[0] ?? null;
}

async function queryCount(pool: Pool, sql: string, params: unknown[]) {
  const row = await queryOne<{ total: string }>(pool, sql, params);
  return Number(row?.total || '0');
}

async function insertSupplier(pool: Pool) {
  const id = randomUUID();
  const name = `预警发货方-${RUN_ID}-${id.slice(0, 6)}`;

  await pool.query(
    `
      insert into suppliers (
        id,
        name,
        short_name,
        type,
        send_type,
        is_active,
        created_at,
        updated_at
      )
      values ($1, $2, $3, 'self', 'self', true, now(), now())
    `,
    [id, name, `简称-${id.slice(0, 4)}`]
  );

  insertedSupplierIds.push(id);
  return { id, name };
}

async function insertProduct(pool: Pool) {
  const id = randomUUID();
  const code = `ALERT-SKU-${id.slice(0, 8)}`;
  const name = `预警测试商品-${RUN_ID}-${id.slice(0, 6)}`;

  await pool.query(
    `
      insert into products (
        id,
        code,
        name,
        spec,
        is_active,
        created_at,
        updated_at
      )
      values ($1, $2, $3, '默认规格', true, now(), now())
    `,
    [id, code, name]
  );

  insertedProductIds.push(id);
  return { id, code, name };
}

async function insertStock(
  pool: Pool,
  options: { supplierId: string; supplierName: string; productId: string; productCode: string; productName: string; quantity: number }
) {
  const id = randomUUID();

  await pool.query(
    `
      insert into stocks (
        id,
        product_id,
        product_code,
        product_name,
        supplier_id,
        supplier_name,
        quantity,
        reserved_quantity,
        unit_price,
        status,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, 0, 99, 'active', now(), now())
    `,
    [id, options.productId, options.productCode, options.productName, options.supplierId, options.supplierName, options.quantity]
  );

  insertedStockIds.push(id);
  return { id };
}

async function insertOrder(
  pool: Pool,
  options: {
    status: string;
    createdAt?: string;
    assignedAt?: string | null;
    trackingNo?: string | null;
  }
) {
  const id = randomUUID();
  const orderNo = `ALERT-ORDER-${id.slice(0, 8)}`;

  await pool.query(
    `
      insert into orders (
        id,
        order_no,
        status,
        items,
        receiver_name,
        receiver_phone,
        receiver_address,
        customer_code,
        customer_name,
        salesperson,
        source,
        sys_order_no,
        operator_name,
        created_at,
        assigned_at,
        tracking_no
      )
      values (
        $1, $2, $3, '[]'::jsonb, '测试收货人', '13900000000', '上海市测试路 1 号',
        'ALERT-CUST', '预警测试客户', '测试业务员', 'api-test', $4, '测试跟单员', $5, $6, $7
      )
    `,
    [
      id,
      orderNo,
      options.status,
      `SYS-${RUN_ID}-${id.slice(0, 8)}`,
      options.createdAt ?? new Date().toISOString(),
      options.assignedAt ?? null,
      options.trackingNo ?? null,
    ]
  );

  insertedOrderIds.push(id);
  return { id, orderNo };
}

async function insertRule(
  pool: Pool,
  options: {
    code: string;
    name: string;
    type: string;
    config: JsonObject;
  }
) {
  const id = randomUUID();

  await pool.query(
    `
      insert into alert_rules (
        id,
        name,
        code,
        type,
        config,
        priority,
        is_enabled,
        description,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5::jsonb, 9, true, 'api-test', now(), now())
    `,
    [id, options.name, options.code, options.type, JSON.stringify(options.config)]
  );

  insertedRuleIds.push(id);
  insertedRuleCodes.push(options.code);
  return { id, code: options.code };
}

async function executeRule(ruleId: string) {
  const response = await fetchJson<ApiEnvelope<ExecuteRuleResponse>>(`${BASE_URL}/api/alert-rules/execute`, {
    method: 'POST',
    headers: buildAuthedHeaders(ADMIN_USER),
    body: JSON.stringify({ ruleId }),
  });

  assert(response.status === 200, `执行规则 ${ruleId} 应返回 200，实际 ${response.status}`);
  assert(response.data.success === true, `执行规则 ${ruleId} 应成功`);
  assert(response.data.data, `执行规则 ${ruleId} 缺少 data`);
  return response.data.data as ExecuteRuleResponse;
}

async function cleanup(pool: Pool) {
  if (insertedRuleCodes.length > 0) {
    await pool.query('delete from alert_records where rule_code = any($1::varchar[])', [insertedRuleCodes]);
  }
  if (insertedRuleIds.length > 0) {
    await pool.query('delete from alert_rules where id = any($1::uuid[])', [insertedRuleIds]);
  }
  if (insertedStockIds.length > 0) {
    await pool.query('delete from stocks where id = any($1::uuid[])', [insertedStockIds]);
  }
  if (insertedProductIds.length > 0) {
    await pool.query('delete from products where id = any($1::uuid[])', [insertedProductIds]);
  }
  if (insertedSupplierIds.length > 0) {
    await pool.query('delete from suppliers where id = any($1::uuid[])', [insertedSupplierIds]);
  }
  if (insertedOrderIds.length > 0) {
    await pool.query('delete from orders where id = any($1::varchar[])', [insertedOrderIds]);
  }
}

const tests: TestCase[] = [
  {
    name: 'low stock rule creates, reuses, and resolves alert records',
    async run({ pool }) {
      const supplier = await insertSupplier(pool);
      const product = await insertProduct(pool);
      const stock = await insertStock(pool, {
        supplierId: supplier.id,
        supplierName: supplier.name,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        quantity: 1,
      });
      const rule = await insertRule(pool, {
        code: `LOW-STOCK-${RUN_ID}`,
        name: `库存规则-${RUN_ID}`,
        type: 'stock',
        config: { threshold: 2, compare: 'lte' },
      });

      const firstRun = await executeRule(rule.id);
      assert(firstRun.executedRules === 1, '库存规则首次执行应只执行 1 条规则');
      assert(firstRun.totals.triggered >= 1, '库存规则首次执行至少应新增 1 条预警');

      const unresolvedCount = await queryCount(
        pool,
        'select count(*) as total from alert_records where rule_code = $1 and stock_id = $2 and is_resolved = false',
        [rule.code, stock.id]
      );
      assert(unresolvedCount === 1, '库存规则首次执行后应存在 1 条未处理预警');

      const secondRun = await executeRule(rule.id);
      const recordCountAfterReuse = await queryCount(
        pool,
        'select count(*) as total from alert_records where rule_code = $1 and stock_id = $2',
        [rule.code, stock.id]
      );
      const unresolvedAfterReuse = await queryCount(
        pool,
        'select count(*) as total from alert_records where rule_code = $1 and stock_id = $2 and is_resolved = false',
        [rule.code, stock.id]
      );
      assert(recordCountAfterReuse === 1, '库存规则二次执行后不应为同一库存重复创建记录');
      assert(unresolvedAfterReuse === 1, '库存规则二次执行后测试库存应仍保持 1 条未处理预警');

      await pool.query('update stocks set quantity = 8, updated_at = now() where id = $1', [stock.id]);

      const thirdRun = await executeRule(rule.id);
      const unresolvedAfterResolve = await queryCount(
        pool,
        'select count(*) as total from alert_records where rule_code = $1 and stock_id = $2 and is_resolved = false',
        [rule.code, stock.id]
      );
      assert(unresolvedAfterResolve === 0, '库存恢复后测试库存不应再保留未处理预警');

      const resolvedRecord = await queryOne<{
        is_resolved: boolean;
        resolved_by: string | null;
        resolution: string | null;
      }>(
        pool,
        'select is_resolved, resolved_by, resolution from alert_records where rule_code = $1 and stock_id = $2 order by created_at desc limit 1',
        [rule.code, stock.id]
      );
      assert(resolvedRecord?.is_resolved === true, '库存恢复后预警应被标记为已处理');
      assert(resolvedRecord?.resolved_by === 'alert_executor', '库存恢复后预警应标记为 alert_executor 自动关闭');
      assert(resolvedRecord?.resolution?.includes('库存已恢复'), '库存恢复后应写入自动关闭说明');
    },
  },
  {
    name: 'order timeout rule creates, reuses, and resolves alert records',
    async run({ pool }) {
      const order = await insertOrder(pool, {
        status: 'pending',
        createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      });
      const rule = await insertRule(pool, {
        code: `ORDER-TIMEOUT-${RUN_ID}`,
        name: `订单超时规则-${RUN_ID}`,
        type: 'order',
        config: { timeout_hours: 24 },
      });

      const firstRun = await executeRule(rule.id);
      assert(firstRun.totals.triggered >= 1, '订单超时首次执行至少应新增 1 条预警');

      const createdForOrder = await queryCount(
        pool,
        'select count(*) as total from alert_records where rule_code = $1 and order_id = $2 and is_resolved = false',
        [rule.code, order.id]
      );
      assert(createdForOrder === 1, '订单超时首次执行后应为测试订单生成 1 条未处理预警');

      const secondRun = await executeRule(rule.id);
      assert(secondRun.totals.reused >= 1, '订单超时二次执行至少应复用 1 条已有预警');

      await pool.query("update orders set status = 'assigned', assigned_at = now() where id = $1", [order.id]);

      const thirdRun = await executeRule(rule.id);
      assert(thirdRun.totals.resolved >= 1, '订单状态变化后至少应自动关闭 1 条超时预警');

      const resolvedForOrder = await queryOne<{ is_resolved: boolean }>(
        pool,
        'select is_resolved from alert_records where rule_code = $1 and order_id = $2 order by created_at desc limit 1',
        [rule.code, order.id]
      );
      assert(resolvedForOrder?.is_resolved === true, '订单状态变化后测试订单的超时预警应被自动关闭');
    },
  },
  {
    name: 'return delay rule creates, reuses, and resolves alert records',
    async run({ pool }) {
      const order = await insertOrder(pool, {
        status: 'assigned',
        createdAt: new Date(Date.now() - 80 * 60 * 60 * 1000).toISOString(),
        assignedAt: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
        trackingNo: null,
      });
      const rule = await insertRule(pool, {
        code: `RETURN-DELAY-${RUN_ID}`,
        name: `回单超时规则-${RUN_ID}`,
        type: 'return',
        config: { delay_hours: 48 },
      });

      const firstRun = await executeRule(rule.id);
      assert(firstRun.totals.triggered >= 1, '回单超时首次执行至少应新增 1 条预警');

      const createdForOrder = await queryCount(
        pool,
        'select count(*) as total from alert_records where rule_code = $1 and order_id = $2 and is_resolved = false',
        [rule.code, order.id]
      );
      assert(createdForOrder === 1, '回单超时首次执行后应为测试订单生成 1 条未处理预警');

      const secondRun = await executeRule(rule.id);
      assert(secondRun.totals.reused >= 1, '回单超时二次执行至少应复用 1 条已有预警');

      await pool.query("update orders set tracking_no = 'SF123456789CN', status = 'returned' where id = $1", [order.id]);

      const thirdRun = await executeRule(rule.id);
      assert(thirdRun.totals.resolved >= 1, '回传物流后至少应自动关闭 1 条回单超时预警');

      const resolvedForOrder = await queryOne<{ is_resolved: boolean }>(
        pool,
        'select is_resolved from alert_records where rule_code = $1 and order_id = $2 order by created_at desc limit 1',
        [rule.code, order.id]
      );
      assert(resolvedForOrder?.is_resolved === true, '回传物流后测试订单的回单超时预警应被自动关闭');
    },
  },
];

async function run() {
  const pool = getPool();
  await assertDatabaseReady(pool);
  const child = startServer(PORT);

  try {
    await waitForServer(BASE_URL, child);

    for (const test of tests) {
      await test.run({ pool });
      logPass(test.name);
    }

    console.log('All alert executor checks passed.');
  } finally {
    await stopServer(child);
    await cleanup(pool);
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
