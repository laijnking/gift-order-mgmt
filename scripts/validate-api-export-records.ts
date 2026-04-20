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

type ExportRecordRow = {
  id: string;
  export_type: string;
  file_url: string | null;
  file_name: string | null;
  zip_file_url: string | null;
  zip_file_name: string | null;
  exported_by: string | null;
  metadata: {
    artifact?: {
      relative_path?: string;
      file_name?: string;
      provider?: 'local' | 's3';
    };
    details?: Array<{
      customerId?: string;
      customerName?: string;
      fileName?: string;
      fileUrl?: string;
      orderCount?: number;
      shippedOrderCount?: number;
      pendingReceiptCount?: number;
      templateSource?: string;
      artifact?: {
        relative_path?: string;
        file_name?: string;
        provider?: 'local' | 's3';
      };
    }>;
    template_source?: string;
    shipped_order_count?: number;
    pending_receipt_count?: number;
    last_regenerated_at?: string;
    last_regenerated_file_name?: string | null;
  } | null;
};

type JsonResponse<T> = {
  success: boolean;
  error?: string;
  data?: T;
};

type RegenerationResponse = {
  recordId?: string | null;
  zipFileUrl?: string | null;
  artifact?: {
    relative_path?: string;
    file_name?: string;
    provider?: 'local' | 's3';
  } | null;
  persistenceMode?: 'none' | 'full';
  details?: Array<{
    customerId?: string;
    supplierId?: string;
    fileUrl?: string;
    artifact?: {
      relative_path?: string;
      file_name?: string;
      provider?: 'local' | 's3';
    } | null;
  }>;
};

type DetailResponse = {
  id: string;
  supplier_id?: string | null;
  entityName?: string;
  details?: Array<Record<string, unknown>>;
};

const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';
const PORT = 5214;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const runId = Date.now().toString();
const marker = `validate-export-records-${runId}`;
const artifactDir = path.join(process.cwd(), 'data', 'test-artifacts', marker);

const ids = {
  customerId: crypto.randomUUID(),
  supplierId: crypto.randomUUID(),
  feedbackRecordId: crypto.randomUUID(),
  detailRecordId: crypto.randomUUID(),
  orderReturnedWithTrackingId: crypto.randomUUID(),
  orderReturnedPendingTrackingId: crypto.randomUUID(),
  orderReturnedWithTrackingNo: `ORDER-${runId}-1`,
  orderReturnedPendingTrackingNo: `ORDER-${runId}-2`,
};

function logPass(step: string, detail?: string) {
  console.log(`PASS ${step}${detail ? ` - ${detail}` : ''}`);
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

async function getExportRecord(pool: Pool, id: string) {
  const result = await pool.query<ExportRecordRow>(
    `
      select
        id,
        export_type,
        file_url,
        file_name,
        zip_file_url,
        zip_file_name,
        exported_by,
        metadata
      from export_records
      where id = $1
    `,
    [id]
  );

  assert(result.rowCount === 1, `export_records ${id} should exist`);
  return result.rows[0];
}

async function getExportRecordCount(pool: Pool) {
  const result = await pool.query<{ total: string }>(
    `select count(*) as total from export_records where exported_by = $1`,
    [marker]
  );
  return Number(result.rows[0]?.total || '0');
}

async function seedDatabase(pool: Pool) {
  await pool.query(
    `
      insert into customers (id, code, name, status, created_at, updated_at)
      values ($1, $2, $3, 'active', now(), now())
    `,
    [ids.customerId, `VAL-${runId}`, `API Validate Customer ${runId}`]
  );

  await pool.query(
    `
      insert into suppliers (id, name, type, send_type, is_active, created_at)
      values ($1, $2, 'self', 'self', true, now())
    `,
    [ids.supplierId, `API Validate Supplier ${runId}`]
  );

  const orderItems = JSON.stringify([
    {
      product_name: 'Validation Gift Box',
      product_code: 'VAL-SKU-1',
      quantity: 1,
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
        customer_id,
        salesperson,
        operator_name,
        created_at,
        updated_at,
        tracking_no,
        express_company,
        sys_order_no
      )
      values
      ($1, $2, 'returned', $3::jsonb, 'Alice', '13800000001', 'Shanghai Pudong 1', $4, $5, $6, 'Sales A', 'Operator A', now(), now(), 'SF10001', 'SF', 'SYS-VAL-1'),
      ($7, $8, 'returned', $3::jsonb, 'Bob', '13800000002', 'Shanghai Pudong 2', $4, $5, $6, 'Sales A', 'Operator A', now(), now(), '', null, 'SYS-VAL-2')
    `,
    [
      ids.orderReturnedWithTrackingId,
      ids.orderReturnedWithTrackingNo,
      orderItems,
      `VAL-${runId}`,
      `API Validate Customer ${runId}`,
      ids.customerId,
      ids.orderReturnedPendingTrackingId,
      ids.orderReturnedPendingTrackingNo,
    ]
  );

  await pool.query(
    `
      insert into export_records (
        id,
        export_type,
        customer_id,
        file_url,
        file_name,
        zip_file_url,
        zip_file_name,
        total_count,
        exported_by,
        exported_at,
        metadata
      )
      values (
        $1,
        'customer_feedback',
        $2,
        $3,
        'legacy-feedback.zip',
        $3,
        'legacy-feedback.zip',
        2,
        $4,
        now(),
        $5::jsonb
      )
    `,
    [
      ids.feedbackRecordId,
      ids.customerId,
      `/api/export-records/${ids.feedbackRecordId}/download`,
      marker,
      JSON.stringify({
        customer_ids: [ids.customerId],
        template_source: 'default',
        shipped_order_count: 0,
        pending_receipt_count: 0,
        artifact: {
          relative_path: `data/legacy/${ids.feedbackRecordId}/legacy-feedback.zip`,
          file_name: 'legacy-feedback.zip',
          provider: 'local',
        },
        details: [
          {
            customerId: ids.customerId,
            customerName: `API Validate Customer ${runId}`,
            orderCount: 1,
            fileName: 'legacy-feedback-detail.xlsx',
            fileUrl: `/api/export-records/${ids.feedbackRecordId}/download?detailIndex=0`,
            artifact: {
              relative_path: `data/legacy/${ids.feedbackRecordId}/legacy-feedback-detail.xlsx`,
              file_name: 'legacy-feedback-detail.xlsx',
              provider: 'local',
            },
            status: 'success',
          },
        ],
      }),
    ]
  );

  await pool.query(
    `
      insert into export_records (
        id,
        export_type,
        supplier_id,
        file_url,
        file_name,
        zip_file_url,
        zip_file_name,
        total_count,
        exported_by,
        exported_at,
        metadata
      )
      values (
        $1,
        'shipping_notice',
        $2,
        $4,
        'detail-contract.zip',
        $4,
        'detail-contract.zip',
        2,
        $3,
        now(),
        $5::jsonb
      )
    `,
    [
      ids.detailRecordId,
      ids.supplierId,
      marker,
      `/api/export-records/${ids.detailRecordId}/download`,
      JSON.stringify({
        details: [
          {
            supplierId: ids.supplierId,
            supplierName: `API Validate Supplier ${runId}`,
            orderCount: 2,
          },
        ],
      }),
    ]
  );
}

async function cleanup(pool: Pool) {
  await pool.query(`delete from export_records where exported_by = $1`, [marker]);
  await pool.query(`delete from orders where id = any($1::varchar[])`, [
    [ids.orderReturnedWithTrackingId, ids.orderReturnedPendingTrackingId],
  ]);
  await pool.query(`delete from customers where id = $1`, [ids.customerId]);
  await pool.query(`delete from suppliers where id = $1`, [ids.supplierId]);
  await rm(artifactDir, { recursive: true, force: true });
}

async function validateGetDetails() {
  const response = await fetchJson<JsonResponse<DetailResponse>>(
    `${BASE_URL}/api/export-records/${ids.detailRecordId}`,
    {
      headers: buildAuthedHeaders(),
    }
  );

  assert(response.status === 200, `GET detail status expected 200, got ${response.status}`);
  assert(response.data.success, 'GET detail should return success=true');
  assert(response.data.data?.id === ids.detailRecordId, 'GET detail should return requested record id');
  assert(
    response.data.data?.entityName === `API Validate Supplier ${runId}`,
    `GET detail should expose supplier entityName`
  );
  assert(Array.isArray(response.data.data?.details), 'GET detail should expose details array');
  assert(response.data.data?.details?.length === 1, 'GET detail should return one detail row');

  logPass('GET details contract');
}

async function validateFullRegeneration(pool: Pool) {
  const beforeCount = await getExportRecordCount(pool);
  const response = await fetchJson<JsonResponse<RegenerationResponse>>(
    `${BASE_URL}/api/export-records/${ids.feedbackRecordId}`,
    {
      method: 'POST',
      headers: buildAuthedHeaders(),
      body: JSON.stringify({}),
    }
  );

  assert(response.status === 200, `POST full regeneration status expected 200, got ${response.status}`);
  assert(response.data.success, 'POST full regeneration should return success=true');
  assert(response.data.data?.recordId === null, 'full regeneration should not create a downstream export record');
  assert(response.data.data?.zipFileUrl === null, 'full regeneration should not expose downstream persisted zipFileUrl');
  assert(!response.data.data?.artifact, 'full regeneration should not expose downstream persisted artifact');
  assert(response.data.data?.persistenceMode === 'none', `full regeneration persistenceMode should be none, got ${String(response.data.data?.persistenceMode)}`);

  const record = await getExportRecord(pool, ids.feedbackRecordId);
  const afterCount = await getExportRecordCount(pool);
  assert(afterCount === beforeCount, 'full regeneration should not create extra export_records');
  assert(record.file_url === `/api/export-records/${ids.feedbackRecordId}/download`, 'full regeneration should rewrite file_url to persisted download route');
  assert(record.zip_file_url === `/api/export-records/${ids.feedbackRecordId}/download`, 'full regeneration should rewrite zip_file_url to persisted download route');
  assert(Boolean(record.file_name?.startsWith('客户反馈批量导出+')), 'full regeneration should update zip file name');
  assert(Boolean(record.metadata?.artifact?.relative_path?.includes(ids.feedbackRecordId)), 'full regeneration should persist root artifact under original record id');
  assert(record.metadata?.template_source === 'default', 'full regeneration should preserve template_source writeback');
  assert(record.metadata?.shipped_order_count === 1, 'full regeneration should write shipped_order_count');
  assert(record.metadata?.pending_receipt_count === 1, 'full regeneration should write pending_receipt_count');
  assert(Boolean(record.metadata?.last_regenerated_at), 'full regeneration should write last_regenerated_at');
  assert(Array.isArray(record.metadata?.details), 'full regeneration should write details array');
  assert(record.metadata?.details?.length === 1, 'full regeneration should keep exactly one detail');
  assert(
    record.metadata?.details?.[0]?.customerId === ids.customerId,
    'full regeneration should write back detail for the seeded customer'
  );
  assert(
    Boolean(record.metadata?.details?.[0]?.artifact?.relative_path),
    'full regeneration should persist detail artifact metadata'
  );

  logPass('POST full regeneration writeback');
  return record;
}

async function validateDetailRegeneration(pool: Pool, previousRecord: ExportRecordRow) {
  const previousRootArtifact = previousRecord.metadata?.artifact?.relative_path;
  const previousFileName = previousRecord.file_name;

  const beforeCount = await getExportRecordCount(pool);
  const response = await fetchJson<JsonResponse<RegenerationResponse>>(
    `${BASE_URL}/api/export-records/${ids.feedbackRecordId}`,
    {
      method: 'POST',
      headers: buildAuthedHeaders(),
      body: JSON.stringify({
        customerId: ids.customerId,
      }),
    }
  );

  assert(response.status === 200, `POST detail regeneration status expected 200, got ${response.status}`);
  assert(response.data.success, 'POST detail regeneration should return success=true');
  assert(response.data.data?.recordId === null, 'detail regeneration should not create a downstream export record');
  assert(response.data.data?.zipFileUrl === null, 'detail regeneration should not expose downstream persisted zipFileUrl');
  assert(!response.data.data?.artifact, 'detail regeneration should not expose downstream persisted artifact');
  assert(response.data.data?.persistenceMode === 'none', `detail regeneration persistenceMode should be none, got ${String(response.data.data?.persistenceMode)}`);
  assert(!response.data.data?.details?.[0]?.artifact, 'detail regeneration should not expose downstream detail artifact');
  assert(
    response.data.data?.details?.[0]?.fileUrl === '',
    `detail regeneration should not expose downstream detail fileUrl, got ${String(response.data.data?.details?.[0]?.fileUrl)}`
  );

  const record = await getExportRecord(pool, ids.feedbackRecordId);
  const afterCount = await getExportRecordCount(pool);
  assert(afterCount === beforeCount, 'detail regeneration should not create extra export_records');
  assert(record.file_name === previousFileName, 'detail regeneration should not rewrite top-level zip file name');
  assert(
    record.metadata?.artifact?.relative_path === previousRootArtifact,
    'detail regeneration should keep top-level artifact unchanged'
  );
  assert(record.metadata?.details?.length === 1, 'detail regeneration should keep a single detail');
  assert(
    Boolean(record.metadata?.details?.[0]?.artifact?.relative_path),
    'detail regeneration should persist matching detail artifact metadata'
  );
  assert(
    record.metadata?.details?.[0]?.customerId === ids.customerId,
    'detail regeneration should keep matching customerId'
  );
  assert(
    record.metadata?.details?.[0]?.fileUrl === `/api/export-records/${ids.feedbackRecordId}/download?detailIndex=0`,
    'detail regeneration should write back the persisted detail download path'
  );
  assert(
    record.metadata?.last_regenerated_file_name === record.metadata?.details?.[0]?.fileName,
    'detail regeneration should update last_regenerated_file_name to the regenerated detail file'
  );

  logPass('POST detail regeneration writeback');
  return record;
}

async function validateDownloadBoundaries(record: ExportRecordRow) {
  const invalid = await fetch(
    `${BASE_URL}/api/export-records/${ids.feedbackRecordId}/download?detailIndex=-1`,
    { headers: buildAuthedHeaders() }
  );
  const invalidJson = (await invalid.json()) as JsonResponse<never>;
  assert(invalid.status === 400, `download invalid detailIndex expected 400, got ${invalid.status}`);
  assert(!invalidJson.success, 'download invalid detailIndex should return success=false');

  const missing = await fetch(
    `${BASE_URL}/api/export-records/${ids.feedbackRecordId}/download?detailIndex=9`,
    { headers: buildAuthedHeaders() }
  );
  const missingJson = (await missing.json()) as JsonResponse<never>;
  assert(missing.status === 404, `download missing detailIndex expected 404, got ${missing.status}`);
  assert(!missingJson.success, 'download missing detailIndex should return success=false');

  const detailDownload = await fetch(
    `${BASE_URL}/api/export-records/${ids.feedbackRecordId}/download?detailIndex=0`,
    { headers: buildAuthedHeaders() }
  );
  const detailBytes = Buffer.from(await detailDownload.arrayBuffer());
  assert(detailDownload.status === 200, `download detailIndex=0 expected 200, got ${detailDownload.status}`);
  assert(
    detailDownload.headers.get('content-type') ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'download detailIndex=0 should return xlsx content type'
  );
  assert(detailBytes.length > 200, 'download detailIndex=0 should return non-empty xlsx bytes');
  assert(record.metadata?.details?.[0]?.fileName, 'detail download should have a detail filename available');

  const zipDownload = await fetch(`${BASE_URL}/api/export-records/${ids.feedbackRecordId}/download`, {
    headers: buildAuthedHeaders(),
  });
  const zipBytes = Buffer.from(await zipDownload.arrayBuffer());
  assert(zipDownload.status === 200, `download zip expected 200, got ${zipDownload.status}`);
  assert(zipDownload.headers.get('content-type') === 'application/zip', 'download zip should return zip content type');
  assert(zipBytes.length > 100, 'download zip should return non-empty zip bytes');

  logPass('download detailIndex boundaries');
}

async function main() {
  console.log('Validate API Export Records');
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

    await validateGetDetails();
    const fullRecord = await validateFullRegeneration(pool);
    const detailRecord = await validateDetailRegeneration(pool, fullRecord);
    await validateDownloadBoundaries(detailRecord);

    console.log('');
    console.log('PASS export-records API integration checks completed.');
  } finally {
    if (child) {
      await stopServer(child);
    }
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

main().catch((error) => {
  console.error('FAIL export-records API integration checks');
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
