import { randomUUID } from 'crypto';
import path from 'path';
import { Pool } from 'pg';
import { config as loadDotenv } from 'dotenv';

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

const PORT = 5129;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const RUN_ID = `api-reports-${Date.now()}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

type JsonObject = Record<string, unknown>;

const insertedSupplierIds: string[] = [];
const insertedStockIds: string[] = [];
const insertedProductIds: string[] = [];
const insertedOrderIds: string[] = [];

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
    await pool.query('SELECT 1');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`数据库不可用，无法执行 reports API 集成测试: ${message}`);
  }
}

async function seedSupplier(pool: Pool, input: { name: string; isActive: boolean }) {
  const id = randomUUID();
  await pool.query(
    `
      INSERT INTO suppliers (
        id, name, short_name, type, send_type, is_active, created_at
      ) VALUES ($1, $2, $3, 'supplier', 'manual', $4, now())
    `,
    [id, input.name, input.name.slice(0, 8), input.isActive]
  );
  insertedSupplierIds.push(id);
  return id;
}

async function seedProduct(pool: Pool, sku: string, name: string) {
  const id = randomUUID();
  await pool.query(
    `
      INSERT INTO products (
        id, code, sku, name, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at
      ) VALUES ($1, $2, $2, $3, 10, 20, '在售', true, now(), now())
    `,
    [id, sku, name]
  );
  insertedProductIds.push(id);
  return id;
}

async function seedStock(pool: Pool, input: {
  supplierId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}) {
  const id = randomUUID();
  await pool.query(
    `
      INSERT INTO stocks (
        id, product_id, product_code, product_name, supplier_id, supplier_name,
        quantity, reserved_quantity, unit_price, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'active', now(), now())
    `,
    [id, input.productId, input.productCode, input.productName, input.supplierId, `供应商-${RUN_ID}`, input.quantity, input.unitPrice]
  );
  insertedStockIds.push(id);
}

async function seedOrder(pool: Pool, input: {
  supplierId: string;
  supplierName: string;
  status: string;
  orderNo: string;
  sysOrderNo: string;
  createdAt: string;
  assignedAt?: string | null;
  returnedAt?: string | null;
  completedAt?: string | null;
}) {
  const id = randomUUID();
  const items = [{ product_name: `测试商品-${RUN_ID}`, product_code: `SKU-${RUN_ID}`, quantity: 2, unit_price: 12.5 }];

  await pool.query(
    `
      INSERT INTO orders (
        id, order_no, status, items, receiver_name, receiver_phone, receiver_address,
        customer_code, customer_name, salesperson, operator_name, supplier_id, supplier_name,
        source, sys_order_no, created_at, updated_at, assigned_at, returned_at, completed_at
      )
      VALUES (
        $1, $2, $3, $4::jsonb, '测试收货人', '13900000000', '上海市测试路 1 号',
        'C-REPORT', '报表客户', '张三', '李四', $5, $6, 'api-test', $7,
        $8, $8, $9, $10, $11
      )
    `,
    [
      id,
      input.orderNo,
      input.status,
      JSON.stringify(items),
      input.supplierId,
      input.supplierName,
      input.sysOrderNo,
      input.createdAt,
      input.assignedAt || null,
      input.returnedAt || null,
      input.completedAt || null,
    ]
  );

  insertedOrderIds.push(id);
  return id;
}

async function cleanup(pool: Pool) {
  if (insertedOrderIds.length > 0) {
    await pool.query('DELETE FROM orders WHERE id = ANY($1::varchar[])', [insertedOrderIds]);
  }
  if (insertedStockIds.length > 0) {
    await pool.query('DELETE FROM stocks WHERE id = ANY($1::uuid[])', [insertedStockIds]);
  }
  if (insertedProductIds.length > 0) {
    await pool.query('DELETE FROM products WHERE id = ANY($1::uuid[])', [insertedProductIds]);
  }
  if (insertedSupplierIds.length > 0) {
    await pool.query('DELETE FROM suppliers WHERE id = ANY($1::uuid[])', [insertedSupplierIds]);
  }
}

function ensureObject(value: unknown, label: string) {
  assert(Boolean(value) && typeof value === 'object' && !Array.isArray(value), `${label} 不是对象`);
  return value as JsonObject;
}

function ensureArray(value: unknown, label: string) {
  assert(Array.isArray(value), `${label} 不是数组`);
  return value as JsonObject[];
}

async function main() {
  const pool = getPool();
  let server: ReturnType<typeof startServer> | null = null;

  try {
    await assertDatabaseReady(pool);

    // 查询基线统计（在 seed 之前），避免真实业务数据干扰断言
    const baselineOrderCounts = await pool.query(`
      SELECT status, COUNT(*)::int as count
      FROM orders
      WHERE created_at >= '2026-04-17' AND created_at < '2026-04-21'
      GROUP BY status
    `).then(r => Object.fromEntries(r.rows.map(row => [row.status, row.count])));

    const baselineActiveSupplierCount = await pool.query(`
      SELECT COUNT(*)::int as count FROM suppliers WHERE is_active = true
    `).then(r => r.rows[0].count);

    const baselineStockTotalValue = await pool.query(`
      SELECT COALESCE(SUM(quantity * unit_price), 0)::numeric as count FROM stocks
    `).then(r => Number(r.rows[0].count));

    await cleanup(pool).catch(() => {});

    const supplierId = await seedSupplier(pool, { name: `供应商-${RUN_ID}`, isActive: true });
    await seedSupplier(pool, { name: `停用供应商-${RUN_ID}`, isActive: false });
    const productId = await seedProduct(pool, `SKU-${RUN_ID}`, `测试商品-${RUN_ID}`);
    await seedStock(pool, {
      supplierId,
      productId,
      productCode: `SKU-${RUN_ID}`,
      productName: `测试商品-${RUN_ID}`,
      quantity: 5,
      unitPrice: 20,
    });

    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'pending',
      orderNo: `ORDER-${RUN_ID}-PENDING`,
      sysOrderNo: `SYS-${RUN_ID}-PENDING`,
      createdAt: '2026-04-18T08:00:00.000Z',
    });
    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'assigned',
      orderNo: `ORDER-${RUN_ID}-ASSIGNED`,
      sysOrderNo: `SYS-${RUN_ID}-ASSIGNED`,
      createdAt: '2026-04-18T08:00:00.000Z',
      assignedAt: '2026-04-18T12:00:00.000Z',
    });
    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'partial_returned',
      orderNo: `ORDER-${RUN_ID}-PARTIAL`,
      sysOrderNo: `SYS-${RUN_ID}-PARTIAL`,
      createdAt: '2026-04-18T08:00:00.000Z',
      assignedAt: '2026-04-18T12:00:00.000Z',
      returnedAt: '2026-04-19T09:00:00.000Z',
    });
    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'returned',
      orderNo: `ORDER-${RUN_ID}-RETURNED`,
      sysOrderNo: `SYS-${RUN_ID}-RETURNED`,
      createdAt: '2026-04-18T08:00:00.000Z',
      assignedAt: '2026-04-18T12:00:00.000Z',
      returnedAt: '2026-04-19T10:00:00.000Z',
    });
    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'feedbacked',
      orderNo: `ORDER-${RUN_ID}-FEEDBACKED`,
      sysOrderNo: `SYS-${RUN_ID}-FEEDBACKED`,
      createdAt: '2026-04-18T08:00:00.000Z',
      assignedAt: '2026-04-18T12:00:00.000Z',
      returnedAt: '2026-04-20T11:00:00.000Z',
    });
    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'completed',
      orderNo: `ORDER-${RUN_ID}-COMPLETED`,
      sysOrderNo: `SYS-${RUN_ID}-COMPLETED`,
      createdAt: '2026-04-18T08:00:00.000Z',
      assignedAt: '2026-04-18T12:00:00.000Z',
      returnedAt: '2026-04-19T13:00:00.000Z',
      completedAt: '2026-04-20T18:00:00.000Z',
    });
    await seedOrder(pool, {
      supplierId,
      supplierName: `供应商-${RUN_ID}`,
      status: 'cancelled',
      orderNo: `ORDER-${RUN_ID}-CANCELLED`,
      sysOrderNo: `SYS-${RUN_ID}-CANCELLED`,
      createdAt: '2026-04-18T08:00:00.000Z',
    });

    server = startServer(PORT);
    await waitForServer(BASE_URL, server);

    const statsResponse = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
      `${BASE_URL}/api/reports/stats?startDate=2026-04-17&endDate=2026-04-21`,
      { headers: buildAuthedHeaders(ADMIN_USER) }
    );
    assert(statsResponse.status === 200, `stats 应返回 200，实际 ${statsResponse.status}`);
    assert(statsResponse.data.success === true, `stats 请求失败: ${statsResponse.data.error ?? '未知错误'}`);
    const statsData = ensureObject(statsResponse.data.data, 'stats.data');
    const orderStatus = ensureObject(statsData.orderStatus, 'stats.data.orderStatus');
    const supplierStats = ensureObject(statsData.supplier, 'stats.data.supplier');
    const stockStats = ensureObject(statsData.stock, 'stats.data.stock');

    assert(orderStatus.pending === (baselineOrderCounts['pending'] ?? 0) + 1,
      `pending 应为 ${(baselineOrderCounts['pending'] ?? 0) + 1}，实际 ${String(orderStatus.pending)}`);
    assert(orderStatus.assigned === (baselineOrderCounts['assigned'] ?? 0) + 1,
      `assigned 应为 ${(baselineOrderCounts['assigned'] ?? 0) + 1}，实际 ${String(orderStatus.assigned)}`);
    assert(orderStatus.partial_returned === (baselineOrderCounts['partial_returned'] ?? 0) + 1,
      `partial_returned 应为 ${(baselineOrderCounts['partial_returned'] ?? 0) + 1}，实际 ${String(orderStatus.partial_returned)}`);
    assert(orderStatus.returned === (baselineOrderCounts['returned'] ?? 0) + 1,
      `returned 应为 ${(baselineOrderCounts['returned'] ?? 0) + 1}，实际 ${String(orderStatus.returned)}`);
    assert(orderStatus.feedbacked === (baselineOrderCounts['feedbacked'] ?? 0) + 1,
      `feedbacked 应为 ${(baselineOrderCounts['feedbacked'] ?? 0) + 1}，实际 ${String(orderStatus.feedbacked)}`);
    assert(orderStatus.completed === (baselineOrderCounts['completed'] ?? 0) + 1,
      `completed 应为 ${(baselineOrderCounts['completed'] ?? 0) + 1}，实际 ${String(orderStatus.completed)}`);
    assert(orderStatus.cancelled === (baselineOrderCounts['cancelled'] ?? 0) + 1,
      `cancelled 应为 ${(baselineOrderCounts['cancelled'] ?? 0) + 1}，实际 ${String(orderStatus.cancelled)}`);
    assert(supplierStats.active === baselineActiveSupplierCount + 1,
      `活跃供应商应为 ${baselineActiveSupplierCount + 1}，实际 ${String(supplierStats.active)}`);
    assert(Number(stockStats.totalValue) === baselineStockTotalValue + 100,
      `库存总值应为 ${baselineStockTotalValue + 100}，实际 ${stockStats.totalValue}`);

    const salesResponse = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
      `${BASE_URL}/api/reports/sales-performance?startDate=2026-04-17&endDate=2026-04-21`,
      { headers: buildAuthedHeaders(ADMIN_USER) }
    );
    assert(salesResponse.status === 200, `sales-performance 应返回 200，实际 ${salesResponse.status}`);
    assert(salesResponse.data.success === true, `sales-performance 失败: ${salesResponse.data.error ?? '未知错误'}`);
    const salesData = ensureObject(salesResponse.data.data, 'sales.data');
    const bySalesperson = ensureArray(salesData.bySalesperson, 'sales.data.bySalesperson');
    const salesperson = bySalesperson.find((item) => item.name === '张三');
    assert(Boolean(salesperson), '应找到业务员 张三');
    assert(salesperson?.returnedCount === 3, `returnedCount 应包含 partial_returned/returned/feedbacked 共 3 单，实际 ${String(salesperson?.returnedCount)}`);
    assert(salesperson?.completedCount === 1, `completedCount 应为 1，实际 ${String(salesperson?.completedCount)}`);
    assert(salesperson?.cancelledCount === 1, `cancelledCount 应为 1，实际 ${String(salesperson?.cancelledCount)}`);

    const supplierResponse = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
      `${BASE_URL}/api/reports/supplier-analysis?startDate=2026-04-17&endDate=2026-04-21`,
      { headers: buildAuthedHeaders(ADMIN_USER) }
    );
    assert(supplierResponse.status === 200, `supplier-analysis 应返回 200，实际 ${supplierResponse.status}`);
    assert(supplierResponse.data.success === true, `supplier-analysis 失败: ${supplierResponse.data.error ?? '未知错误'}`);
    const supplierData = ensureObject(supplierResponse.data.data, 'supplier.data');
    const bySupplier = ensureArray(supplierData.bySupplier, 'supplier.data.bySupplier');
    const matchedSupplier = bySupplier.find((item) => item.name === `供应商-${RUN_ID}`);
    assert(Boolean(matchedSupplier), '应找到测试供应商');
    const statusBreakdown = ensureObject(matchedSupplier?.statusBreakdown, 'supplier.bySupplier[0].statusBreakdown');
    assert(statusBreakdown.returned === 3, `供应商 returned 应包含 feedbacked 共 3 单，实际 ${String(statusBreakdown.returned)}`);

    const timelineResponse = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
      `${BASE_URL}/api/reports/return-timeline?startDate=2026-04-17&endDate=2026-04-21`,
      { headers: buildAuthedHeaders(ADMIN_USER) }
    );
    assert(timelineResponse.status === 200, `return-timeline 应返回 200，实际 ${timelineResponse.status}`);
    assert(timelineResponse.data.success === true, `return-timeline 失败: ${timelineResponse.data.error ?? '未知错误'}`);
    const timelineData = ensureObject(timelineResponse.data.data, 'timeline.data');
    const summary = ensureObject(timelineData.summary, 'timeline.data.summary');
    const timingList = ensureArray(timelineData.timingList, 'timeline.data.timingList');
    assert(summary.totalOrders === 5, `时效统计应只包含 assigned/partial_returned/returned/feedbacked/completed 共 5 单，实际 ${String(summary.totalOrders)}`);
    assert(summary.ordersWithReturn === 4, `ordersWithReturn 应为 4，实际 ${String(summary.ordersWithReturn)}`);
    assert(
      timingList.some((item) => item.sysOrderNo === `SYS-${RUN_ID}-FEEDBACKED`),
      'timingList 应包含 feedbacked 订单，证明 returned_at 已被纳入时效分析'
    );

    console.log('PASS reports API contract checks');
  } finally {
    try {
      await cleanup(pool);
    } finally {
      await pool.end();
      if (server) {
        await stopServer(server);
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
