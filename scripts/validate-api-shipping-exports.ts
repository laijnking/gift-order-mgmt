import { randomUUID } from 'crypto';
import { access, rm } from 'fs/promises';
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
import { buildExportRecordDownloadPath } from '@/lib/export-download';
import { loadEnv } from '@/storage/database/supabase-client';

const PORT = 5138;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const RUN_ID = `api-shipping-exports-${Date.now()}`;
const SHORT_ID = RUN_ID.slice(-8);
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';
const artifactDir = path.join(process.cwd(), 'data', 'test-artifacts', RUN_ID);

type JsonObject = Record<string, unknown>;

type TestContext = {
  pool: Pool;
};

type TestCase = {
  name: string;
  run: (ctx: TestContext) => Promise<void>;
};

type ExportDetail = {
  supplierId?: string;
  supplierName?: string;
  orderCount?: number;
  templateId?: string | null;
  templateName?: string | null;
  templateSource?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  artifact?: {
    relative_path?: string;
    file_name?: string;
    provider?: 'local' | 's3';
  } | null;
  status?: string;
};

type ExportRecordRow = {
  id: string;
  export_type: string;
  business_type: string | null;
  supplier_id: string | null;
  template_id: string | null;
  template_name: string | null;
  file_url: string | null;
  file_name: string | null;
  zip_file_url: string | null;
  zip_file_name: string | null;
  total_count: number;
  exported_by: string | null;
  metadata: {
    batch_id?: string;
    batch_no?: string;
    supplier_ids?: string[];
    download_mode?: string;
    template_source?: string;
    artifact?: {
      relative_path?: string;
      file_name?: string;
      provider?: 'local' | 's3';
    } | null;
    details?: ExportDetail[];
    errors?: string[];
  } | null;
};

type BatchResponseData = {
  batchId?: string;
  recordId?: string;
  batchNo?: string;
  zipFileName?: string;
  zipFileUrl?: string | null;
  zipBase64?: string;
  artifact?: {
    relative_path?: string;
    file_name?: string;
    provider?: 'local' | 's3';
  } | null;
  totalSupplierCount?: number;
  totalOrderCount?: number;
  templateId?: string | null;
  templateName?: string | null;
  templateSource?: string | null;
  dispatchMode?: 'preview' | 'dispatch';
  executionMode?: 'preview' | 'dispatch_only' | 'dispatch_with_persistence';
  dispatchSummary?: {
    mode?: 'preview' | 'dispatch';
    newDispatchCount?: number;
    reusedDispatchCount?: number;
    assignedOnlyCount?: number;
  };
  persistenceSummary?: {
    exportRecordCreated?: boolean;
    zipArtifactPersisted?: boolean;
    detailArtifactPersistedCount?: number;
  };
  supplierIds?: string[];
  details?: ExportDetail[];
  errors?: string[];
};

const ids = {
  supplierId: randomUUID(),
  productId: randomUUID(),
  pendingOrderId: randomUUID(),
  assignedOrderId: randomUUID(),
  stockId: randomUUID(),
  explicitTemplateId: randomUUID(),
};

const insertedTemplateIds: string[] = [];
const insertedExportRecordIds: string[] = [];
const insertedDispatchBatchNos = new Set<string>();
const insertedOrderIds = [ids.pendingOrderId, ids.assignedOrderId];
const insertedStockIds = [ids.stockId];
const insertedProductIds = [ids.productId];
const insertedSupplierIds = [ids.supplierId];

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
  process.env.EXPORT_ARTIFACT_PROVIDER = 'local';
  process.env.EXPORT_ARTIFACT_DIR = artifactDir;

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
    throw new Error(`数据库不可用，无法执行 shipping-exports API 集成测试: ${message}`);
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

function ensureObject(value: unknown, label: string): JsonObject {
  assert(Boolean(value) && typeof value === 'object' && !Array.isArray(value), `${label} 不是对象`);
  return value as JsonObject;
}

function ensureArray(value: unknown, label: string) {
  assert(Array.isArray(value), `${label} 不是数组`);
  return value as JsonObject[];
}

async function assertFileExists(relativePath?: string | null) {
  assert(typeof relativePath === 'string' && relativePath.length > 0, '缺少 artifact.relative_path');
  await access(path.resolve(process.cwd(), relativePath));
}

async function seedBaseData(pool: Pool) {
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
    [ids.supplierId, `发货供应商-${RUN_ID}`, `发货商-${RUN_ID}`]
  );

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
      values ($1, $2, $3, $4, true, now(), now())
    `,
    [ids.productId, `SKU-${RUN_ID}`, `礼品测试商品-${RUN_ID}`, '默认规格']
  );

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
      values ($1, $2, $3, $4, $5, $6, 10, 0, 88, 'active', now(), now())
    `,
    [ids.stockId, ids.productId, `SKU-${RUN_ID}`, `礼品测试商品-${RUN_ID}`, ids.supplierId, `发货供应商-${RUN_ID}`]
  );

  const items = JSON.stringify([
    {
      product_code: `SKU-${RUN_ID}`,
      product_name: `礼品测试商品-${RUN_ID}`,
      quantity: 2,
      price: 88,
    },
  ]);

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
        operator_name,
        supplier_id,
        supplier_name,
        source,
        sys_order_no,
        assigned_batch,
        created_at,
        updated_at
      )
      values
      (
        $1,
        $2,
        'pending',
        $3::jsonb,
        '待派发收货人',
        '13800000001',
        '上海市浦东新区测试路 1 号',
        'CUST-TEST',
        '测试客户',
        '业务员A',
        '跟单员A',
        $4,
        $5,
        'api-test',
        $6,
        null,
        now(),
        now()
      ),
      (
        $7,
        $8,
        'assigned',
        $9::jsonb,
        '已派发收货人',
        '13800000002',
        '上海市浦东新区测试路 2 号',
        'CUST-TEST',
        '测试客户',
        '业务员A',
        '跟单员A',
        $4,
        $5,
        'api-test',
        $10,
        $11,
        now(),
        now()
      )
    `,
    [
      ids.pendingOrderId,
      `SHIP-P-${SHORT_ID}`,
      items,
      ids.supplierId,
      `发货供应商-${RUN_ID}`,
      `SYS-SP-${SHORT_ID}`,
      ids.assignedOrderId,
      `SHIP-A-${SHORT_ID}`,
      JSON.stringify([
        {
          product_code: `SKU-${RUN_ID}`,
          product_name: `礼品测试商品-${RUN_ID}`,
          quantity: 1,
          price: 88,
        },
      ]),
      `SYS-SA-${SHORT_ID}`,
      `OLD-${SHORT_ID}`,
    ]
  );

  await pool.query(
    `
      insert into templates (
        id,
        name,
        type,
        config,
        is_default,
        is_active,
        created_at,
        updated_at
      )
      values (
        $1,
        $2,
        'shipping',
        $3::jsonb,
        false,
        true,
        now(),
        now()
      )
    `,
    [
      ids.explicitTemplateId,
      `发货通知显式模板-${RUN_ID}`,
      JSON.stringify({
        fieldMappings: {
          客户订单号: 'orderNo',
          收货人: 'receiverName',
          商品名称: 'productName',
          数量: 'quantity',
        },
      }),
    ]
  );
  insertedTemplateIds.push(ids.explicitTemplateId);
}

async function cleanup(pool: Pool) {
  if (insertedDispatchBatchNos.size > 0) {
    await pool.query('delete from dispatch_records where batch_no = any($1::varchar[])', [[...insertedDispatchBatchNos]]);
    await pool.query('delete from order_cost_history where dispatch_batch = any($1::varchar[])', [[...insertedDispatchBatchNos]]);
    await pool.query('delete from stock_versions where change_reason = any($1::text[])', [
      [...insertedDispatchBatchNos].map((batchNo) => `发货通知派发 SHIP-PENDING-${RUN_ID}`).concat(`发货通知派发 SHIP-ASSIGNED-${RUN_ID}`),
    ]).catch(() => {});
  }

  await pool.query('delete from stock_versions where reference_id = any($1::varchar[])', [insertedOrderIds]).catch(() => {});
  await pool.query('delete from order_cost_history where order_id = any($1::uuid[])', [insertedOrderIds]).catch(() => {});
  await pool.query('delete from export_records where exported_by = $1', [RUN_ID]).catch(() => {});
  if (insertedTemplateIds.length > 0) {
    await pool.query('delete from templates where id = any($1::uuid[])', [insertedTemplateIds]).catch(() => {});
  }
  await pool.query('delete from orders where id = any($1::varchar[])', [insertedOrderIds]).catch(() => {});
  await pool.query('delete from stocks where id = any($1::uuid[])', [insertedStockIds]).catch(() => {});
  await pool.query('delete from products where id = any($1::uuid[])', [insertedProductIds]).catch(() => {});
  await pool.query('delete from suppliers where id = any($1::uuid[])', [insertedSupplierIds]).catch(() => {});
  await rm(artifactDir, { recursive: true, force: true });
}

async function getExportRecord(pool: Pool, id: string) {
  const record = await queryOne<ExportRecordRow>(
    pool,
    `
      select
        id,
        export_type,
        business_type,
        supplier_id,
        template_id,
        template_name,
        file_url,
        file_name,
        zip_file_url,
        zip_file_name,
        total_count,
        exported_by,
        metadata
      from export_records
      where id = $1
    `,
    [id]
  );

  assert(record, `导出记录 ${id} 不存在`);
  return record;
}

const tests: TestCase[] = [
  {
    name: 'supplierIds validation rejects empty selection',
    async run() {
      const response = await fetchJson<{ success?: boolean; error?: string }>(
        `${BASE_URL}/api/shipping-exports/batch`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({
            supplierIds: [],
            exportedBy: RUN_ID,
          }),
        }
      );

      assert(response.status === 400, `期望 400，实际 ${response.status}`);
      assert(response.data.success === false, '空 supplierIds 应返回 success=false');
      assert(response.data.error === '请选择至少一个供应商', `错误文案异常: ${String(response.data.error)}`);
    },
  },
  {
    name: 'preview mode generates content without dispatch side effects',
    async run({ pool }) {
      const beforeStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const beforeDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );
      const beforeExportRecordCount = await queryCount(
        pool,
        'select count(*) as total from export_records where exported_by = $1',
        [RUN_ID]
      );

      const response = await fetchJson<{ success?: boolean; data?: BatchResponseData; error?: string }>(
        `${BASE_URL}/api/shipping-exports/batch`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({
            supplierIds: [ids.supplierId],
            dispatchMode: 'preview',
            exportedBy: RUN_ID,
          }),
        }
      );

      assert(response.status === 200, `预览期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `预览失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'preview.data') as BatchResponseData;
      assert(data.dispatchMode === 'preview', `dispatchMode 应为 preview，实际 ${String(data.dispatchMode)}`);
      assert(data.executionMode === 'preview', `executionMode 应为 preview，实际 ${String(data.executionMode)}`);
      assert(data.dispatchSummary?.mode === 'preview', `dispatchSummary.mode 应为 preview，实际 ${String(data.dispatchSummary?.mode)}`);
      assert(data.dispatchSummary?.newDispatchCount === 0, `preview newDispatchCount 应为 0，实际 ${String(data.dispatchSummary?.newDispatchCount)}`);
      assert(data.dispatchSummary?.reusedDispatchCount === 0, `preview reusedDispatchCount 应为 0，实际 ${String(data.dispatchSummary?.reusedDispatchCount)}`);
      assert(data.dispatchSummary?.assignedOnlyCount === 2, `preview assignedOnlyCount 应为 2，实际 ${String(data.dispatchSummary?.assignedOnlyCount)}`);
      assert(data.persistenceSummary?.exportRecordCreated === false, `preview exportRecordCreated 应为 false，实际 ${String(data.persistenceSummary?.exportRecordCreated)}`);
      assert(data.persistenceSummary?.zipArtifactPersisted === false, `preview zipArtifactPersisted 应为 false，实际 ${String(data.persistenceSummary?.zipArtifactPersisted)}`);
      assert(data.persistenceSummary?.detailArtifactPersistedCount === 0, `preview detailArtifactPersistedCount 应为 0，实际 ${String(data.persistenceSummary?.detailArtifactPersistedCount)}`);
      assert(typeof data.batchNo === 'string' && data.batchNo.startsWith('SHIP-'), '预览应返回 batchNo');
      assert(typeof data.zipBase64 === 'string' && data.zipBase64.length > 100, '预览应返回 zipBase64');
      assert(data.recordId == null, `预览不应创建 recordId，实际 ${String(data.recordId)}`);
      assert(data.zipFileUrl == null, `预览不应返回 zipFileUrl，实际 ${String(data.zipFileUrl)}`);

      const details = ensureArray(data.details, 'preview.details') as ExportDetail[];
      assert(details.length === 1, `预览应返回 1 条 detail，实际 ${details.length}`);
      assert(details[0].fileUrl == null, `预览 detail 不应返回 fileUrl，实际 ${String(details[0].fileUrl)}`);
      assert(!details[0].artifact, '预览 detail 不应带 artifact');

      const afterStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const afterDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );
      const afterExportRecordCount = await queryCount(
        pool,
        'select count(*) as total from export_records where exported_by = $1',
        [RUN_ID]
      );

      assert(afterStock?.quantity === beforeStock?.quantity, '预览不应扣减库存');
      assert(afterDispatchCount === beforeDispatchCount, '预览不应新增 dispatch_records');
      assert(afterVersionCount === beforeVersionCount, '预览不应新增 stock_versions');
      assert(afterCostCount === beforeCostCount, '预览不应新增 order_cost_history');
      assert(afterExportRecordCount === beforeExportRecordCount, '预览不应新增 export_records');
    },
  },
  {
    name: 'explicit template export writes artifacts and dispatch side effects',
    async run({ pool }) {
      const beforeStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const beforeDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );

      const response = await fetchJson<{ success?: boolean; data?: BatchResponseData; error?: string }>(
        `${BASE_URL}/api/shipping-exports/batch`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({
            supplierIds: [ids.supplierId],
            templateId: ids.explicitTemplateId,
            exportedBy: RUN_ID,
          }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `请求失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'shipping-exports.data') as BatchResponseData;
      assert(typeof data.recordId === 'string', '缺少 recordId');
      assert(typeof data.batchNo === 'string' && data.batchNo.startsWith('SHIP-'), '缺少有效 batchNo');
      assert(data.templateId === ids.explicitTemplateId, 'templateId 应回传显式模板');
      assert(data.templateName === `发货通知显式模板-${RUN_ID}`, 'templateName 未回传显式模板名称');
      assert(data.templateSource === 'explicit', `templateSource 应为 explicit，实际 ${String(data.templateSource)}`);
      assert(data.executionMode === 'dispatch_with_persistence', `executionMode 应为 dispatch_with_persistence，实际 ${String(data.executionMode)}`);
      assert(data.dispatchSummary?.mode === 'dispatch', `dispatchSummary.mode 应为 dispatch，实际 ${String(data.dispatchSummary?.mode)}`);
      assert(data.dispatchSummary?.newDispatchCount === 1, `explicit newDispatchCount 应为 1，实际 ${String(data.dispatchSummary?.newDispatchCount)}`);
      assert(data.dispatchSummary?.reusedDispatchCount === 0, `explicit reusedDispatchCount 应为 0，实际 ${String(data.dispatchSummary?.reusedDispatchCount)}`);
      assert(data.dispatchSummary?.assignedOnlyCount === 1, `explicit assignedOnlyCount 应为 1，实际 ${String(data.dispatchSummary?.assignedOnlyCount)}`);
      assert(data.persistenceSummary?.exportRecordCreated === true, `explicit exportRecordCreated 应为 true，实际 ${String(data.persistenceSummary?.exportRecordCreated)}`);
      assert(data.persistenceSummary?.zipArtifactPersisted === true, `explicit zipArtifactPersisted 应为 true，实际 ${String(data.persistenceSummary?.zipArtifactPersisted)}`);
      assert(data.persistenceSummary?.detailArtifactPersistedCount === 1, `explicit detailArtifactPersistedCount 应为 1，实际 ${String(data.persistenceSummary?.detailArtifactPersistedCount)}`);
      assert(data.zipFileUrl === buildExportRecordDownloadPath(data.recordId as string), 'zipFileUrl 应指向导出记录下载路由');
      assert(data.totalSupplierCount === 1, `期望 1 个供应商，实际 ${String(data.totalSupplierCount)}`);
      assert(data.totalOrderCount === 2, `期望 2 个订单，实际 ${String(data.totalOrderCount)}`);

      const details = ensureArray(data.details, 'shipping-exports.details') as ExportDetail[];
      assert(details.length === 1, `期望 1 条明细，实际 ${details.length}`);
      const detail = details[0];
      assert(detail.supplierId === ids.supplierId, '明细 supplierId 不匹配');
      assert(detail.templateId === ids.explicitTemplateId, '明细 templateId 不匹配');
      assert(detail.templateSource === 'explicit', `明细 templateSource 应为 explicit，实际 ${String(detail.templateSource)}`);
      assert(detail.fileUrl === buildExportRecordDownloadPath(data.recordId as string, 0), '明细 fileUrl 应指向 detailIndex=0');
      assert(detail.status === 'success', `明细状态应为 success，实际 ${String(detail.status)}`);

      insertedExportRecordIds.push(data.recordId as string);
      insertedDispatchBatchNos.add(data.batchNo as string);

      await assertFileExists(data.artifact?.relative_path);
      await assertFileExists(detail.artifact?.relative_path);

      const record = await getExportRecord(pool, data.recordId as string);
      assert(record.export_type === 'shipping_notice', `export_type 应为 shipping_notice，实际 ${record.export_type}`);
      assert(record.business_type === 'dispatch', `business_type 应为 dispatch，实际 ${String(record.business_type)}`);
      assert(record.supplier_id === ids.supplierId, '导出记录 supplier_id 不匹配');
      assert(record.template_id === ids.explicitTemplateId, '导出记录 template_id 未回写');
      assert(record.template_name === `发货通知显式模板-${RUN_ID}`, '导出记录 template_name 未回写');
      assert(record.file_url === buildExportRecordDownloadPath(data.recordId as string), 'file_url 应为持久化下载路由');
      assert(record.zip_file_url === buildExportRecordDownloadPath(data.recordId as string), 'zip_file_url 应为持久化下载路由');
      assert(record.total_count === 2, `导出记录 total_count 应为 2，实际 ${record.total_count}`);
      assert(record.exported_by === RUN_ID, 'exported_by 未回写');
      assert(record.metadata?.template_source === 'explicit', 'metadata.template_source 应为 explicit');
      assert(record.metadata?.download_mode === 'regenerate', 'metadata.download_mode 应写入 regenerate');
      assert(record.metadata?.details?.[0]?.fileUrl === buildExportRecordDownloadPath(data.recordId as string, 0), 'metadata.details.fileUrl 应为 detail 下载路由');

      await assertFileExists(record.metadata?.artifact?.relative_path);
      await assertFileExists(record.metadata?.details?.[0]?.artifact?.relative_path);

      const pendingOrder = await queryOne<{ status: string; assigned_batch: string | null }>(
        pool,
        'select status, assigned_batch from orders where id = $1',
        [ids.pendingOrderId]
      );
      const assignedOrder = await queryOne<{ status: string; assigned_batch: string | null }>(
        pool,
        'select status, assigned_batch from orders where id = $1',
        [ids.assignedOrderId]
      );
      const afterStock = await queryOne<{ quantity: number; last_stock_out_at: string | null }>(
        pool,
        'select quantity, last_stock_out_at from stocks where id = $1',
        [ids.stockId]
      );
      const afterDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );

      assert(pendingOrder?.status === 'assigned', `pending 订单应更新为 assigned，实际 ${String(pendingOrder?.status)}`);
      assert(pendingOrder?.assigned_batch === data.batchNo, 'pending 订单 assigned_batch 未回写新批次');
      assert(assignedOrder?.status === 'assigned', `已派发订单状态应保持 assigned，实际 ${String(assignedOrder?.status)}`);
      assert(assignedOrder?.assigned_batch === `OLD-${SHORT_ID}`, '已派发订单 assigned_batch 不应被覆盖');
      assert(beforeStock?.quantity === 10, `初始库存异常，实际 ${String(beforeStock?.quantity)}`);
      assert(afterStock?.quantity === 8, `库存应扣减 2 台，实际 ${String(afterStock?.quantity)}`);
      assert(Boolean(afterStock?.last_stock_out_at), 'stocks.last_stock_out_at 应被回写');
      assert(afterDispatchCount === beforeDispatchCount + 1, `dispatch_records 应增加 1 条，前 ${beforeDispatchCount} 后 ${afterDispatchCount}`);
      assert(afterVersionCount === beforeVersionCount + 1, `stock_versions 应增加 1 条，前 ${beforeVersionCount} 后 ${afterVersionCount}`);
      assert(afterCostCount === beforeCostCount + 1, `order_cost_history 应增加 1 条，前 ${beforeCostCount} 后 ${afterCostCount}`);
    },
  },
  {
    name: 'dispatch-only mode skips export record persistence',
    async run({ pool }) {
      const beforeExportRecordCount = await queryCount(
        pool,
        'select count(*) as total from export_records where exported_by = $1',
        [RUN_ID]
      );

      const response = await fetchJson<{ success?: boolean; data?: BatchResponseData; error?: string }>(
        `${BASE_URL}/api/shipping-exports/batch`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({
            supplierIds: [ids.supplierId],
            exportedBy: RUN_ID,
            persistenceMode: 'none',
          }),
        }
      );

      assert(response.status === 200, `dispatch-only 期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `dispatch-only 失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'dispatch-only.data') as BatchResponseData;
      assert(data.dispatchMode === 'dispatch', `dispatch-only dispatchMode 应为 dispatch，实际 ${String(data.dispatchMode)}`);
      assert(data.executionMode === 'dispatch_only', `executionMode 应为 dispatch_only，实际 ${String(data.executionMode)}`);
      assert(data.recordId == null, `dispatch-only 不应创建 recordId，实际 ${String(data.recordId)}`);
      assert(data.zipFileUrl == null, `dispatch-only 不应返回 zipFileUrl，实际 ${String(data.zipFileUrl)}`);
      assert(!data.artifact, 'dispatch-only 不应返回顶层 artifact');
      assert(data.persistenceSummary?.exportRecordCreated === false, `dispatch-only exportRecordCreated 应为 false，实际 ${String(data.persistenceSummary?.exportRecordCreated)}`);
      assert(data.persistenceSummary?.zipArtifactPersisted === false, `dispatch-only zipArtifactPersisted 应为 false，实际 ${String(data.persistenceSummary?.zipArtifactPersisted)}`);
      assert(data.persistenceSummary?.detailArtifactPersistedCount === 0, `dispatch-only detailArtifactPersistedCount 应为 0，实际 ${String(data.persistenceSummary?.detailArtifactPersistedCount)}`);

      const details = ensureArray(data.details, 'dispatch-only.details') as ExportDetail[];
      assert(details.length === 1, `dispatch-only 应返回 1 条 detail，实际 ${details.length}`);
      assert(details[0].fileUrl == null, `dispatch-only 明细不应返回 fileUrl，实际 ${String(details[0].fileUrl)}`);
      assert(!details[0].artifact, 'dispatch-only 明细不应返回 artifact');

      const afterExportRecordCount = await queryCount(
        pool,
        'select count(*) as total from export_records where exported_by = $1',
        [RUN_ID]
      );
      assert(afterExportRecordCount === beforeExportRecordCount, 'dispatch-only 不应新增 export_records');
    },
  },
  {
    name: 'fallback template source stays consistent for assigned-only re-export',
    async run({ pool }) {
      const beforeStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const beforeDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );

      const response = await fetchJson<{ success?: boolean; data?: BatchResponseData; error?: string }>(
        `${BASE_URL}/api/shipping-exports/batch`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({
            supplierIds: [ids.supplierId],
            exportedBy: RUN_ID,
          }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `fallback 导出失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'fallback.data') as BatchResponseData;
      assert(typeof data.recordId === 'string', 'fallback 导出缺少 recordId');
      assert(data.totalOrderCount === 2, `fallback totalOrderCount 应为 2，实际 ${String(data.totalOrderCount)}`);
      assert(
        data.templateSource === 'default' || data.templateSource === 'first',
        `fallback templateSource 应为 default/first，实际 ${String(data.templateSource)}`
      );
      assert(data.executionMode === 'dispatch_with_persistence', `fallback executionMode 应为 dispatch_with_persistence，实际 ${String(data.executionMode)}`);
      assert(data.dispatchSummary?.mode === 'dispatch', `fallback dispatchSummary.mode 应为 dispatch，实际 ${String(data.dispatchSummary?.mode)}`);
      assert(data.dispatchSummary?.newDispatchCount === 0, `fallback newDispatchCount 应为 0，实际 ${String(data.dispatchSummary?.newDispatchCount)}`);
      assert(data.dispatchSummary?.reusedDispatchCount === 0, `fallback reusedDispatchCount 应为 0，实际 ${String(data.dispatchSummary?.reusedDispatchCount)}`);
      assert(data.dispatchSummary?.assignedOnlyCount === 2, `fallback assignedOnlyCount 应为 2，实际 ${String(data.dispatchSummary?.assignedOnlyCount)}`);
      assert(data.persistenceSummary?.exportRecordCreated === true, `fallback exportRecordCreated 应为 true，实际 ${String(data.persistenceSummary?.exportRecordCreated)}`);
      assert(data.persistenceSummary?.zipArtifactPersisted === true, `fallback zipArtifactPersisted 应为 true，实际 ${String(data.persistenceSummary?.zipArtifactPersisted)}`);
      assert(data.persistenceSummary?.detailArtifactPersistedCount === 1, `fallback detailArtifactPersistedCount 应为 1，实际 ${String(data.persistenceSummary?.detailArtifactPersistedCount)}`);
      assert(typeof data.templateName === 'string' && data.templateName.length > 0, 'fallback 应返回 templateName');

      const details = ensureArray(data.details, 'fallback.details') as ExportDetail[];
      assert(details.length === 1, `fallback 应返回 1 条 detail，实际 ${details.length}`);
      assert(
        details[0].templateSource === data.templateSource,
        `detail.templateSource 应与顶层一致，顶层 ${String(data.templateSource)} 明细 ${String(details[0].templateSource)}`
      );

      insertedExportRecordIds.push(data.recordId as string);
      insertedDispatchBatchNos.add(data.batchNo as string);

      const record = await getExportRecord(pool, data.recordId as string);
      assert(record.metadata?.template_source === data.templateSource, 'fallback metadata.template_source 应与响应一致');
      assert(record.metadata?.details?.[0]?.templateSource === data.templateSource, 'fallback metadata.details.templateSource 应与响应一致');
      await assertFileExists(record.metadata?.artifact?.relative_path);
      await assertFileExists(record.metadata?.details?.[0]?.artifact?.relative_path);

      const afterStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const afterDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );

      assert(afterStock?.quantity === beforeStock?.quantity, 'assigned-only 导出不应再次扣减库存');
      assert(afterDispatchCount === beforeDispatchCount, 'assigned-only 导出不应新增 dispatch_records');
      assert(afterVersionCount === beforeVersionCount, 'assigned-only 导出不应新增 stock_versions');
      assert(afterCostCount === beforeCostCount, 'assigned-only 导出不应新增 order_cost_history');
    },
  },
  {
    name: 'pending order with existing dispatch side effects does not deduct inventory twice',
    async run({ pool }) {
      const existingBatchRow = await queryOne<{ assigned_batch: string | null }>(
        pool,
        'select assigned_batch from orders where id = $1',
        [ids.pendingOrderId]
      );
      const existingBatch = existingBatchRow?.assigned_batch;
      assert(Boolean(existingBatch), '前置条件失败：pending 订单应已有 assigned_batch');

      await pool.query(
        `
          update orders
          set status = 'pending', updated_at = now()
          where id = $1
        `,
        [ids.pendingOrderId]
      );

      const beforeStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const beforeDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const beforeCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );

      const response = await fetchJson<{ success?: boolean; data?: BatchResponseData; error?: string }>(
        `${BASE_URL}/api/shipping-exports/batch`,
        {
          method: 'POST',
          headers: buildAuthedHeaders(ADMIN_USER),
          body: JSON.stringify({
            supplierIds: [ids.supplierId],
            exportedBy: RUN_ID,
          }),
        }
      );

      assert(response.status === 200, `期望 200，实际 ${response.status}，错误: ${response.data.error ?? '未知错误'}`);
      assert(response.data.success === true, `重复派发兜底导出失败: ${response.data.error ?? '未知错误'}`);

      const data = ensureObject(response.data.data, 'duplicate-dispatch.data') as BatchResponseData;
      insertedExportRecordIds.push(data.recordId as string);
      insertedDispatchBatchNos.add(data.batchNo as string);
      assert(data.executionMode === 'dispatch_with_persistence', `duplicate executionMode 应为 dispatch_with_persistence，实际 ${String(data.executionMode)}`);
      assert(data.dispatchSummary?.mode === 'dispatch', `duplicate dispatchSummary.mode 应为 dispatch，实际 ${String(data.dispatchSummary?.mode)}`);
      assert(data.dispatchSummary?.newDispatchCount === 0, `duplicate newDispatchCount 应为 0，实际 ${String(data.dispatchSummary?.newDispatchCount)}`);
      assert(data.dispatchSummary?.reusedDispatchCount === 1, `duplicate reusedDispatchCount 应为 1，实际 ${String(data.dispatchSummary?.reusedDispatchCount)}`);
      assert(data.dispatchSummary?.assignedOnlyCount === 1, `duplicate assignedOnlyCount 应为 1，实际 ${String(data.dispatchSummary?.assignedOnlyCount)}`);
      assert(data.persistenceSummary?.exportRecordCreated === true, `duplicate exportRecordCreated 应为 true，实际 ${String(data.persistenceSummary?.exportRecordCreated)}`);
      assert(data.persistenceSummary?.zipArtifactPersisted === true, `duplicate zipArtifactPersisted 应为 true，实际 ${String(data.persistenceSummary?.zipArtifactPersisted)}`);
      assert(data.persistenceSummary?.detailArtifactPersistedCount === 1, `duplicate detailArtifactPersistedCount 应为 1，实际 ${String(data.persistenceSummary?.detailArtifactPersistedCount)}`);

      const detail = (ensureArray(data.details, 'duplicate-dispatch.details') as ExportDetail[])[0];
      assert(detail.orderCount === 2, `重复派发导出仍应包含 2 个订单，实际 ${String(detail.orderCount)}`);

      const pendingOrder = await queryOne<{ status: string; assigned_batch: string | null }>(
        pool,
        'select status, assigned_batch from orders where id = $1',
        [ids.pendingOrderId]
      );
      const afterStock = await queryOne<{ quantity: number }>(
        pool,
        'select quantity from stocks where id = $1',
        [ids.stockId]
      );
      const afterDispatchCount = await queryCount(
        pool,
        'select count(*) as total from dispatch_records where order_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterVersionCount = await queryCount(
        pool,
        'select count(*) as total from stock_versions where reference_id = any($1::varchar[])',
        [insertedOrderIds]
      );
      const afterCostCount = await queryCount(
        pool,
        'select count(*) as total from order_cost_history where order_id = any($1::uuid[])',
        [insertedOrderIds]
      );

      assert(pendingOrder?.status === 'assigned', `重复派发后订单应回到 assigned，实际 ${String(pendingOrder?.status)}`);
      assert(pendingOrder?.assigned_batch === existingBatch, '重复派发不应覆盖原 assigned_batch');
      assert(afterStock?.quantity === beforeStock?.quantity, '重复派发不应再次扣减库存');
      assert(afterDispatchCount === beforeDispatchCount, '重复派发不应再次写入 dispatch_records');
      assert(afterVersionCount === beforeVersionCount, '重复派发不应再次写入 stock_versions');
      assert(afterCostCount === beforeCostCount, '重复派发不应再次写入 order_cost_history');
    },
  },
];

async function main() {
  const pool = getPool();
  let server: ReturnType<typeof startServer> | null = null;
  const failures: Array<{ name: string; error: string }> = [];

  try {
    await assertDatabaseReady(pool);
    await cleanup(pool).catch(() => {});
    await seedBaseData(pool);

    server = startServer(PORT);
    await waitForServer(BASE_URL, server);

    for (const test of tests) {
      try {
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
    console.error(`\n${failures.length}/${tests.length} shipping-exports API contract checks failed.`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nAll ${tests.length} shipping-exports API contract checks passed.`);
}

void main();
