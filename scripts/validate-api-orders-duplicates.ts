import fs from 'fs';
import path from 'path';
import { ADMIN_USER, assert, buildAuthedHeaders } from './lib/api-test-harness';

type Row = Record<string, unknown>;

type QueryResponse<T = Row> = {
  data: T[] | T | null;
  error: Error | null;
  count?: number | null;
};

type TableName = 'users' | 'customers' | 'orders' | 'suppliers' | 'warehouses';

type RouteModule = {
  POST: (request: Request) => Promise<Response>;
};

type DuplicateReason = 'batch_duplicate' | 'existing_order';

type DuplicateDetail = {
  orderNo: string;
  receiverName: string;
  reason: DuplicateReason;
  existingSysOrderNo?: string;
};

type OrderPostPayload = {
  success: boolean;
  data?: Row[];
  total?: number;
  message?: string;
  error?: string;
  duplicateSummary?: {
    totalSkipped: number;
    batchDuplicateCount: number;
    existingDuplicateCount: number;
    details: DuplicateDetail[];
  };
};

type Scenario = {
  name: string;
  customer: {
    code: string;
    name: string;
  };
  seedOrders: Array<{
    order_no: string;
    sys_order_no: string;
    customer_code: string;
    receiver_name: string;
    created_at: string;
  }>;
  request: {
    receiver: {
      name: string;
      phone: string;
      address: string;
    };
    items: Array<{
      orderNo: string;
      productName: string;
      quantity: number;
    }>;
  };
  expected: {
    createdCount: number;
    totalSkipped: number;
    batchDuplicateCount: number;
    existingDuplicateCount: number;
    messageIncludes?: string;
    details: Array<{
      orderNo: string;
      reason: DuplicateReason;
      existingSysOrderNo?: string;
    }>;
  };
};

type FixtureFile = {
  scenarios: Scenario[];
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeLikePattern(value: string) {
  return value.replace(/%/g, '').toLowerCase();
}

function matchesLike(actual: unknown, expected: string) {
  return String(actual ?? '')
    .toLowerCase()
    .includes(normalizeLikePattern(expected));
}

function parseSelectColumns(select?: string) {
  if (!select || select.trim() === '*' || select.includes('(') || select.includes(')')) {
    return null;
  }

  return select
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
}

class MemoryDatabase {
  private tables: Record<TableName, Row[]> = {
    users: [],
    customers: [],
    orders: [],
    suppliers: [],
    warehouses: [],
  };

  private counters: Record<TableName, number> = {
    users: 0,
    customers: 0,
    orders: 0,
    suppliers: 0,
    warehouses: 0,
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
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private selectColumns = '*';
  private selectOptions: { count?: 'exact'; head?: boolean } = {};
  private conditions: Array<{ type: 'eq' | 'in' | 'ilike' | 'gte'; column: string; value: unknown }> = [];
  private limitCount: number | null = null;
  private mutationData: Row[] = [];
  private expectSingle: 'single' | 'maybeSingle' | null = null;

  constructor(
    private readonly db: MemoryDatabase,
    private readonly table: TableName
  ) {}

  select(columns = '*', options: { count?: 'exact'; head?: boolean } = {}) {
    this.selectColumns = columns;
    this.selectOptions = options;
    return this;
  }

  insert(data: Row | Row[]) {
    this.operation = 'insert';
    this.mutationData = Array.isArray(data) ? data.map(clone) : [clone(data)];
    return this;
  }

  update(data: Row) {
    this.operation = 'update';
    this.mutationData = [clone(data)];
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.conditions.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.conditions.push({ type: 'in', column, value });
    return this;
  }

  ilike(column: string, value: string) {
    this.conditions.push({ type: 'ilike', column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.conditions.push({ type: 'gte', column, value });
    return this;
  }

  limit(value: number) {
    this.limitCount = value;
    return this;
  }

  single() {
    this.expectSingle = 'single';
    return this;
  }

  maybeSingle() {
    this.expectSingle = 'maybeSingle';
    return this;
  }

  then<TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private filterRows(rows: Row[]) {
    return rows.filter((row) => {
      for (const condition of this.conditions) {
        const actual = row[condition.column];
        if (condition.type === 'eq' && actual !== condition.value) {
          return false;
        }
        if (condition.type === 'in' && (!Array.isArray(condition.value) || !condition.value.includes(actual))) {
          return false;
        }
        if (condition.type === 'ilike' && !matchesLike(actual, String(condition.value))) {
          return false;
        }
        if (condition.type === 'gte' && String(actual ?? '') < String(condition.value ?? '')) {
          return false;
        }
      }

      return true;
    });
  }

  private projectRows(rows: Row[]) {
    const columns = parseSelectColumns(this.selectColumns);
    if (!columns) {
      return rows.map(clone);
    }

    return rows.map((row) =>
      Object.fromEntries(columns.map((column) => [column, row[column]]))
    );
  }

  private finalizeSelect(rows: Row[]): QueryResponse<T> {
    const limitedRows = this.limitCount === null ? rows : rows.slice(0, this.limitCount);

    if (this.selectOptions.head && this.selectOptions.count === 'exact') {
      return {
        data: null,
        error: null,
        count: rows.length,
      };
    }

    const projected = this.projectRows(limitedRows) as T[];
    if (this.expectSingle === 'single' || this.expectSingle === 'maybeSingle') {
      return {
        data: projected[0] ?? null,
        error: null,
      };
    }

    return {
      data: projected,
      error: null,
      count: this.selectOptions.count === 'exact' ? rows.length : null,
    };
  }

  private async execute(): Promise<QueryResponse<T>> {
    const tableRows = this.db.all(this.table);

    if (this.operation === 'select') {
      return this.finalizeSelect(this.filterRows(tableRows));
    }

    if (this.operation === 'insert') {
      const inserted = this.mutationData.map((row) => this.db.seed(this.table, row));
      return this.finalizeSelect(inserted);
    }

    if (this.operation === 'update') {
      const matchedRows = this.filterRows(tableRows);
      const patch = this.mutationData[0] || {};
      const updated = matchedRows.map((row) => {
        Object.assign(row, clone(patch));
        return clone(row);
      });
      return this.finalizeSelect(updated);
    }

    if (this.operation === 'delete') {
      const matchedRows = this.filterRows(tableRows);
      const survivors = tableRows.filter((row) => !matchedRows.includes(row));
      const deleted = matchedRows.map(clone);
      this.db.all(this.table).splice(0, tableRows.length, ...survivors);
      return this.finalizeSelect(deleted);
    }

    return {
      data: null,
      error: new Error(`Unsupported operation: ${this.operation}`),
    };
  }
}

class MemorySupabaseClient {
  constructor(private readonly db: MemoryDatabase) {}

  from(table: string) {
    return new MemoryQueryBuilder(this.db, table as TableName);
  }
}

function installOrdersRouteWithMockDb(db: MemoryDatabase): RouteModule {
  const requireFn = require as NodeRequire;
  const routePath = requireFn.resolve('../src/app/api/orders/route.ts');
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

function loadFixtures() {
  const fixturePath = path.join(process.cwd(), 'tests/fixtures/api/orders/duplicates.json');
  return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as FixtureFile;
}

function createRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
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

function seedScenario(db: MemoryDatabase, scenario: Scenario) {
  db.seed('customers', {
    code: scenario.customer.code,
    name: scenario.customer.name,
    sales_user_name: '默认业务员',
    operator_user_name: '默认跟单员',
  });

  for (const order of scenario.seedOrders) {
    db.seed('orders', {
      ...order,
      status: 'pending',
      source: 'ai_parse',
      updated_at: order.created_at,
    });
  }
}

function assertDuplicateDetail(
  actualDetails: DuplicateDetail[],
  expectedDetails: Scenario['expected']['details'],
  scenarioName: string
) {
  assert(actualDetails.length === expectedDetails.length, `${scenarioName}: duplicate details 数量不匹配`);

  expectedDetails.forEach((expectedDetail) => {
    const actual = actualDetails.find(
      (item) =>
        item.orderNo === expectedDetail.orderNo &&
        item.reason === expectedDetail.reason &&
        (expectedDetail.existingSysOrderNo ? item.existingSysOrderNo === expectedDetail.existingSysOrderNo : true)
    );

    assert(
      actual,
      `${scenarioName}: 未找到重复明细 ${expectedDetail.orderNo}/${expectedDetail.reason}/${expectedDetail.existingSysOrderNo ?? '-'}`
    );
  });
}

async function main() {
  const fixtures = loadFixtures();
  const headers = buildAuthedHeaders(ADMIN_USER);

  for (const scenario of fixtures.scenarios) {
    await runCase(scenario.name, async () => {
      const db = new MemoryDatabase();
      seedScenario(db, scenario);
      const route = installOrdersRouteWithMockDb(db);

      const response = await route.POST(
        createRequest('http://local.test/api/orders', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customerCode: scenario.customer.code,
            customerName: scenario.customer.name,
            salespersonName: '默认业务员',
            operatorName: '默认跟单员',
            receiver: scenario.request.receiver,
            items: scenario.request.items,
          }),
        })
      );

      const payload = await readJson<OrderPostPayload>(response);

      assert(response.status === 200, `${scenario.name}: 预期 200，实际 ${response.status}`);
      assert(payload.success, `${scenario.name}: POST 返回失败 ${payload.error ?? 'unknown'}`);
      assert(Array.isArray(payload.data), `${scenario.name}: data 不是数组`);
      assert(payload.duplicateSummary, `${scenario.name}: 缺少 duplicateSummary`);
      assert((payload.data?.length || 0) === scenario.expected.createdCount, `${scenario.name}: 创建数量不匹配`);
      assert(payload.total === scenario.expected.createdCount, `${scenario.name}: total 不匹配`);
      assert(
        payload.duplicateSummary.totalSkipped === scenario.expected.totalSkipped,
        `${scenario.name}: totalSkipped 不匹配`
      );
      assert(
        payload.duplicateSummary.batchDuplicateCount === scenario.expected.batchDuplicateCount,
        `${scenario.name}: batchDuplicateCount 不匹配`
      );
      assert(
        payload.duplicateSummary.existingDuplicateCount === scenario.expected.existingDuplicateCount,
        `${scenario.name}: existingDuplicateCount 不匹配`
      );
      assertDuplicateDetail(payload.duplicateSummary.details, scenario.expected.details, scenario.name);

      if (scenario.expected.messageIncludes) {
        assert(
          String(payload.message || '').includes(scenario.expected.messageIncludes),
          `${scenario.name}: message 未包含 ${scenario.expected.messageIncludes}`
        );
      }

      if (scenario.expected.createdCount === 0) {
        assert((payload.data?.length || 0) === 0, `${scenario.name}: 预期 data 为空数组`);
      }
    });
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('API orders duplicateSummary validation finished with failures.');
    return;
  }

  console.log('Validated /api/orders duplicateSummary contract via route-module integration with in-memory DB seed.');
}

main().catch((error) => {
  console.error('Failed to validate /api/orders duplicateSummary contract:', error);
  process.exitCode = 1;
});
