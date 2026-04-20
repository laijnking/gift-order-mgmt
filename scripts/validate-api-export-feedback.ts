import path from 'path';
import { rm } from 'fs/promises';
import { Pool } from 'pg';
import {
  assert,
  buildAuthedHeaders,
  fetchJson,
  startServer,
  stopServer,
  waitForServer,
} from './lib/api-test-harness';

type JsonResponse<T> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

type ExportArtifact = {
  relative_path?: string;
  file_name?: string;
  provider?: 'local' | 's3';
};

type ExportFeedbackDetail = {
  customerId: string;
  customerName: string;
  orderCount: number;
  shippedOrderCount: number;
  pendingReceiptCount: number;
  templateId: string | null;
  templateName: string;
  fileName: string;
  fileUrl: string;
  artifact?: ExportArtifact;
  hasPendingReceipts: boolean;
  status: 'success';
  templateSource: 'explicit' | 'default' | 'first' | 'column_mapping';
};

type ExportFeedbackResponse = {
  batchId: string;
  recordId: string | null;
  zipFileName: string;
  zipFileUrl: string | null;
  zipBase64: string;
  artifact?: ExportArtifact;
  totalCustomerCount: number;
  totalOrderCount: number;
  shippedOrderCount: number;
  pendingReceiptCount: number;
  templateId: string | null;
  templateName: string;
  templateSource: 'explicit' | 'default' | 'first' | 'column_mapping' | 'mixed';
  details: ExportFeedbackDetail[];
  persistenceMode?: 'none' | 'full';
};

type ExportRecordRow = {
  id: string;
  file_url: string | null;
  file_name: string | null;
  zip_file_url: string | null;
  zip_file_name: string | null;
  total_count: number | null;
  metadata: {
    artifact?: ExportArtifact;
    template_source?: 'explicit' | 'default' | 'first' | 'column_mapping' | 'mixed';
    details?: ExportFeedbackDetail[];
    shipped_order_count?: number;
    pending_receipt_count?: number;
  } | null;
};

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';
const PORT = 5217;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const runId = Date.now().toString();
const marker = `validate-export-feedback-${runId}`;
const artifactDir = path.join(process.cwd(), 'data', 'test-artifacts', marker);

const ids = {
  customerWithMappingId: crypto.randomUUID(),
  customerWithDefaultTemplateId: crypto.randomUUID(),
  customerSkippedId: crypto.randomUUID(),
  defaultTemplateId: crypto.randomUUID(),
  mappedOrderId: crypto.randomUUID(),
  defaultOrderShippedId: crypto.randomUUID(),
  defaultOrderPendingId: crypto.randomUUID(),
  skippedOrderId: crypto.randomUUID(),
};

const customerCodes = {
  mapped: `CF-MAP-${runId}`,
  default: `CF-DEF-${runId}`,
  skipped: `CF-SKIP-${runId}`,
};

function logPass(step: string, detail?: string) {
  console.log(`PASS ${step}${detail ? ` - ${detail}` : ''}`);
}

function buildDownloadPath(recordId: string, detailIndex?: number) {
  if (detailIndex === undefined) {
    return `/api/export-records/${recordId}/download`;
  }
  return `/api/export-records/${recordId}/download?detailIndex=${detailIndex}`;
}

function expectRecordId(recordId: string | null, message: string) {
  assert(Boolean(recordId), message);
  return recordId as string;
}

function resolveDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_DB_URL ||
    DEFAULT_DATABASE_URL;

  process.env.DATABASE_URL = url;
  process.env.NEXT_PUBLIC_SUPABASE_DB_URL = url;
  process.env.EXPORT_ARTIFACT_PROVIDER = 'local';
  process.env.EXPORT_ARTIFACT_DIR = artifactDir;

  return url;
}

async function connectDatabase() {
  const pool = new Pool({
    connectionString: resolveDatabaseUrl(),
    max: 4,
  });

  await pool.query('select 1');
  return pool;
}

async function getExportRecord(pool: Pool, recordId: string) {
  const result = await pool.query<ExportRecordRow>(
    `
      select
        id,
        file_url,
        file_name,
        zip_file_url,
        zip_file_name,
        total_count,
        metadata
      from export_records
      where id = $1
    `,
    [recordId]
  );

  assert(result.rowCount === 1, `export_records ${recordId} should exist`);
  return result.rows[0];
}

async function seedDatabase(pool: Pool) {
  await pool.query(
    `
      insert into customers (id, code, name, status, created_at, updated_at)
      values
        ($1, $2, $3, 'active', now(), now()),
        ($4, $5, $6, 'active', now(), now()),
        ($7, $8, $9, 'active', now(), now())
    `,
    [
      ids.customerWithMappingId,
      customerCodes.mapped,
      `反馈映射客户-${runId}`,
      ids.customerWithDefaultTemplateId,
      customerCodes.default,
      `反馈默认客户-${runId}`,
      ids.customerSkippedId,
      customerCodes.skipped,
      `反馈跳过客户-${runId}`,
    ]
  );

  await pool.query(
    `
      insert into column_mappings (
        id,
        customer_code,
        mapping_config,
        version,
        is_active,
        created_by,
        remark,
        created_at,
        updated_at
      )
      values ($1, $2, $3::jsonb, 3, true, $4, $5, now(), now())
    `,
    [
      crypto.randomUUID(),
      customerCodes.mapped,
      JSON.stringify({
        外部订单号: 'order_no',
        收件人姓名: 'receiver_name',
        物流单号: 'tracking_no',
      }),
      marker,
      marker,
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
      values ($1, $2, 'customer_feedback', $3::jsonb, true, true, now(), now())
    `,
    [
      ids.defaultTemplateId,
      `反馈默认模板-${runId}`,
      JSON.stringify({
        fieldMappings: {
          默认订单号: 'order_no',
          默认收货人: 'receiver_name',
          默认快递单号: 'tracking_no',
        },
      }),
    ]
  );

  const items = JSON.stringify([
    {
      product_name: 'Validation Gift Box',
      product_code: 'GIFT-VAL-1',
      quantity: 1,
      price: 66,
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
        customer_id,
        salesperson,
        operator_name,
        tracking_no,
        express_company,
        sys_order_no,
        created_at,
        updated_at
      )
      values
        ($1, $2, 'returned', $9::jsonb, '映射客户一', '13800000001', 'Shanghai Pudong 1', $3, $4, $5, 'Sales A', 'Operator A', 'SF-CF-001', 'SF', 'SYS-CF-001', now(), now()),
        ($6, $7, 'returned', $9::jsonb, '默认客户已回单', '13800000002', 'Shanghai Pudong 2', $8, $10, $11, 'Sales B', 'Operator B', 'YT-CF-002', 'YTO', 'SYS-CF-002', now(), now()),
        ($12, $13, 'returned', $9::jsonb, '默认客户待回单', '13800000003', 'Shanghai Pudong 3', $8, $10, $11, 'Sales B', 'Operator B', '', null, 'SYS-CF-003', now(), now()),
        ($14, $15, 'returned', $9::jsonb, '跳过客户待回单', '13800000004', 'Shanghai Pudong 4', $16, $17, $18, 'Sales C', 'Operator C', '', null, 'SYS-CF-004', now(), now())
    `,
    [
      ids.mappedOrderId,
      `CF-ORDER-MAP-${runId}`,
      customerCodes.mapped,
      `反馈映射客户-${runId}`,
      ids.customerWithMappingId,
      ids.defaultOrderShippedId,
      `CF-ORDER-DEF-S-${runId}`,
      customerCodes.default,
      items,
      `反馈默认客户-${runId}`,
      ids.customerWithDefaultTemplateId,
      ids.defaultOrderPendingId,
      `CF-ORDER-DEF-P-${runId}`,
      ids.skippedOrderId,
      `CF-ORDER-SKIP-${runId}`,
      customerCodes.skipped,
      `反馈跳过客户-${runId}`,
      ids.customerSkippedId,
    ]
  );
}

async function cleanup(pool: Pool) {
  await pool.query(`delete from export_records where exported_by = $1`, [marker]);
  await pool.query(`delete from column_mappings where created_by = $1 or remark = $1`, [marker]);
  await pool.query(`delete from templates where id = $1`, [ids.defaultTemplateId]);
  await pool.query(`delete from orders where id = any($1::varchar[])`, [[
    ids.mappedOrderId,
    ids.defaultOrderShippedId,
    ids.defaultOrderPendingId,
    ids.skippedOrderId,
  ]]);
  await pool.query(`delete from customers where id = any($1::uuid[])`, [[
    ids.customerWithMappingId,
    ids.customerWithDefaultTemplateId,
    ids.customerSkippedId,
  ]]);
  await rm(artifactDir, { recursive: true, force: true });
}

async function validateCustomerIdsRequired() {
  const response = await fetchJson<JsonResponse<never>>(`${BASE_URL}/api/export-feedback/batch`, {
    method: 'POST',
    headers: buildAuthedHeaders(),
    body: JSON.stringify({
      customerIds: [],
      exportedBy: marker,
    }),
  });

  assert(response.status === 400, `empty customerIds expected 400, got ${response.status}`);
  assert(response.data.success === false, 'empty customerIds should return success=false');
  assert(response.data.error === '请选择至少一个客户', 'empty customerIds should return clear validation error');

  logPass('customerIds validation');
}

async function validateMixedTemplateSource(pool: Pool) {
  const response = await fetchJson<JsonResponse<ExportFeedbackResponse>>(`${BASE_URL}/api/export-feedback/batch`, {
    method: 'POST',
    headers: buildAuthedHeaders(),
    body: JSON.stringify({
      customerIds: [ids.customerWithMappingId, ids.customerWithDefaultTemplateId],
      exportedBy: marker,
      skipUnshipped: false,
    }),
  });

  assert(response.status === 200, `mixed export expected 200, got ${response.status}`);
  assert(response.data.success, 'mixed export should return success=true');

  const data = response.data.data;
  assert(data, 'mixed export should return data payload');
  const recordId = expectRecordId(data.recordId, 'mixed export should create recordId');
  assert(data.totalCustomerCount === 2, 'mixed export should include two customers');
  assert(data.totalOrderCount === 3, 'mixed export should include three orders');
  assert(data.shippedOrderCount === 2, 'mixed export should count two shipped orders');
  assert(data.pendingReceiptCount === 1, 'mixed export should count one pending receipt order');
  assert(data.templateSource === 'mixed', 'mixed export should surface top-level mixed templateSource');
  assert(data.zipFileUrl === buildDownloadPath(recordId), 'mixed export zipFileUrl should point to persisted download path');
  assert(Boolean(data.artifact?.relative_path), 'mixed export should return top-level artifact metadata');
  assert(Array.isArray(data.details) && data.details.length === 2, 'mixed export should return two detail rows');

  const detailByCustomer = new Map(data.details.map((detail) => [detail.customerId, detail]));
  const mappedDetail = detailByCustomer.get(ids.customerWithMappingId);
  const defaultDetail = detailByCustomer.get(ids.customerWithDefaultTemplateId);

  assert(mappedDetail, 'mixed export should include mapped customer detail');
  assert(defaultDetail, 'mixed export should include default customer detail');
  assert(mappedDetail.templateSource === 'column_mapping', 'mapped customer should use column_mapping templateSource');
  assert(defaultDetail.templateSource === 'default', 'default customer should use default templateSource');
  assert(mappedDetail.fileUrl === buildDownloadPath(recordId, data.details.indexOf(mappedDetail)), 'mapped detail should expose detailIndex download path');
  assert(defaultDetail.fileUrl === buildDownloadPath(recordId, data.details.indexOf(defaultDetail)), 'default detail should expose detailIndex download path');
  assert(Boolean(mappedDetail.artifact?.relative_path), 'mapped detail should include persisted artifact metadata');
  assert(Boolean(defaultDetail.artifact?.relative_path), 'default detail should include persisted artifact metadata');

  const record = await getExportRecord(pool, recordId);
  assert(record.file_url === buildDownloadPath(recordId), 'persisted record file_url should match download path');
  assert(record.zip_file_url === buildDownloadPath(recordId), 'persisted record zip_file_url should match download path');
  assert(record.total_count === 3, 'persisted record total_count should match exported order count');
  assert(record.metadata?.template_source === 'mixed', 'persisted record metadata should keep mixed templateSource');
  assert(record.metadata?.details?.length === 2, 'persisted record metadata should keep two details');
  assert(record.metadata?.shipped_order_count === 2, 'persisted record should keep shipped count');
  assert(record.metadata?.pending_receipt_count === 1, 'persisted record should keep pending receipt count');

  const zipDownload = await fetch(`${BASE_URL}${data.zipFileUrl}`, {
    headers: buildAuthedHeaders(),
  });
  const zipBytes = Buffer.from(await zipDownload.arrayBuffer());
  assert(zipDownload.status === 200, `mixed zip download expected 200, got ${zipDownload.status}`);
  assert(zipDownload.headers.get('content-type') === 'application/zip', 'mixed zip download should return zip content type');
  assert(zipBytes.length > 100, 'mixed zip download should return non-empty bytes');

  for (let index = 0; index < data.details.length; index += 1) {
    const detailDownload = await fetch(`${BASE_URL}${buildDownloadPath(recordId, index)}`, {
      headers: buildAuthedHeaders(),
    });
    const detailBytes = Buffer.from(await detailDownload.arrayBuffer());
    assert(detailDownload.status === 200, `detail download ${index} expected 200, got ${detailDownload.status}`);
    assert(
      detailDownload.headers.get('content-type') ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      `detail download ${index} should return xlsx content type`
    );
    assert(detailBytes.length > 200, `detail download ${index} should return non-empty bytes`);
  }

  logPass('mixed templateSource + artifact contract', recordId);
}

async function validateSkipUnshipped(pool: Pool) {
  const response = await fetchJson<JsonResponse<ExportFeedbackResponse>>(`${BASE_URL}/api/export-feedback/batch`, {
    method: 'POST',
    headers: buildAuthedHeaders(),
    body: JSON.stringify({
      customerIds: [ids.customerSkippedId],
      exportedBy: marker,
      skipUnshipped: true,
    }),
  });

  assert(response.status === 200, `skipUnshipped export expected 200, got ${response.status}`);
  assert(response.data.success, 'skipUnshipped export should still return success=true');

  const data = response.data.data;
  assert(data, 'skipUnshipped export should return data payload');
  const recordId = expectRecordId(data.recordId, 'skipUnshipped export should create recordId');
  assert(data.totalCustomerCount === 0, 'skipUnshipped export should skip pending-only customer');
  assert(data.totalOrderCount === 0, 'skipUnshipped export should export zero orders');
  assert(data.shippedOrderCount === 0, 'skipUnshipped export should report zero shipped orders');
  assert(data.pendingReceiptCount === 0, 'skipUnshipped export should report zero pending receipt count after skip');
  assert(Array.isArray(data.details) && data.details.length === 0, 'skipUnshipped export should return empty details');
  assert(data.zipFileUrl === buildDownloadPath(recordId), 'skipUnshipped export should still expose persisted zip download path');
  assert(data.templateSource === 'default', 'skipUnshipped export should fall back to default templateSource');

  const record = await getExportRecord(pool, recordId);
  assert(record.total_count === 0, 'skipUnshipped persisted record should keep total_count=0');
  assert(record.metadata?.details?.length === 0, 'skipUnshipped persisted record should keep empty details');
  assert(record.metadata?.template_source === 'default', 'skipUnshipped persisted record should keep default templateSource');

  logPass('skipUnshipped behavior', recordId);
}

async function validateNoPersistenceMode(pool: Pool) {
  const beforeCountRow = await pool.query<{ total: string }>(
    `select count(*) as total from export_records where exported_by = $1`,
    [marker]
  );
  const beforeCount = Number(beforeCountRow.rows[0]?.total || '0');

  const response = await fetchJson<JsonResponse<ExportFeedbackResponse>>(`${BASE_URL}/api/export-feedback/batch`, {
    method: 'POST',
    headers: buildAuthedHeaders(),
    body: JSON.stringify({
      customerIds: [ids.customerWithDefaultTemplateId],
      exportedBy: marker,
      persistenceMode: 'none',
    }),
  });

  assert(response.status === 200, `persistenceMode=none export expected 200, got ${response.status}`);
  assert(response.data.success, 'persistenceMode=none export should return success=true');

  const data = response.data.data;
  assert(data, 'persistenceMode=none export should return data payload');
  assert(data.recordId === null, 'persistenceMode=none export should not create recordId');
  assert(data.zipFileUrl === null, 'persistenceMode=none export should not expose persisted zipFileUrl');
  assert(!data.artifact, 'persistenceMode=none export should not expose top-level artifact');
  assert(data.persistenceMode === 'none', `persistenceMode should be none, got ${String(data.persistenceMode)}`);
  assert(Array.isArray(data.details) && data.details.length === 1, 'persistenceMode=none export should still return detail rows');
  assert(!data.details[0]?.artifact, 'persistenceMode=none detail should not expose persisted artifact');
  assert(data.details[0]?.fileUrl === '', `persistenceMode=none detail fileUrl should be empty, got ${String(data.details[0]?.fileUrl)}`);

  const afterCountRow = await pool.query<{ total: string }>(
    `select count(*) as total from export_records where exported_by = $1`,
    [marker]
  );
  const afterCount = Number(afterCountRow.rows[0]?.total || '0');
  assert(afterCount === beforeCount, 'persistenceMode=none export should not create export_records');

  logPass('persistenceMode=none skips export record creation');
}

async function main() {
  console.log('Validate API Export Feedback');
  console.log('');

  const pool = await connectDatabase();
  let child: ReturnType<typeof startServer> | null = null;

  try {
    await cleanup(pool).catch(() => {});
    await seedDatabase(pool);
    logPass('seed data');

    child = startServer(PORT);
    await waitForServer(BASE_URL, child);
    logPass('server startup', BASE_URL);

    await validateCustomerIdsRequired();
    await validateMixedTemplateSource(pool);
    await validateSkipUnshipped(pool);
    await validateNoPersistenceMode(pool);

    console.log('');
    console.log('PASS export-feedback API integration checks completed.');
  } finally {
    if (child) {
      await stopServer(child);
    }
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

main().catch((error) => {
  console.error('FAIL export-feedback API integration checks');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
