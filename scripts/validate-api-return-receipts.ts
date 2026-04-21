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

const PORT = 5127;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const RUN_ID = `api-return-receipts-${Date.now()}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

type JsonObject = Record<string, unknown>;

type TestContext = {
  pool: Pool;
};

type TestCase = {
  name: string;
  run: (ctx: TestContext) => Promise<void>;
};

type SeedRecordOptions = {
  supplierId?: string;
  supplierName?: string;
  fileName?: string;
  totalCount?: number;
  matchedCount?: number;
  unmatchedCount?: number;
};

type SeedOrderOptions = {
  supplierId?: string;
  supplierName?: string;
  orderNo?: string;
  supplierOrderNo?: string;
  status?: string;
};

type SeedReceiptOptions = {
  recordId: string;
  supplierId: string;
  supplierName: string;
  customerOrderNo: string;
  supplierOrderNo?: string;
  expressCompany?: string;
  trackingNo?: string;
  shipDate?: string;
  matchStatus?: string;
  orderId?: string | null;
};

const insertedReceiptIds: string[] = [];
const insertedRecordIds: string[] = [];
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
    throw new Error(`数据库不可用，无法执行 return-receipts API 集成测试: ${message}`);
  }
}

async function queryOne<T extends JsonObject>(pool: Pool, sql: string, params: unknown[]) {
  const result = await pool.query<T>(sql, params);
  return result.rows[0] ?? null;
}

async function insertRecord(pool: Pool, options: SeedRecordOptions = {}) {
  const id = randomUUID();
  const supplierId = options.supplierId ?? randomUUID();
  const supplierName = options.supplierName ?? `供应商-${RUN_ID}`;

  await pool.query(
    `
      INSERT INTO return_receipt_records (
        id,
        supplier_id,
        supplier_name,
        file_url,
        file_name,
        total_count,
        matched_count,
        unmatched_count,
        imported_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      id,
      supplierId,
      supplierName,
      `/fixtures/${RUN_ID}/${id}.xlsx`,
      options.fileName ?? `${RUN_ID}-${id}.xlsx`,
      options.totalCount ?? 0,
      options.matchedCount ?? 0,
      options.unmatchedCount ?? 0,
      'api-test',
    ]
  );

  insertedRecordIds.push(id);

  return { id, supplierId, supplierName };
}

async function insertOrder(pool: Pool, options: SeedOrderOptions = {}) {
  const id = randomUUID();
  const supplierId = options.supplierId ?? randomUUID();
  const supplierName = options.supplierName ?? `供应商-${RUN_ID}`;
  const orderNo = options.orderNo ?? `ORDER-${RUN_ID}-${id.slice(0, 8)}`;

  await pool.query(
    `
      INSERT INTO orders (
        id,
        order_no,
        supplier_order_no,
        status,
        items,
        receiver_name,
        receiver_phone,
        receiver_address,
        customer_code,
        customer_name,
        salesperson,
        supplier_id,
        supplier_name,
        source,
        sys_order_no,
        operator_name
      )
      VALUES (
        $1, $2, $3, $4, '[]'::jsonb, '测试收货人', '13900000000', '上海市测试路 1 号',
        'C-TEST', '测试客户', '测试业务员', $5, $6, 'api-test', $7, '测试跟单员'
      )
    `,
    [
      id,
      orderNo,
      options.supplierOrderNo ?? null,
      options.status ?? 'assigned',
      supplierId,
      supplierName,
      `SYS-${RUN_ID}-${id.slice(0, 8)}`,
    ]
  );

  insertedOrderIds.push(id);

  return { id, supplierId, supplierName, orderNo, supplierOrderNo: options.supplierOrderNo };
}

async function insertReceipt(pool: Pool, options: SeedReceiptOptions) {
  const id = randomUUID();

  await pool.query(
    `
      INSERT INTO return_receipts (
        id,
        record_id,
        order_id,
        supplier_id,
        supplier_name,
        customer_order_no,
        supplier_order_no,
        express_company,
        tracking_no,
        ship_date,
        quantity,
        price,
        remark,
        match_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, null, 'api-test', $11)
    `,
    [
      id,
      options.recordId,
      options.orderId ?? null,
      options.supplierId,
      options.supplierName,
      options.customerOrderNo,
      options.supplierOrderNo ?? null,
      options.expressCompany ?? '顺丰',
      options.trackingNo ?? `TRACK-${id.slice(0, 8)}`,
      options.shipDate ?? '2026-04-19',
      options.matchStatus ?? 'pending',
    ]
  );

  insertedReceiptIds.push(id);
  return { id };
}

async function cleanup(pool: Pool) {
  if (insertedReceiptIds.length > 0) {
    await pool.query('DELETE FROM return_receipts WHERE id = ANY($1::uuid[])', [insertedReceiptIds]);
  }

  if (insertedRecordIds.length > 0) {
    await pool.query('DELETE FROM return_receipt_records WHERE id = ANY($1::uuid[])', [insertedRecordIds]);
  }

  if (insertedOrderIds.length > 0) {
    await pool.query('DELETE FROM orders WHERE id = ANY($1::varchar[])', [insertedOrderIds]);
  }
}

function ensureObject(value: unknown, label: string): JsonObject {
  assert(Boolean(value) && typeof value === 'object' && !Array.isArray(value), `${label} 不是对象`);
  return value as JsonObject;
}

function ensureArray(value: unknown, label: string): JsonObject[] {
  assert(Array.isArray(value), `${label} 不是数组`);
  return value as JsonObject[];
}

const tests: TestCase[] = [
  {
    name: 'history?recordId returns frontend detail contract',
    async run({ pool }) {
      const record = await insertRecord(pool, { totalCount: 1, matchedCount: 0, unmatchedCount: 1 });
      await insertReceipt(pool, {
        recordId: record.id,
        supplierId: record.supplierId,
        supplierName: record.supplierName,
        customerOrderNo: `ORDER-${RUN_ID}-HISTORY`,
        matchStatus: 'pending',
      });

      const response = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
        `${BASE_URL}/api/return-receipts/history?recordId=${record.id}`,
        { headers: buildAuthedHeaders(ADMIN_USER) }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'history.data');
      assert(data.id === record.id, 'recordId 不匹配');
      assert(typeof data.supplierId === 'string', '缺少 supplierId');
      assert(typeof data.fileName === 'string', '缺少 fileName');
      assert(typeof data.matchedCount === 'number', '缺少 matchedCount');
      assert(typeof data.unmatchedCount === 'number', '缺少 unmatchedCount');
      assert(typeof data.importedAt === 'string', '缺少 importedAt');

      const receipts = ensureArray(data.receipts, 'history.data.receipts');
      assert(receipts.length === 1, `期望 1 条回单，实际 ${receipts.length}`);
      const reviewSummary = ensureObject(data.reviewSummary, 'history.data.reviewSummary');

      const firstReceipt = receipts[0];
      assert(typeof firstReceipt.supplierId === 'string', '回单缺少 supplierId');
      assert(typeof firstReceipt.customerOrderNo === 'string', '回单缺少 customerOrderNo');
      assert(typeof firstReceipt.matchStatus === 'string', '回单缺少 matchStatus');
      assert(firstReceipt.reviewStatus === 'needs_review', `期望 needs_review，实际 ${String(firstReceipt.reviewStatus)}`);
      assert(firstReceipt.matchStatus === 'pending', `期望 pending，实际 ${String(firstReceipt.matchStatus)}`);
      assert(reviewSummary.needsReviewCount === 1, `needsReviewCount 期望 1，实际 ${String(reviewSummary.needsReviewCount)}`);
    },
  },
  {
    name: '[id] PATCH supports path-param manual match and updates record counts',
    async run({ pool }) {
      const order = await insertOrder(pool, {
        orderNo: `ORDER-${RUN_ID}-MANUAL`,
      });
      const record = await insertRecord(pool, {
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        totalCount: 1,
        matchedCount: 0,
        unmatchedCount: 1,
      });
      const receipt = await insertReceipt(pool, {
        recordId: record.id,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        customerOrderNo: `UNMATCHED-${RUN_ID}`,
        matchStatus: 'pending',
      });

      const response = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
        `${BASE_URL}/api/return-receipts/${receipt.id}`,
        {
          method: 'PATCH',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({ orderId: order.id }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const receiptRow = await queryOne<{ order_id: string | null; match_status: string | null }>(
        pool,
        'SELECT order_id, match_status FROM return_receipts WHERE id = $1',
        [receipt.id]
      );
      assert(receiptRow?.order_id === order.id, '回单未关联到目标订单');
      assert(receiptRow?.match_status === 'manual_matched', `回单状态未更新为 manual_matched，实际 ${String(receiptRow?.match_status)}`);

      const recordRow = await queryOne<{ matched_count: number; unmatched_count: number }>(
        pool,
        'SELECT matched_count, unmatched_count FROM return_receipt_records WHERE id = $1',
        [record.id]
      );
      assert(recordRow?.matched_count === 1, `matched_count 期望 1，实际 ${String(recordRow?.matched_count)}`);
      assert(recordRow?.unmatched_count === 0, `unmatched_count 期望 0，实际 ${String(recordRow?.unmatched_count)}`);
    },
  },
  {
    name: '[id] PATCH resolves conflict receipts and updates order logistics',
    async run({ pool }) {
      const supplierId = randomUUID();
      const supplierName = `供应商-${RUN_ID}-RESOLVE`;
      const record = await insertRecord(pool, {
        supplierId,
        supplierName,
        totalCount: 1,
        matchedCount: 0,
        unmatchedCount: 1,
      });

      const targetOrder = await insertOrder(pool, {
        supplierId,
        supplierName,
        orderNo: `ORDER-${RUN_ID}-RESOLVE`,
        status: 'assigned',
      });

      const receipt = await insertReceipt(pool, {
        recordId: record.id,
        supplierId,
        supplierName,
        customerOrderNo: `ORDER-${RUN_ID}-CONFLICT`,
        trackingNo: `RESOLVE-${randomUUID().slice(0, 8)}`,
        expressCompany: '顺丰',
        matchStatus: 'conflict',
      });

      const response = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
        `${BASE_URL}/api/return-receipts/${receipt.id}`,
        {
          method: 'PATCH',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({ orderId: targetOrder.id }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'resolve-conflict.data');
      assert(data.resolvedConflict === true, `resolvedConflict 期望 true，实际 ${String(data.resolvedConflict)}`);
      assert(data.orderNo === targetOrder.orderNo, `orderNo 期望 ${targetOrder.orderNo}，实际 ${String(data.orderNo)}`);

      const receiptRow = await queryOne<{ order_id: string | null; match_status: string | null }>(
        pool,
        'SELECT order_id, match_status FROM return_receipts WHERE id = $1',
        [receipt.id]
      );
      const recordRow = await queryOne<{ matched_count: number; unmatched_count: number }>(
        pool,
        'SELECT matched_count, unmatched_count FROM return_receipt_records WHERE id = $1',
        [record.id]
      );
      const orderRow = await queryOne<{ status: string | null; tracking_no: string | null; express_company: string | null }>(
        pool,
        'SELECT status, tracking_no, express_company FROM orders WHERE id = $1',
        [targetOrder.id]
      );

      assert(receiptRow?.order_id === targetOrder.id, '冲突处理后回单未关联目标订单');
      assert(receiptRow?.match_status === 'manual_matched', `冲突处理后状态应为 manual_matched，实际 ${String(receiptRow?.match_status)}`);
      assert(recordRow?.matched_count === 1, `冲突处理后 matched_count 期望 1，实际 ${String(recordRow?.matched_count)}`);
      assert(recordRow?.unmatched_count === 0, `冲突处理后 unmatched_count 期望 0，实际 ${String(recordRow?.unmatched_count)}`);
      assert(orderRow?.status === 'returned', `冲突处理后订单状态应为 returned，实际 ${String(orderRow?.status)}`);
      assert(orderRow?.tracking_no?.startsWith('RESOLVE-') === true, '冲突处理后 tracking_no 未回写');
      assert(orderRow?.express_company === '顺丰', `冲突处理后 express_company 期望 顺丰，实际 ${String(orderRow?.express_company)}`);
    },
  },
  {
    name: 'match updates receipt status and record counters consistently',
    async run({ pool }) {
      const matchedOrder = await insertOrder(pool, {
        orderNo: `ORDER-${RUN_ID}-AUTO`,
        supplierOrderNo: `SUP-${RUN_ID}-AUTO`,
      });
      const record = await insertRecord(pool, {
        supplierId: matchedOrder.supplierId,
        supplierName: matchedOrder.supplierName,
        totalCount: 2,
        matchedCount: 0,
        unmatchedCount: 2,
      });
      const matchedReceipt = await insertReceipt(pool, {
        recordId: record.id,
        supplierId: matchedOrder.supplierId,
        supplierName: matchedOrder.supplierName,
        customerOrderNo: matchedOrder.orderNo,
        supplierOrderNo: matchedOrder.supplierOrderNo ?? undefined,
        trackingNo: `AUTO-TRACK-${randomUUID().slice(0, 8)}`,
        matchStatus: 'pending',
      });
      const unmatchedReceipt = await insertReceipt(pool, {
        recordId: record.id,
        supplierId: matchedOrder.supplierId,
        supplierName: matchedOrder.supplierName,
        customerOrderNo: `ORDER-${RUN_ID}-MISS`,
        supplierOrderNo: `SUP-${RUN_ID}-MISS`,
        trackingNo: `MISS-TRACK-${randomUUID().slice(0, 8)}`,
        matchStatus: 'pending',
      });

      const response = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
        `${BASE_URL}/api/return-receipts/match`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({ receiptIds: [matchedReceipt.id, unmatchedReceipt.id] }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'match.data');
      assert(data.totalCount === 2, `totalCount 期望 2，实际 ${String(data.totalCount)}`);
      assert(data.autoMatchedCount === 1, `autoMatchedCount 期望 1，实际 ${String(data.autoMatchedCount)}`);
      assert(data.unmatchedCount === 1, `unmatchedCount 期望 1，实际 ${String(data.unmatchedCount)}`);

      const matchedRow = await queryOne<{ order_id: string | null; match_status: string | null }>(
        pool,
        'SELECT order_id, match_status FROM return_receipts WHERE id = $1',
        [matchedReceipt.id]
      );
      const matchedOrderRow = await queryOne<{ status: string | null; returned_at: string | null }>(
        pool,
        'SELECT status, returned_at FROM orders WHERE id = $1',
        [matchedOrder.id]
      );
      const unmatchedRow = await queryOne<{ order_id: string | null; match_status: string | null }>(
        pool,
        'SELECT order_id, match_status FROM return_receipts WHERE id = $1',
        [unmatchedReceipt.id]
      );
      const recordRow = await queryOne<{ matched_count: number; unmatched_count: number }>(
        pool,
        'SELECT matched_count, unmatched_count FROM return_receipt_records WHERE id = $1',
        [record.id]
      );

      assert(matchedRow?.order_id === matchedOrder.id, '自动匹配的回单未写入 order_id');
      assert(matchedRow?.match_status === 'auto_matched', `自动匹配回单状态异常: ${String(matchedRow?.match_status)}`);
      assert(matchedOrderRow?.status === 'returned', `自动匹配后订单状态应为 returned，实际 ${String(matchedOrderRow?.status)}`);
      assert(Boolean(matchedOrderRow?.returned_at), '自动匹配后订单 returned_at 未回写');
      assert(unmatchedRow?.order_id === null, '未匹配回单不应关联订单');
      assert(unmatchedRow?.match_status === 'pending', `未匹配回单状态应保持 pending，实际 ${String(unmatchedRow?.match_status)}`);
      assert(recordRow?.matched_count === 1, `match 后 matched_count 期望 1，实际 ${String(recordRow?.matched_count)}`);
      assert(recordRow?.unmatched_count === 1, `match 后 unmatched_count 期望 1，实际 ${String(recordRow?.unmatched_count)}`);
    },
  },
  {
    name: 'match marks receipt as conflict when multiple orders match',
    async run({ pool }) {
      const supplierId = randomUUID();
      const supplierName = `供应商-${RUN_ID}-CONFLICT`;
      const record = await insertRecord(pool, {
        supplierId,
        supplierName,
        totalCount: 1,
        matchedCount: 0,
        unmatchedCount: 1,
      });

      await insertOrder(pool, {
        supplierId,
        supplierName,
        orderNo: `ORDER-${RUN_ID}-CONFLICT-A`,
        supplierOrderNo: `SUP-${RUN_ID}-CONFLICT`,
      });
      await insertOrder(pool, {
        supplierId,
        supplierName,
        orderNo: `ORDER-${RUN_ID}-CONFLICT-B`,
        supplierOrderNo: `SUP-${RUN_ID}-CONFLICT`,
      });

      const receipt = await insertReceipt(pool, {
        recordId: record.id,
        supplierId,
        supplierName,
        customerOrderNo: `ORDER-${RUN_ID}-CONFLICT`,
        supplierOrderNo: `SUP-${RUN_ID}-CONFLICT`,
        trackingNo: `CONFLICT-${randomUUID().slice(0, 8)}`,
        matchStatus: 'pending',
      });

      const response = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
        `${BASE_URL}/api/return-receipts/match`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({ receiptIds: [receipt.id] }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'match.conflict.data');
      assert(data.totalCount === 1, `totalCount 期望 1，实际 ${String(data.totalCount)}`);
      assert(data.autoMatchedCount === 0, `autoMatchedCount 期望 0，实际 ${String(data.autoMatchedCount)}`);
      assert(data.unmatchedCount === 1, `unmatchedCount 期望 1，实际 ${String(data.unmatchedCount)}`);

      const results = ensureArray(data.results, 'match.conflict.data.results');
      assert(results.length === 1, `results 期望 1，实际 ${results.length}`);
      assert(results[0]?.conflict === true, `冲突结果应标记 conflict=true，实际 ${JSON.stringify(results[0])}`);
      assert(Array.isArray(results[0]?.candidateOrderIds) && results[0].candidateOrderIds.length === 2, '冲突结果应返回两个候选订单 ID');

      const receiptRow = await queryOne<{ order_id: string | null; match_status: string | null }>(
        pool,
        'SELECT order_id, match_status FROM return_receipts WHERE id = $1',
        [receipt.id]
      );
      const recordRow = await queryOne<{ matched_count: number; unmatched_count: number }>(
        pool,
        'SELECT matched_count, unmatched_count FROM return_receipt_records WHERE id = $1',
        [record.id]
      );

      assert(receiptRow?.order_id === null, '冲突回单不应关联订单');
      assert(receiptRow?.match_status === 'conflict', `冲突回单状态应为 conflict，实际 ${String(receiptRow?.match_status)}`);
      assert(recordRow?.matched_count === 0, `冲突后 matched_count 期望 0，实际 ${String(recordRow?.matched_count)}`);
      assert(recordRow?.unmatched_count === 1, `冲突后 unmatched_count 期望 1，实际 ${String(recordRow?.unmatched_count)}`);
    },
  },
  {
    name: 'confirm returns matchedCount and updates order logistics',
    async run({ pool }) {
      const order = await insertOrder(pool, {
        orderNo: `ORDER-${RUN_ID}-CONFIRM`,
        status: 'assigned',
      });
      const record = await insertRecord(pool, {
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        totalCount: 1,
        matchedCount: 1,
        unmatchedCount: 0,
      });
      const receipt = await insertReceipt(pool, {
        recordId: record.id,
        supplierId: order.supplierId,
        supplierName: order.supplierName,
        customerOrderNo: order.orderNo,
        trackingNo: `CONFIRM-${randomUUID().slice(0, 8)}`,
        matchStatus: 'auto_matched',
        orderId: order.id,
      });

      const response = await fetchJson<{ success?: boolean; data?: unknown; error?: string }>(
        `${BASE_URL}/api/return-receipts/confirm`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({ receiptIds: [receipt.id], importedBy: 'api-test' }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'confirm.data');
      assert(data.matchedCount === 1, `matchedCount 期望 1，实际 ${String(data.matchedCount)}`);

      const orderRow = await queryOne<{ status: string | null; tracking_no: string | null; express_company: string | null; returned_at: string | null }>(
        pool,
        'SELECT status, tracking_no, express_company, returned_at FROM orders WHERE id = $1',
        [order.id]
      );
      const receiptRow = await queryOne<{ matched_at: string | Date | null }>(
        pool,
        'SELECT matched_at FROM return_receipts WHERE id = $1',
        [receipt.id]
      );

      assert(orderRow?.status === 'returned', `订单状态应更新为 returned，实际 ${String(orderRow?.status)}`);
      assert(typeof orderRow?.tracking_no === 'string' && orderRow.tracking_no.length > 0, '订单 tracking_no 未回写');
      assert(typeof orderRow?.express_company === 'string' && orderRow.express_company.length > 0, '订单 express_company 未回写');
      assert(Boolean(orderRow?.returned_at), '订单 returned_at 未回写');
      assert(Boolean(receiptRow?.matched_at), '回单 matched_at 未更新');
    },
  },
];

async function main() {
  const pool = getPool();
  let server: ReturnType<typeof startServer> | null = null;
  const failures: Array<{ name: string; error: string }> = [];

  try {
    await assertDatabaseReady(pool);
    server = startServer(PORT);
    await waitForServer(BASE_URL, server);
    console.log(`PASS server startup - ${BASE_URL}`);

    for (const test of tests) {
      try {
        console.log(`RUN ${test.name}`);
        await test.run({ pool });
        console.log(`PASS ${test.name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ name: test.name, error: message });
        console.error(`FAIL ${test.name}`);
        console.error(`  ${message}`);
      }
    }
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

  if (failures.length > 0) {
    console.error(`\n${failures.length}/${tests.length} return-receipts API contract checks failed.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${tests.length} return-receipts API contract checks passed.`);
}

void main();
