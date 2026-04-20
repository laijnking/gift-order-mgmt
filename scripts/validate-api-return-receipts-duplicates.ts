import { ADMIN_USER, assert, buildAuthedHeaders } from './lib/api-test-harness';

type Row = Record<string, unknown>;

type QueryResponse<T = Row> = {
  data: T[] | T | null;
  error: Error | null;
  count?: number | null;
};

type TableName = 'return_receipts' | 'return_receipt_records';

type RouteModule = {
  POST: (request: Request) => Promise<Response>;
};

type DuplicateReason = 'batch_duplicate' | 'existing_receipt';

type DuplicateDetail = {
  index: number;
  reason: DuplicateReason;
  matchedFields: string[];
  trackingNo: string;
  supplierOrderNo: string;
  customerOrderNo: string;
  existingReceiptId?: string;
};

type PostPayload = {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    recordId: string | null;
    totalCount: number;
    importedCount: number;
    skippedCount: number;
  };
  duplicateSummary?: {
    totalSkipped: number;
    batchDuplicateCount: number;
    existingDuplicateCount: number;
    details: DuplicateDetail[];
  };
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseSelectColumns(select?: string) {
  if (!select || select.trim() === '*') {
    return null;
  }

  return select
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
}

class MemoryDatabase {
  private tables: Record<TableName, Row[]> = {
    return_receipts: [],
    return_receipt_records: [],
  };

  private counters: Record<TableName, number> = {
    return_receipts: 0,
    return_receipt_records: 0,
  };

  seed(table: TableName, row: Row) {
    const record = clone(row);
    if (!record.id) {
      this.counters[table] += 1;
      record.id = `${table}-${this.counters[table]}`;
    }
    this.tables[table].push(record);
    return clone(record);
  }

  all(table: TableName) {
    return this.tables[table];
  }
}

class MemoryQueryBuilder<T extends Row = Row> implements PromiseLike<QueryResponse<T>> {
  private operation: 'select' | 'insert' = 'select';
  private selectColumns = '*';
  private conditions: Array<{ type: 'eq'; column: string; value: unknown }> = [];
  private mutationData: Row[] = [];
  private expectSingle = false;

  constructor(
    private readonly db: MemoryDatabase,
    private readonly table: TableName
  ) {}

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(data: Row | Row[]) {
    this.operation = 'insert';
    this.mutationData = Array.isArray(data) ? data.map(clone) : [clone(data)];
    return this;
  }

  eq(column: string, value: unknown) {
    this.conditions.push({ type: 'eq', column, value });
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  then<TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private filterRows(rows: Row[]) {
    return rows.filter((row) =>
      this.conditions.every((condition) => {
        if (condition.type === 'eq') {
          return row[condition.column] === condition.value;
        }
        return true;
      })
    );
  }

  private projectRows(rows: Row[]) {
    const columns = parseSelectColumns(this.selectColumns);
    if (!columns) {
      return rows.map(clone);
    }

    return rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column]])));
  }

  private finalize(rows: Row[]): QueryResponse<T> {
    const projected = this.projectRows(rows) as T[];
    if (this.expectSingle) {
      return {
        data: projected[0] ?? null,
        error: null,
      };
    }

    return {
      data: projected,
      error: null,
    };
  }

  private async execute(): Promise<QueryResponse<T>> {
    const rows = this.db.all(this.table);

    if (this.operation === 'select') {
      return this.finalize(this.filterRows(rows));
    }

    const inserted = this.mutationData.map((row) => this.db.seed(this.table, row));
    return this.finalize(inserted);
  }
}

class MemorySupabaseClient {
  constructor(private readonly db: MemoryDatabase) {}

  from(table: string) {
    return new MemoryQueryBuilder(this.db, table as TableName);
  }
}

function installRouteWithMockDb(db: MemoryDatabase): RouteModule {
  const requireFn = require as NodeRequire;
  const routePath = requireFn.resolve('../src/app/api/return-receipts/history/route.ts');
  const supabasePath = requireFn.resolve('@/storage/database/supabase-client');

  delete requireFn.cache[routePath];
  requireFn.cache[supabasePath] = {
    id: supabasePath,
    filename: supabasePath,
    loaded: true,
    exports: {
      getSupabaseClient: () => new MemorySupabaseClient(db),
    },
  } as NodeModule & { exports: { getSupabaseClient: () => MemorySupabaseClient } };

  return requireFn(routePath) as RouteModule;
}

function createRequest(body: Row) {
  return new Request('http://local.test/api/return-receipts/history', {
    method: 'POST',
    headers: buildAuthedHeaders(ADMIN_USER),
    body: JSON.stringify(body),
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function runCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

function seedExistingReceipt(
  db: MemoryDatabase,
  overrides: Partial<{
    id: string;
    supplier_id: string;
    supplier_name: string;
    tracking_no: string;
    supplier_order_no: string;
    customer_order_no: string;
  }> = {}
) {
  return db.seed('return_receipts', {
    id: overrides.id,
    record_id: 'existing-record-1',
    supplier_id: overrides.supplier_id ?? 'supplier-a',
    supplier_name: overrides.supplier_name ?? '供应商A',
    customer_order_no: overrides.customer_order_no ?? 'CUST-001',
    supplier_order_no: overrides.supplier_order_no ?? 'SUP-001',
    express_company: '顺丰',
    tracking_no: overrides.tracking_no ?? 'TRACK-001',
    ship_date: '2026-04-19',
    quantity: 1,
    price: null,
    remark: '',
    match_status: 'pending',
  });
}

async function main() {
  await runCase('同供应商已存在 tracking_no 时跳过重复插入并返回原因', async () => {
    const db = new MemoryDatabase();
    const existing = seedExistingReceipt(db, {
      supplier_id: 'supplier-a',
      tracking_no: 'TRACK-DUP-001',
      supplier_order_no: 'SUP-DUP-001',
      customer_order_no: 'CUST-DUP-001',
    });
    const route = installRouteWithMockDb(db);

    const response = await route.POST(
      createRequest({
        supplierId: 'supplier-a',
        supplierName: '供应商A',
        fileName: 'receipt-a.xlsx',
        receipts: [
          {
            customerOrderNo: 'CUST-DUP-001',
            supplierOrderNo: 'SUP-NEW-001',
            trackingNo: 'TRACK-NEW-001',
          },
          {
            customerOrderNo: 'CUST-NEW-001',
            supplierOrderNo: 'SUP-NEW-001',
            trackingNo: 'TRACK-NEW-001',
          },
        ],
      })
    );

    const payload = await readJson<PostPayload>(response);
    assert(response.status === 200, `预期 200，实际 ${response.status}`);
    assert(payload.success, `请求失败: ${payload.error ?? 'unknown'}`);
    assert(payload.data?.recordId, '应创建新的导入记录');
    assert(payload.data?.importedCount === 1, `importedCount 应为 1，实际 ${String(payload.data?.importedCount)}`);
    assert(payload.data?.skippedCount === 1, `skippedCount 应为 1，实际 ${String(payload.data?.skippedCount)}`);
    assert(payload.duplicateSummary?.existingDuplicateCount === 1, 'existingDuplicateCount 应为 1');
    assert(payload.duplicateSummary?.batchDuplicateCount === 0, 'batchDuplicateCount 应为 0');

    const details = payload.duplicateSummary?.details || [];
    assert(details.length === 1, `重复明细应为 1 条，实际 ${details.length}`);
    assert(details[0].reason === 'existing_receipt', `reason 应为 existing_receipt，实际 ${details[0]?.reason}`);
    assert(details[0].existingReceiptId === existing.id, '应返回命中的 existingReceiptId');
    assert(details[0].matchedFields.includes('customer_order_no'), '应标记 customer_order_no 命中');

    assert(db.all('return_receipt_records').length === 1, '应只创建 1 条导入记录');
    assert(db.all('return_receipts').length === 2, '应只新增 1 条回单明细');
  });

  await runCase('同批重复会跳过后续回单并返回 batch_duplicate', async () => {
    const db = new MemoryDatabase();
    seedExistingReceipt(db, {
      supplier_id: 'supplier-b',
      tracking_no: 'TRACK-OTHER-001',
      supplier_order_no: 'SUP-OTHER-001',
      customer_order_no: 'CUST-OTHER-001',
    });
    const route = installRouteWithMockDb(db);

    const response = await route.POST(
      createRequest({
        supplierId: 'supplier-b',
        supplierName: '供应商B',
        fileName: 'receipt-b.xlsx',
        receipts: [
          {
            customerOrderNo: 'CUST-BATCH-001',
            supplierOrderNo: 'SUP-BATCH-001',
            trackingNo: 'TRACK-BATCH-001',
          },
          {
            customerOrderNo: 'CUST-BATCH-002',
            supplierOrderNo: 'SUP-BATCH-001',
            trackingNo: 'TRACK-BATCH-002',
          },
        ],
      })
    );

    const payload = await readJson<PostPayload>(response);
    assert(response.status === 200, `预期 200，实际 ${response.status}`);
    assert(payload.success, `请求失败: ${payload.error ?? 'unknown'}`);
    assert(payload.data?.importedCount === 1, '应只导入首条回单');
    assert(payload.data?.skippedCount === 1, '应跳过 1 条同批重复');
    assert(payload.duplicateSummary?.batchDuplicateCount === 1, 'batchDuplicateCount 应为 1');
    assert(payload.duplicateSummary?.existingDuplicateCount === 0, 'existingDuplicateCount 应为 0');
    assert(payload.duplicateSummary?.details[0]?.reason === 'batch_duplicate', 'reason 应为 batch_duplicate');
    assert(payload.duplicateSummary?.details[0]?.matchedFields.includes('supplier_order_no'), '应标记 supplier_order_no 命中');

    const insertedReceipts = db.all('return_receipts').filter((row) => row.record_id !== 'existing-record-1');
    assert(insertedReceipts.length === 1, `新增回单应为 1 条，实际 ${insertedReceipts.length}`);
  });

  await runCase('全部重复时不创建空导入记录，并返回跳过摘要', async () => {
    const db = new MemoryDatabase();
    seedExistingReceipt(db, {
      supplier_id: 'supplier-c',
      tracking_no: 'TRACK-ONLY-001',
      supplier_order_no: 'SUP-ONLY-001',
      customer_order_no: 'CUST-ONLY-001',
    });
    const route = installRouteWithMockDb(db);

    const response = await route.POST(
      createRequest({
        supplierId: 'supplier-c',
        supplierName: '供应商C',
        fileName: 'receipt-c.xlsx',
        receipts: [
          {
            customerOrderNo: 'CUST-ONLY-001',
            supplierOrderNo: 'SUP-ONLY-001',
            trackingNo: 'TRACK-ONLY-001',
          },
        ],
      })
    );

    const payload = await readJson<PostPayload>(response);
    assert(response.status === 200, `预期 200，实际 ${response.status}`);
    assert(payload.success, `请求失败: ${payload.error ?? 'unknown'}`);
    assert(payload.data?.recordId === null, '全部重复时不应创建 recordId');
    assert(payload.data?.importedCount === 0, '全部重复时 importedCount 应为 0');
    assert(payload.data?.skippedCount === 1, '全部重复时 skippedCount 应为 1');
    assert(payload.duplicateSummary?.totalSkipped === 1, 'totalSkipped 应为 1');
    assert(String(payload.message || '').includes('未导入新回单'), 'message 应提示未导入新回单');
    assert(db.all('return_receipt_records').length === 0, '全部重复时不应创建空导入记录');
    assert(db.all('return_receipts').length === 1, '全部重复时不应新增回单');
  });

  if (process.exitCode && process.exitCode !== 0) {
    console.error('API return-receipts duplicate validation finished with failures.');
    return;
  }

  console.log('Validated /api/return-receipts/history duplicate import guard via route-module integration with in-memory DB seed.');
}

main().catch((error) => {
  console.error('Failed to validate /api/return-receipts/history duplicate import guard:', error);
  process.exitCode = 1;
});
