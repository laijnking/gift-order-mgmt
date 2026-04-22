import { Pool, QueryResult, QueryResultRow } from 'pg';
import type { SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

let envLoaded = false;
let pgPool: Pool | null = null;

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

type QueryOperator = '=' | '<>' | 'ILIKE' | '>' | '>=' | '<' | '<=' | 'IS' | 'IS NOT' | 'IN';

interface QueryCondition {
  column: string;
  operator: QueryOperator;
  value: unknown;
}

interface OrCondition {
  conditions: QueryCondition[];
}

interface SelectOptions {
  count?: 'exact';
  head?: boolean;
}

interface QueryResponse<T = Record<string, unknown>> {
  data: T[] | T | null;
  error: Error | null;
  count?: number | null;
}

function assertIdentifier(identifier: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function normalizeValue(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    const isPrimitiveArray = value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item));
    return isPrimitiveArray ? value : JSON.stringify(value);
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined)
  );
}

function sanitizeSelect(select?: string): string {
  if (!select || select.trim() === '*') {
    return '*';
  }

  // Relationship selects such as "*, alert_rules(name, code)" require
  // PostgREST. For the local PostgreSQL adapter we return the base row and
  // let existing callers tolerate the missing nested relation fields.
  if (select.includes('(') || select.includes(')')) {
    return '*';
  }

  return select
    .split(',')
    .map((column) => assertIdentifier(column.trim()))
    .join(', ');
}

function normalizeDbValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeDbValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        normalizeDbValue(nestedValue),
      ])
    );
  }

  if (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  return value;
}

function normalizeDbRows<T>(rows: T[]): T[] {
  return rows.map((row) => normalizeDbValue(row) as T);
}

function buildConditionSql(
  condition: QueryCondition,
  params: unknown[],
  tableName?: string
): string {
  const column = tableName
    ? `${assertIdentifier(tableName)}.${assertIdentifier(condition.column)}`
    : assertIdentifier(condition.column);

  if (condition.operator === 'IN') {
    const values = Array.isArray(condition.value) ? condition.value : [];
    if (values.length === 0) {
      return 'FALSE';
    }
    const placeholders = values.map((value) => {
      params.push(normalizeValue(value));
      return `$${params.length}`;
    });
    return `${column} IN (${placeholders.join(', ')})`;
  }

  if (condition.operator === 'IS' || condition.operator === 'IS NOT') {
    if (condition.value === null) {
      return `${column} ${condition.operator} NULL`;
    }
    if (typeof condition.value === 'boolean') {
      return `${column} ${condition.operator} ${condition.value ? 'TRUE' : 'FALSE'}`;
    }
  }

  params.push(normalizeValue(condition.value));
  return `${column} ${condition.operator} $${params.length}`;
}

function parseOrExpression(expression: string): OrCondition {
  const conditions = expression
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [column, operator, ...rest] = part.split('.');
      const value = rest.join('.');

      switch (operator) {
        case 'eq':
          return { column, operator: '=' as const, value };
        case 'neq':
          return { column, operator: '<>' as const, value };
        case 'ilike':
          return { column, operator: 'ILIKE' as const, value };
        case 'gt':
          return { column, operator: '>' as const, value };
        case 'gte':
          return { column, operator: '>=' as const, value };
        case 'lt':
          return { column, operator: '<' as const, value };
        case 'lte':
          return { column, operator: '<=' as const, value };
        case 'is':
          return { column, operator: 'IS' as const, value: value === 'null' ? null : value };
        default:
          throw new Error(`Unsupported OR operator: ${operator}`);
      }
    });

  return { conditions };
}

class LocalSupabaseQuery<T = Record<string, unknown>> implements PromiseLike<QueryResponse<T>> {
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectColumns = '*';
  private selectOptions: SelectOptions = {};
  private conditions: QueryCondition[] = [];
  private orGroups: OrCondition[] = [];
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitCount?: number;
  private offsetCount?: number;
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private mutationData: Record<string, unknown>[] = [];
  private upsertConflictColumns: string[] = [];

  constructor(private readonly tableName: string) {}

  select(columns = '*', options: SelectOptions = {}): this {
    this.selectColumns = columns;
    this.selectOptions = options;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = 'insert';
    this.mutationData = (Array.isArray(data) ? data : [data]).map(sanitizeRow);
    return this;
  }

  update(data: Record<string, unknown>): this {
    this.operation = 'update';
    this.mutationData = [sanitizeRow(data)];
    return this;
  }

  upsert(
    data: Record<string, unknown> | Record<string, unknown>[],
    options: { onConflict?: string } = {}
  ): this {
    this.operation = 'upsert';
    this.mutationData = (Array.isArray(data) ? data : [data]).map(sanitizeRow);
    this.upsertConflictColumns = (options.onConflict || 'id')
      .split(',')
      .map((column) => column.trim())
      .filter(Boolean);
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown): this {
    this.conditions.push({ column, operator: '=', value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.conditions.push({ column, operator: '<>', value });
    return this;
  }

  ilike(column: string, value: string): this {
    this.conditions.push({ column, operator: 'ILIKE', value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.conditions.push({ column, operator: '>', value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.conditions.push({ column, operator: '>=', value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.conditions.push({ column, operator: '<', value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.conditions.push({ column, operator: '<=', value });
    return this;
  }

  is(column: string, value: unknown): this {
    this.conditions.push({ column, operator: 'IS', value });
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    if (operator === 'is') {
      this.conditions.push({ column, operator: 'IS NOT', value });
      return this;
    }
    if (operator === 'eq') {
      this.conditions.push({ column, operator: '<>', value });
      return this;
    }
    throw new Error(`Unsupported NOT operator: ${operator}`);
  }

  in(column: string, values: unknown[]): this {
    this.conditions.push({ column, operator: 'IN', value: values });
    return this;
  }

  or(expression: string): this {
    this.orGroups.push(parseOrExpression(expression));
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    this.orderBy.push({ column, ascending: options.ascending !== false });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = Math.max(0, to - from + 1);
    return this;
  }

  single(): this {
    this.singleMode = 'single';
    this.limitCount = this.limitCount ?? 1;
    return this;
  }

  maybeSingle(): this {
    this.singleMode = 'maybeSingle';
    this.limitCount = this.limitCount ?? 1;
    return this;
  }

  returns(): this {
    return this;
  }

  then<TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResponse<T>> {
    try {
      switch (this.operation) {
        case 'select':
          return await this.executeSelect();
        case 'insert':
          return await this.executeInsert();
        case 'update':
          return await this.executeUpdate();
        case 'delete':
          return await this.executeDelete();
        case 'upsert':
          return await this.executeUpsert();
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        count: null,
      };
    }
  }

  private buildWhereClause(params: unknown[], tableName?: string): string {
    const parts = this.conditions.map((condition) => buildConditionSql(condition, params, tableName));

    for (const group of this.orGroups) {
      const orSql = group.conditions.map((condition) => buildConditionSql(condition, params, tableName));
      if (orSql.length > 0) {
        parts.push(`(${orSql.join(' OR ')})`);
      }
    }

    return parts.length > 0 ? ` WHERE ${parts.join(' AND ')}` : '';
  }

  private applyResultShape(rows: T[], count?: number | null): QueryResponse<T> {
    if (this.selectOptions.head) {
      return { data: null, error: null, count: count ?? null };
    }

    if (this.singleMode) {
      const row = rows[0] ?? null;
      if (this.singleMode === 'single' && !row) {
        return { data: null, error: new Error('No rows returned'), count: count ?? null };
      }
      return { data: row, error: null, count: count ?? null };
    }

    return { data: rows, error: null, count: count ?? null };
  }

  private async executeSelect(): Promise<QueryResponse<T>> {
    const pool = getPgPool();
    const params: unknown[] = [];
    let sql = `SELECT ${sanitizeSelect(this.selectColumns)} FROM ${assertIdentifier(this.tableName)}`;
    sql += this.buildWhereClause(params, this.tableName);

    const count = this.selectOptions.count ? await this.executeCount() : null;

    if (this.selectOptions.head) {
      return { data: null, error: null, count };
    }

    if (this.orderBy.length > 0) {
      sql += ` ORDER BY ${this.orderBy
        .map((order) => `${assertIdentifier(order.column)} ${order.ascending ? 'ASC' : 'DESC'}`)
        .join(', ')}`;
    }

    if (this.limitCount !== undefined) {
      params.push(this.limitCount);
      sql += ` LIMIT $${params.length}`;
    }

    if (this.offsetCount !== undefined) {
      params.push(this.offsetCount);
      sql += ` OFFSET $${params.length}`;
    }

    const result: QueryResult<T & QueryResultRow> = await pool.query(sql, params);
    return this.applyResultShape(normalizeDbRows(result.rows as T[]), count);
  }

  private async executeCount(): Promise<number> {
    const pool = getPgPool();
    const params: unknown[] = [];
    let sql = `SELECT COUNT(*)::int AS count FROM ${assertIdentifier(this.tableName)}`;
    sql += this.buildWhereClause(params, this.tableName);
    const result = await pool.query<{ count: number }>(sql, params);
    return Number(result.rows[0]?.count || 0);
  }

  private async executeInsert(): Promise<QueryResponse<T>> {
    if (this.mutationData.length === 0) {
      return this.applyResultShape([]);
    }

    const pool = getPgPool();
    const params: unknown[] = [];
    const keys = Object.keys(this.mutationData[0]);
    const valuesSql = this.mutationData.map((row) => {
      const placeholders = keys.map((key) => {
        params.push(normalizeValue(row[key]));
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });

    const sql = [
      `INSERT INTO ${assertIdentifier(this.tableName)} (${keys.map(assertIdentifier).join(', ')})`,
      `VALUES ${valuesSql.join(', ')}`,
      `RETURNING ${sanitizeSelect(this.selectColumns)}`,
    ].join(' ');

    const result: QueryResult<T & QueryResultRow> = await pool.query(sql, params);
    return this.applyResultShape(normalizeDbRows(result.rows as T[]));
  }

  private async executeUpdate(): Promise<QueryResponse<T>> {
    const row = this.mutationData[0] || {};
    const keys = Object.keys(row);
    if (keys.length === 0) {
      return this.applyResultShape([]);
    }

    const pool = getPgPool();
    const params: unknown[] = [];
    const setSql = keys.map((key) => {
      params.push(normalizeValue(row[key]));
      return `${assertIdentifier(key)} = $${params.length}`;
    });

    let sql = `UPDATE ${assertIdentifier(this.tableName)} SET ${setSql.join(', ')}`;
    sql += this.buildWhereClause(params);
    sql += ` RETURNING ${sanitizeSelect(this.selectColumns)}`;

    const result: QueryResult<T & QueryResultRow> = await pool.query(sql, params);
    return this.applyResultShape(normalizeDbRows(result.rows as T[]));
  }

  private async executeDelete(): Promise<QueryResponse<T>> {
    const pool = getPgPool();
    const params: unknown[] = [];
    let sql = `DELETE FROM ${assertIdentifier(this.tableName)}`;
    sql += this.buildWhereClause(params);
    sql += ` RETURNING ${sanitizeSelect(this.selectColumns)}`;
    const result: QueryResult<T & QueryResultRow> = await pool.query(sql, params);
    return this.applyResultShape(normalizeDbRows(result.rows as T[]));
  }

  private async executeUpsert(): Promise<QueryResponse<T>> {
    if (this.mutationData.length === 0) {
      return this.applyResultShape([]);
    }

    const pool = getPgPool();
    const params: unknown[] = [];
    const keys = Object.keys(this.mutationData[0]);
    const valuesSql = this.mutationData.map((row) => {
      const placeholders = keys.map((key) => {
        params.push(normalizeValue(row[key]));
        return `$${params.length}`;
      });
      return `(${placeholders.join(', ')})`;
    });
    const conflictColumns = this.upsertConflictColumns.length > 0 ? this.upsertConflictColumns : ['id'];
    const updateColumns = keys.filter((key) => !conflictColumns.includes(key));
    const updateSql = updateColumns.length > 0
      ? `DO UPDATE SET ${updateColumns
        .map((key) => `${assertIdentifier(key)} = EXCLUDED.${assertIdentifier(key)}`)
        .join(', ')}`
      : 'DO NOTHING';

    const sql = [
      `INSERT INTO ${assertIdentifier(this.tableName)} (${keys.map(assertIdentifier).join(', ')})`,
      `VALUES ${valuesSql.join(', ')}`,
      `ON CONFLICT (${conflictColumns.map(assertIdentifier).join(', ')}) ${updateSql}`,
      `RETURNING ${sanitizeSelect(this.selectColumns)}`,
    ].join(' ');

    const result: QueryResult<T & QueryResultRow> = await pool.query(sql, params);
    return this.applyResultShape(normalizeDbRows(result.rows as T[]));
  }
}

class LocalSupabaseClient {
  from<T = Record<string, unknown>>(tableName: string): LocalSupabaseQuery<T> {
    return new LocalSupabaseQuery<T>(tableName);
  }
}

function loadEnv(): void {
  if (envLoaded) {
    return;
  }

  if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
    envLoaded = true;
    return;
  }

  try {
    try {
      require('dotenv').config();
      if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
        envLoaded = true;
        return;
      }
    } catch {
      // dotenv not available
    }

    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }

    envLoaded = true;
  } catch {
    // Silently fail
  }
}

function getPgPool(): Pool {
  if (!pgPool) {
    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_DB_URL or DATABASE_URL is not set');
    }
    pgPool = new Pool({
      connectionString: dbUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pgPool;
}

export function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL || 'http://localhost:3000';
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY || 'local-anon-key';

  return { url, anonKey };
}

export function getSupabaseServiceRoleKey(): string | undefined {
  loadEnv();
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}

// Direct PostgreSQL query helper - replaces Supabase client for database operations
export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  tableName: string,
  options?: {
    select?: string;
    where?: Record<string, unknown>;
    order?: string;
    limit?: number;
    range?: [number, number];
  }
): Promise<{ data: T[]; error: null } | { data: null; error: Error }> {
  try {
    const pool = getPgPool();
    const { select = '*', where, order, limit, range } = options || {};

    let sql = `SELECT ${select} FROM ${tableName}`;
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (where) {
      const entries = Object.entries(where);
      entries.forEach(([key, value], index) => {
        conditions.push(`${key} = $${index + 1}`);
        params.push(value);
      });
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    if (order) {
      sql += ` ORDER BY ${order}`;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    if (range) {
      sql += ` OFFSET ${range[0]} LIMIT ${range[1] - range[0] + 1}`;
    }

    const result: QueryResult<T> = await pool.query(sql, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Insert helper
export async function pgInsert<T extends QueryResultRow = QueryResultRow>(
  tableName: string,
  data: Record<string, unknown>
): Promise<{ data: T[]; error: null } | { data: null; error: Error }> {
  try {
    const pool = getPgPool();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const paramPlaceholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${paramPlaceholders}) RETURNING *`;
    const result: QueryResult<T> = await pool.query(sql, values);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Update helper
export async function pgUpdate<T extends QueryResultRow = QueryResultRow>(
  tableName: string,
  data: Record<string, unknown>,
  where: Record<string, unknown>
): Promise<{ data: T[]; error: null } | { data: null; error: Error }> {
  try {
    const pool = getPgPool();
    const setEntries = Object.entries(data);
    const whereEntries = Object.entries(where);

    const setClause = setEntries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const whereClause = whereEntries.map(([key], i) => `${key} = $${setEntries.length + i + 1}`).join(' AND ');

    const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const params = [...Object.values(data), ...Object.values(where)];

    const result: QueryResult<T> = await pool.query(sql, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Delete helper
export async function pgDelete<T extends QueryResultRow = QueryResultRow>(
  tableName: string,
  where: Record<string, unknown>
): Promise<{ data: T[]; error: null } | { data: null; error: Error }> {
  try {
    const pool = getPgPool();
    const whereEntries = Object.entries(where);
    const whereClause = whereEntries.map(([key], i) => `${key} = $${i + 1}`).join(' AND ');
    const sql = `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`;
    const params = Object.values(where);

    const result: QueryResult<T> = await pool.query(sql, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

// Local PostgreSQL-backed adapter that supports the Supabase query-builder
// subset used by the API routes. This keeps the route code stable while the
// Docker deployment runs without a PostgREST/Supabase service.
export function getSupabaseClient(_token?: string): SupabaseClient {
  loadEnv();
  return new LocalSupabaseClient() as unknown as SupabaseClient;
}

export { loadEnv };
