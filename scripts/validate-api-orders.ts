import {
  ADMIN_USER,
  assert,
  buildAuthedHeaders,
  type MockUser,
} from './lib/api-test-harness';

type Row = Record<string, unknown>;

type QueryResponse<T = Row> = {
  data: T[] | T | null;
  error: Error | null;
  count?: number | null;
};

type TableName = 'users' | 'customers' | 'orders' | 'suppliers' | 'warehouses';

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
};

type OrderListItem = {
  id: string;
  orderNo: string;
  status: string;
  customerCode: string;
  receiver?: {
    name?: string;
  };
  items?: Array<{
    productName?: string;
    quantity?: number;
  }>;
  extFields?: Record<string, string | null>;
};

type RouteModule = {
  GET: (request: Request) => Promise<Response>;
  POST: (request: Request) => Promise<Response>;
  PATCH: (request: Request) => Promise<Response>;
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

function parseOrExpression(expression: string) {
  return expression
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [column, operator, ...rest] = part.split('.');
      return {
        column,
        operator,
        value: rest.join('.'),
      };
    });
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
  private orGroups: Array<Array<{ column: string; operator: string; value: string }>> = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
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

  or(expression: string) {
    this.orGroups.push(parseOrExpression(expression));
    return this;
  }

  order(column: string, options: { ascending: boolean }) {
    this.orderBy = { column, ascending: options.ascending };
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

      if (this.orGroups.length === 0) {
        return true;
      }

      return this.orGroups.every((group) =>
        group.some((condition) => {
          if (condition.operator === 'ilike') {
            return matchesLike(row[condition.column], condition.value);
          }
          if (condition.operator === 'eq') {
            return row[condition.column] === condition.value;
          }
          return false;
        })
      );
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
    const orderedRows = [...rows];
    if (this.orderBy) {
      orderedRows.sort((left, right) => {
        const leftValue = left[this.orderBy!.column];
        const rightValue = right[this.orderBy!.column];
        const comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''));
        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    const limitedRows = this.limitCount === null ? orderedRows : orderedRows.slice(0, this.limitCount);

    if (this.selectOptions.head && this.selectOptions.count === 'exact') {
      return {
        data: null,
        error: null,
        count: rows.length,
      };
    }

    const projected = this.projectRows(limitedRows) as T[];
    if (this.expectSingle === 'single') {
      return {
        data: projected[0] ?? null,
        error: null,
      };
    }

    if (this.expectSingle === 'maybeSingle') {
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

    const matchedRows = this.filterRows(tableRows);

    if (this.operation === 'update') {
      const patch = this.mutationData[0] || {};
      const updated = matchedRows.map((row) => {
        Object.assign(row, clone(patch));
        return clone(row);
      });
      return this.finalizeSelect(updated);
    }

    if (this.operation === 'delete') {
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

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

function createRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
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

function createMockUser(overrides: Partial<MockUser>): MockUser {
  return {
    ...ADMIN_USER,
    ...overrides,
  };
}

async function main() {
  const db = new MemoryDatabase();
  const route = installOrdersRouteWithMockDb(db);
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const selfPureName = `自测业务员${token}`;
  const selfRealName = `${selfPureName}（业务员）`;
  const otherPureName = `他人业务员${token}`;
  const operatorName = `跟单员${token}`;

  const selfUser = db.seed('users', {
    username: `self-${token}`,
    real_name: selfRealName,
    role: 'salesperson',
  });

  db.seed('users', {
    username: `other-${token}`,
    real_name: otherPureName,
    role: 'salesperson',
  });

  const selfCustomer = db.seed('customers', {
    code: `C-SELF-${token}`,
    name: `本人客户${token}`,
    salesperson_name: selfPureName,
    order_taker_name: operatorName,
  });

  const otherCustomer = db.seed('customers', {
    code: `C-OTHER-${token}`,
    name: `他人客户${token}`,
    salesperson_name: otherPureName,
    order_taker_name: operatorName,
  });

  const adminHeaders = buildAuthedHeaders(ADMIN_USER);
  const selfHeaders = buildAuthedHeaders(
    createMockUser({
      id: String(selfUser.id),
      username: String(selfUser.username),
      realName: String(selfUser.real_name),
      role: 'salesperson',
      roleName: '业务员',
      dataScope: 'self',
    })
  );

  let ownOrderId = '';
  let otherOrderId = '';
  let patchAnchorOrderId = '';
  let patchTargetOrderId = '';
  const ownOrderNo = `ORD-SELF-${token}`;
  const otherOrderNo = `ORD-OTHER-${token}`;
  const patchAnchorOrderNo = `ORD-PATCH-A-${token}`;
  const patchTargetOrderNo = `ORD-PATCH-B-${token}`;

  await runCase('POST JSON 手工创建 payload', async () => {
    const response = await route.POST(
      createRequest('http://local.test/api/orders', {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          customerCode: selfCustomer.code,
          customerName: selfCustomer.name,
          salespersonName: selfPureName,
          operatorName,
          receiver: {
            name: '张测试',
            phone: '13800138000',
            address: '上海市浦东新区世纪大道100号',
          },
          items: [
            {
              orderNo: ownOrderNo,
              productName: '手工创建测试礼品',
              quantity: 2,
              extFields: {
                ext_field_1: '手工创建-EXT',
              },
            },
          ],
        }),
      })
    );

    const payload = await readJson<ApiEnvelope<Array<Row>>>(response);
    assert(response.status === 200, `预期 200，实际 ${response.status}`);
    assert(payload.success, `POST 返回失败: ${payload.error}`);
    assert(Array.isArray(payload.data) && payload.data.length === 1, 'POST 未创建出 1 条订单');

    ownOrderId = String(payload.data[0].id);
    assert(payload.data[0].source === 'ai_parse', `预期 source=ai_parse，实际 ${payload.data[0].source}`);
    assert(payload.data[0].status === 'pending', `预期 status=pending，实际 ${payload.data[0].status}`);

    const getResponse = await route.GET(
      createRequest(`http://local.test/api/orders?customerCode=${selfCustomer.code}&search=${ownOrderNo}`, {
        headers: adminHeaders,
      })
    );
    const getPayload = await readJson<ApiEnvelope<OrderListItem[]>>(getResponse);
    const order = getPayload.data?.find((item) => item.orderNo === ownOrderNo);

    assert(order, `GET 未查到订单 ${ownOrderNo}`);
    assert(order.customerCode === selfCustomer.code, 'GET 返回 customerCode 不匹配');
    assert(order.receiver?.name === '张测试', `receiver.name 不匹配: ${order.receiver?.name}`);
    assert(order.items?.[0]?.productName === '手工创建测试礼品', 'items[0].productName 不匹配');
    assert(order.items?.[0]?.quantity === 2, `items[0].quantity 不匹配: ${order.items?.[0]?.quantity}`);
    assert(order.extFields?.ext_field_1 === '手工创建-EXT', 'ext_field_1 未透出');
  });

  await runCase('准备 GET/PATCH 用订单', async () => {
    const inputs = [
      {
        customerCode: otherCustomer.code,
        customerName: otherCustomer.name,
        salespersonName: otherPureName,
        operatorName,
        orderNo: otherOrderNo,
        receiverName: '李测试',
      },
      {
        customerCode: selfCustomer.code,
        customerName: selfCustomer.name,
        salespersonName: selfPureName,
        operatorName,
        orderNo: patchAnchorOrderNo,
        receiverName: '王测试',
      },
      {
        customerCode: selfCustomer.code,
        customerName: selfCustomer.name,
        salespersonName: selfPureName,
        operatorName,
        orderNo: patchTargetOrderNo,
        receiverName: '赵测试',
      },
    ];

    for (const input of inputs) {
      const response = await route.POST(
        createRequest('http://local.test/api/orders', {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({
            customerCode: input.customerCode,
            customerName: input.customerName,
            salespersonName: input.salespersonName,
            operatorName: input.operatorName,
            receiver: {
              name: input.receiverName,
              phone: '13800138099',
              address: '上海市闵行区都市路500号',
            },
            items: [
              {
                orderNo: input.orderNo,
                productName: `${input.orderNo}-礼品`,
                quantity: 1,
              },
            ],
          }),
        })
      );

      const payload = await readJson<ApiEnvelope<Array<Row>>>(response);
      assert(response.status === 200 && payload.success, `准备订单失败: ${input.orderNo}`);
      const id = String(payload.data?.[0]?.id);

      if (input.orderNo === otherOrderNo) otherOrderId = id;
      if (input.orderNo === patchAnchorOrderNo) patchAnchorOrderId = id;
      if (input.orderNo === patchTargetOrderNo) patchTargetOrderId = id;
    }

    assert(ownOrderId && otherOrderId && patchAnchorOrderId && patchTargetOrderId, '订单准备不完整');
  });

  await runCase('GET dataScope=self 仅返回本人负责订单', async () => {
    const response = await route.GET(
      createRequest('http://local.test/api/orders', {
        headers: selfHeaders,
      })
    );
    const payload = await readJson<ApiEnvelope<OrderListItem[]>>(response);
    const orderNos = new Set((payload.data || []).map((item) => item.orderNo));

    assert(response.status === 200, `预期 200，实际 ${response.status}`);
    assert(payload.success, `GET 返回失败: ${payload.error}`);
    assert(orderNos.has(ownOrderNo), `self 用户看不到自己的订单 ${ownOrderNo}`);
    assert(orderNos.has(patchAnchorOrderNo), `self 用户看不到自己的订单 ${patchAnchorOrderNo}`);
    assert(orderNos.has(patchTargetOrderNo), `self 用户看不到自己的订单 ${patchTargetOrderNo}`);
    assert(!orderNos.has(otherOrderNo), `self 用户不应看到他人订单 ${otherOrderNo}`);
  });

  await runCase('PATCH 仅传 query id 会失败', async () => {
    const response = await route.PATCH(
      createRequest(`http://local.test/api/orders?id=${patchTargetOrderId}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          status: 'assigned',
        }),
      })
    );
    const payload = await readJson<ApiEnvelope<Row>>(response);

    assert(response.status === 400, `预期 400，实际 ${response.status}`);
    assert(payload.success === false, '预期 success=false');
    assert(payload.error === '订单ID不能为空', `错误信息异常: ${payload.error}`);
  });

  await runCase('PATCH query/body id 漂移时以 body id 为准', async () => {
    const response = await route.PATCH(
      createRequest(`http://local.test/api/orders?id=${patchAnchorOrderId}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          id: patchTargetOrderId,
          status: 'completed',
          expressCompany: '顺丰',
          trackingNo: `TRACK-${token}`,
          receiver: {
            name: '赵更新',
          },
        }),
      })
    );
    const payload = await readJson<ApiEnvelope<Row>>(response);

    assert(response.status === 200, `预期 200，实际 ${response.status}`);
    assert(payload.success, `PATCH 返回失败: ${payload.error}`);
    assert(payload.data?.id === patchTargetOrderId, 'PATCH 更新的不是 body.id 对应订单');

    const verifyResponse = await route.GET(
      createRequest(`http://local.test/api/orders?customerCode=${selfCustomer.code}`, {
        headers: adminHeaders,
      })
    );
    const verifyPayload = await readJson<ApiEnvelope<OrderListItem[]>>(verifyResponse);
    const target = verifyPayload.data?.find((item) => item.orderNo === patchTargetOrderNo);
    const anchor = verifyPayload.data?.find((item) => item.orderNo === patchAnchorOrderNo);

    assert(target, `未查询到目标订单 ${patchTargetOrderNo}`);
    assert(anchor, `未查询到锚点订单 ${patchAnchorOrderNo}`);
    assert(target.status === 'completed', `目标订单状态未更新，实际 ${target.status}`);
    assert(target.receiver?.name === '赵更新', `目标订单收货人未更新，实际 ${target.receiver?.name}`);
    assert(anchor.status === 'pending', `锚点订单不应被更新，实际 ${anchor.status}`);
  });

  if (process.exitCode && process.exitCode !== 0) {
    console.error('API orders validation finished with failures.');
    return;
  }

  console.log('Validated /api/orders contract via route-module integration with in-memory DB seed.');
}

main().catch((error) => {
  console.error('Failed to validate /api/orders contract:', error);
  process.exitCode = 1;
});
