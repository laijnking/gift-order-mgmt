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

const PORT = 5128;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const RUN_ID = `order-cost-history-${Date.now()}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

const insertedSupplierIds: string[] = [];
const insertedProductIds: string[] = [];
const insertedStockIds: string[] = [];
const insertedOrderIds: string[] = [];
const insertedReceiptIds: string[] = [];
const insertedReceiptRecordIds: string[] = [];

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
    throw new Error(`数据库不可用，无法执行历史成本生命周期回归: ${message}`);
  }
}

async function queryRows<T extends Record<string, unknown>>(pool: Pool, sql: string, params: unknown[] = []) {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

async function queryOne<T extends Record<string, unknown>>(pool: Pool, sql: string, params: unknown[] = []) {
  const rows = await queryRows<T>(pool, sql, params);
  return rows[0] ?? null;
}

async function seedSupplier(pool: Pool) {
  const supplierId = randomUUID();
  await pool.query(
    `
      INSERT INTO suppliers (
        id, name, short_name, type, send_type, is_active, created_at
      ) VALUES ($1, $2, $3, 'supplier', 'manual', true, now())
    `,
    [supplierId, `成本供应商-${RUN_ID}`, `成本供应商`]
  );
  insertedSupplierIds.push(supplierId);
  return supplierId;
}

async function seedProduct(pool: Pool, sku: string, name: string) {
  const productId = randomUUID();
  await pool.query(
    `
      INSERT INTO products (
        id, sku, name, cost_price, retail_price, lifecycle_status, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, 10, 20, '在售', true, now(), now())
    `,
    [productId, sku, name]
  );
  insertedProductIds.push(productId);
  return productId;
}

async function seedStock(pool: Pool, input: {
  supplierId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}) {
  const stockId = randomUUID();
  await pool.query(
    `
      INSERT INTO stocks (
        id, product_id, product_code, product_name, supplier_id, supplier_name,
        quantity, reserved_quantity, unit_price, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, 'active', now(), now())
    `,
    [stockId, input.productId, input.productCode, input.productName, input.supplierId, `成本供应商-${RUN_ID}`, input.quantity, input.unitPrice]
  );
  insertedStockIds.push(stockId);
  return stockId;
}

async function seedOrder(pool: Pool, supplierId: string) {
  const orderId = randomUUID();
  const orderNo = `ORDER-${RUN_ID}`;
  const items = [
    { product_code: `SKU-A-${RUN_ID}`, product_name: `礼品A-${RUN_ID}`, quantity: 1, unit_price: 11.2 },
    { product_code: `SKU-B-${RUN_ID}`, product_name: `礼品B-${RUN_ID}`, quantity: 2, unit_price: 13.4 },
  ];

  await pool.query(
    `
      INSERT INTO orders (
        id, order_no, status, items, receiver_name, receiver_phone, receiver_address,
        customer_code, customer_name, salesperson, operator_name, supplier_id, supplier_name,
        source, sys_order_no, created_at, updated_at
      )
      VALUES (
        $1, $2, 'pending', $3::jsonb, '测试收货人', '13911112222', '上海市普陀区测试路 88 号',
        'COST-CUSTOMER', '成本客户', '成本业务员', '成本跟单员', $4, $5, 'api-test', $6, now(), now()
      )
    `,
    [orderId, orderNo, JSON.stringify(items), supplierId, `成本供应商-${RUN_ID}`, `SYS-${RUN_ID}`]
  );

  insertedOrderIds.push(orderId);
  return { orderId, orderNo };
}

async function seedReceiptRecord(pool: Pool, supplierId: string) {
  const recordId = randomUUID();
  await pool.query(
    `
      INSERT INTO return_receipt_records (
        id, supplier_id, supplier_name, file_url, file_name,
        total_count, matched_count, unmatched_count, imported_by, imported_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, 1, 1, 0, 'api-test', now(), now())
    `,
    [recordId, supplierId, `成本供应商-${RUN_ID}`, `/fixtures/${RUN_ID}.xlsx`, `${RUN_ID}.xlsx`]
  );
  insertedReceiptRecordIds.push(recordId);
  return recordId;
}

async function seedReceipt(pool: Pool, input: { recordId: string; supplierId: string; orderId: string; orderNo: string; trackingNo: string }) {
  const receiptId = randomUUID();
  await pool.query(
    `
      INSERT INTO return_receipts (
        id, record_id, order_id, supplier_id, supplier_name, customer_order_no,
        express_company, tracking_no, ship_date, quantity, match_status, matched_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, '顺丰', $7, CURRENT_DATE, 1, 'auto_matched', now(), now())
    `,
    [receiptId, input.recordId, input.orderId, input.supplierId, `成本供应商-${RUN_ID}`, input.orderNo, input.trackingNo]
  );
  insertedReceiptIds.push(receiptId);
  return receiptId;
}

async function cleanup(pool: Pool) {
  if (insertedReceiptIds.length > 0) {
    await pool.query('DELETE FROM return_receipts WHERE id = ANY($1::uuid[])', [insertedReceiptIds]);
  }
  if (insertedReceiptRecordIds.length > 0) {
    await pool.query('DELETE FROM return_receipt_records WHERE id = ANY($1::uuid[])', [insertedReceiptRecordIds]);
  }
  if (insertedOrderIds.length > 0) {
    await pool.query('DELETE FROM order_cost_history WHERE order_id = ANY($1::uuid[])', [insertedOrderIds]);
    await pool.query('DELETE FROM dispatch_records WHERE order_id = ANY($1::varchar[])', [insertedOrderIds]).catch(() => {});
    await pool.query('DELETE FROM stock_versions WHERE reference_id = ANY($1::varchar[])', [insertedOrderIds]).catch(() => {});
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

async function main() {
  const pool = getPool();
  let server: ReturnType<typeof startServer> | null = null;

  try {
    await assertDatabaseReady(pool);
    await cleanup(pool).catch(() => {});

    const supplierId = await seedSupplier(pool);
    const productAId = await seedProduct(pool, `SKU-A-${RUN_ID}`, `礼品A-${RUN_ID}`);
    const productBId = await seedProduct(pool, `SKU-B-${RUN_ID}`, `礼品B-${RUN_ID}`);

    const stockAId = await seedStock(pool, {
      supplierId,
      productId: productAId,
      productCode: `SKU-A-${RUN_ID}`,
      productName: `礼品A-${RUN_ID}`,
      quantity: 5,
      unitPrice: 11.2,
    });
    const stockBId = await seedStock(pool, {
      supplierId,
      productId: productBId,
      productCode: `SKU-B-${RUN_ID}`,
      productName: `礼品B-${RUN_ID}`,
      quantity: 7,
      unitPrice: 13.4,
    });
    const { orderId, orderNo } = await seedOrder(pool, supplierId);

    server = startServer(PORT);
    await waitForServer(BASE_URL, server);

    const dispatchResponse = await fetchJson<{ success?: boolean; data?: { batchNo?: string }; error?: string }>(
      `${BASE_URL}/api/shipping-exports/batch`,
      {
        method: 'POST',
        headers: buildAuthedHeaders(ADMIN_USER),
        body: JSON.stringify({
          supplierIds: [supplierId],
          exportedBy: RUN_ID,
          persistenceMode: 'none',
        }),
      }
    );

    assert(dispatchResponse.status === 200, `首次派发应成功，实际 ${dispatchResponse.status}，错误: ${dispatchResponse.data.error ?? '未知错误'}`);
    assert(dispatchResponse.data.success === true, `首次派发失败: ${dispatchResponse.data.error ?? '未知错误'}`);

    const initialCostRows = await queryRows<{
      product_code: string;
      quantity: number;
      unit_cost: string;
      total_cost: string;
      express_fee: string;
      other_fee: string;
      total_amount: string;
      dispatch_batch: string | null;
      tracking_no: string | null;
      returned_date: string | null;
    }>(
      pool,
      `
        SELECT product_code, quantity, unit_cost, total_cost, express_fee, other_fee, total_amount,
               dispatch_batch, tracking_no, returned_date
        FROM order_cost_history
        WHERE order_id = $1
        ORDER BY product_code ASC
      `,
      [orderId]
    );

    assert(initialCostRows.length === 2, `首次派发后应生成 2 条成本记录，实际 ${initialCostRows.length}`);
    assert(initialCostRows.every((row) => Number(row.express_fee) === 0), '首次派发不应写入运费');
    assert(initialCostRows.every((row) => Number(row.other_fee) === 0), '首次派发不应写入其他费用');
    assert(initialCostRows.every((row) => row.dispatch_batch), '首次派发应冻结 dispatch_batch');
    assert(initialCostRows.every((row) => row.tracking_no === null), '首次派发不应提前写入 tracking_no');
    assert(initialCostRows.every((row) => row.returned_date === null), '首次派发不应提前写入 returned_date');

    const feeResponse = await fetchJson<{ success?: boolean; data?: { totalAmount?: number }; error?: string }>(
      `${BASE_URL}/api/order-cost-history/fee`,
      {
        method: 'PATCH',
        headers: buildAuthedHeaders(ADMIN_USER),
        body: JSON.stringify({
          orderId,
          expressFee: 12.34,
          otherFee: 5.66,
          remark: '成本校准回归',
        }),
      }
    );

    assert(feeResponse.status === 200, `费用录入应成功，实际 ${feeResponse.status}，错误: ${feeResponse.data.error ?? '未知错误'}`);
    assert(feeResponse.data.success === true, `费用录入失败: ${feeResponse.data.error ?? '未知错误'}`);

    const feeRows = await queryRows<{ express_fee: string; other_fee: string; total_cost: string; total_amount: string }>(
      pool,
      `
        SELECT express_fee, other_fee, total_cost, total_amount
        FROM order_cost_history
        WHERE order_id = $1
      `,
      [orderId]
    );

    const expressFeeSum = feeRows.reduce((sum, row) => sum + Number(row.express_fee), 0);
    const otherFeeSum = feeRows.reduce((sum, row) => sum + Number(row.other_fee), 0);
    const goodsCostSum = feeRows.reduce((sum, row) => sum + Number(row.total_cost), 0);
    const totalAmountSum = feeRows.reduce((sum, row) => sum + Number(row.total_amount), 0);

    assert(Math.abs(expressFeeSum - 12.34) < 0.001, `运费应按订单分摊后求和为 12.34，实际 ${expressFeeSum}`);
    assert(Math.abs(otherFeeSum - 5.66) < 0.001, `其他费用应按订单分摊后求和为 5.66，实际 ${otherFeeSum}`);
    assert(Math.abs(totalAmountSum - (goodsCostSum + 18)) < 0.001, `总金额应等于商品成本 + 费用，实际 goods=${goodsCostSum} total=${totalAmountSum}`);

    const recordId = await seedReceiptRecord(pool, supplierId);
    const trackingNo = `TRACK-${RUN_ID}`;
    const receiptId = await seedReceipt(pool, { recordId, supplierId, orderId, orderNo, trackingNo });

    const confirmResponse = await fetchJson<{ success?: boolean; error?: string }>(
      `${BASE_URL}/api/return-receipts/confirm`,
      {
        method: 'POST',
        headers: buildAuthedHeaders(ADMIN_USER),
        body: JSON.stringify({ receiptIds: [receiptId], importedBy: 'api-test' }),
      }
    );

    assert(confirmResponse.status === 200, `回单确认应成功，实际 ${confirmResponse.status}，错误: ${confirmResponse.data.error ?? '未知错误'}`);
    assert(confirmResponse.data.success === true, `回单确认失败: ${confirmResponse.data.error ?? '未知错误'}`);

    const returnedRows = await queryRows<{ express_company: string | null; tracking_no: string | null; returned_date: string | null }>(
      pool,
      `
        SELECT express_company, tracking_no, returned_date
        FROM order_cost_history
        WHERE order_id = $1
      `,
      [orderId]
    );

    assert(returnedRows.length === 2, `回单后成本记录条数不应变化，实际 ${returnedRows.length}`);
    assert(returnedRows.every((row) => row.express_company === '顺丰'), '回单后成本记录应回写 express_company');
    assert(returnedRows.every((row) => row.tracking_no === trackingNo), '回单后成本记录应回写 tracking_no');
    assert(returnedRows.every((row) => Boolean(row.returned_date)), '回单后成本记录应回写 returned_date');

    await pool.query(`UPDATE orders SET status = 'pending', updated_at = now() WHERE id = $1`, [orderId]);

    const duplicateDispatchResponse = await fetchJson<{ success?: boolean; error?: string }>(
      `${BASE_URL}/api/shipping-exports/batch`,
      {
        method: 'POST',
        headers: buildAuthedHeaders(ADMIN_USER),
        body: JSON.stringify({
          supplierIds: [supplierId],
          exportedBy: `${RUN_ID}-duplicate`,
          persistenceMode: 'none',
        }),
      }
    );

    assert(duplicateDispatchResponse.status === 200, `重复派发兜底应成功，实际 ${duplicateDispatchResponse.status}，错误: ${duplicateDispatchResponse.data.error ?? '未知错误'}`);
    assert(duplicateDispatchResponse.data.success === true, `重复派发兜底失败: ${duplicateDispatchResponse.data.error ?? '未知错误'}`);

    const finalCount = await queryOne<{ total: string }>(
      pool,
      `SELECT COUNT(*)::text AS total FROM order_cost_history WHERE order_id = $1`,
      [orderId]
    );
    const stockA = await queryOne<{ quantity: number }>(pool, `SELECT quantity FROM stocks WHERE id = $1`, [stockAId]);
    const stockB = await queryOne<{ quantity: number }>(pool, `SELECT quantity FROM stocks WHERE id = $1`, [stockBId]);
    const finalFeeSums = await queryOne<{ express_fee: string; other_fee: string }>(
      pool,
      `
        SELECT
          COALESCE(SUM(express_fee), 0)::text AS express_fee,
          COALESCE(SUM(other_fee), 0)::text AS other_fee
        FROM order_cost_history
        WHERE order_id = $1
      `,
      [orderId]
    );

    assert(finalCount?.total === '2', `重复派发后成本记录仍应为 2 条，实际 ${String(finalCount?.total)}`);
    assert(stockA?.quantity === 4, `礼品A 库存只应扣减一次，实际 ${String(stockA?.quantity)}`);
    assert(stockB?.quantity === 5, `礼品B 库存只应扣减一次，实际 ${String(stockB?.quantity)}`);
    assert(Math.abs(Number(finalFeeSums?.express_fee || 0) - 12.34) < 0.001, '重复派发不应覆盖已录入运费');
    assert(Math.abs(Number(finalFeeSums?.other_fee || 0) - 5.66) < 0.001, '重复派发不应覆盖已录入其他费用');

    console.log('PASS order cost history lifecycle');
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
