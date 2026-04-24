/**
 * Phase 0: 数据快照验证脚本
 *
 * 验证系统基础档案数据的完整性，记录初始数据快照。
 * 假设开发服务器已在 3001 端口运行。
 *
 * 用法: node --import tsx scripts/validate-data-snapshot.ts
 */

import path from 'path';
import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

import {
  ADMIN_USER,
  DEFAULT_HOST,
  buildAuthedHeaders,
  fetchJson,
} from './lib/api-test-harness';
import { loadEnv } from '@/storage/database/supabase-client';

const PORT = 3001;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

type TableStats = {
  name: string;
  count: number;
  fields: Record<string, unknown>;
};

const snapshot: {
  timestamp: string;
  tables: TableStats[];
  apiHealth: Record<string, { success: boolean; total: number }>;
} = {
  timestamp: new Date().toISOString(),
  tables: [],
  apiHealth: {},
};

function getPool() {
  loadEnv();
  if (!process.env.NEXT_PUBLIC_SUPABASE_DB_URL && !process.env.DATABASE_URL) {
    loadDotenv({ path: path.join(process.cwd(), '.env.docker') });
  }
  const connectionString = process.env.NEXT_PUBLIC_SUPABASE_DB_URL || process.env.DATABASE_URL;
  const isPlaceholder =
    !connectionString ||
    connectionString.includes('your-password') ||
    connectionString.includes('localhost:5432/postgres');
  const resolved = isPlaceholder ? DEFAULT_DATABASE_URL : connectionString;
  process.env.DATABASE_URL = resolved;
  process.env.NEXT_PUBLIC_SUPABASE_DB_URL = resolved;
  return new Pool({ connectionString: resolved, max: 4, idleTimeoutMillis: 5000, connectionTimeoutMillis: 5000 });
}

async function assertDatabaseReady(pool: Pool) {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    throw new Error(
      `数据库不可用: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function queryCount(pool: Pool, table: string): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*) as cnt FROM ${table}`);
  return parseInt(String(result.rows[0]?.cnt ?? 0), 10);
}

async function querySample(pool: Pool, table: string, limit = 1): Promise<Record<string, unknown>[]> {
  const result = await pool.query(`SELECT * FROM ${table} LIMIT ${limit}`);
  return result.rows;
}

async function checkTable(pool: Pool, name: string, minExpected = 0): Promise<TableStats> {
  const count = await queryCount(pool, name);
  const fields: Record<string, unknown> = {};
  if (count > 0) {
    const samples = await querySample(pool, name, 1);
    if (samples.length > 0) {
      for (const key of Object.keys(samples[0])) {
        fields[key] = typeof samples[0][key];
      }
    }
  }
  const ok = count >= minExpected;
  if (!ok) {
    console.log(`  WARN ${name}: ${count} 条 (期望 >= ${minExpected})`);
  } else {
    console.log(`  OK   ${name}: ${count} 条`);
  }
  return { name, count, fields };
}

async function checkApiHealth(endpoint: string, label: string) {
  try {
    const { status, data } = await fetchJson<{ success: boolean; total?: number; data?: unknown }>(
      `${BASE_URL}${endpoint}`,
      { headers: buildAuthedHeaders(ADMIN_USER) }
    );
    const ok = status === 200 && (data as { success: boolean })?.success === true;
    const total = (data as { total?: number })?.total ?? 0;
    if (ok) {
      console.log(`  OK   API ${label}: ${status} (total=${total})`);
    } else {
      console.log(`  FAIL API ${label}: ${status}`);
    }
    snapshot.apiHealth[label] = { success: ok, total };
  } catch (err) {
    console.log(`  FAIL API ${label}: ${err instanceof Error ? err.message : String(err)}`);
    snapshot.apiHealth[label] = { success: false, total: 0 };
  }
}

async function main() {
  console.log('=== Phase 0: 数据快照验证 ===');
  console.log(`时间: ${snapshot.timestamp}`);
  console.log(`服务器: ${BASE_URL}`);
  console.log('');

  // 1. 数据库连接
  console.log('[1/3] 验证数据库连接...');
  const pool = getPool();
  await assertDatabaseReady(pool);
  console.log('数据库连接正常');

  // 2. 基础档案数据快照
  console.log('');
  console.log('[2/3] 档案数据快照...');
  const tableNames = [
    { name: 'users', min: 1 },
    { name: 'customers', min: 1 },
    { name: 'suppliers', min: 1 },
    { name: 'shippers', min: 1 },
    { name: 'products', min: 1 },
    { name: 'stocks', min: 1 },
    { name: 'product_mappings', min: 1 },
    { name: 'warehouses', min: 1 },
    { name: 'orders', min: 0 },
    { name: 'roles', min: 1 },
    { name: 'permissions', min: 1 },
    { name: 'templates', min: 1 },
    { name: 'alert_rules', min: 0 },
    { name: 'export_records', min: 0 },
    { name: 'return_receipts', min: 0 },
  ];

  for (const { name, min } of tableNames) {
    const stats = await checkTable(pool, name, min);
    snapshot.tables.push(stats);
  }

  // 3. API 健康检查
  console.log('');
  console.log('[3/3] API 健康检查...');
  const apiChecks = [
    { endpoint: '/api/customers', label: 'customers' },
    { endpoint: '/api/suppliers', label: 'suppliers' },
    { endpoint: '/api/products', label: 'products' },
    { endpoint: '/api/stocks', label: 'stocks' },
    { endpoint: '/api/product-mappings', label: 'product-mappings' },
    { endpoint: '/api/shippers', label: 'shippers' },
    { endpoint: '/api/warehouses', label: 'warehouses' },
    { endpoint: '/api/users', label: 'users' },
    { endpoint: '/api/roles', label: 'roles' },
    { endpoint: '/api/templates', label: 'templates' },
    { endpoint: '/api/orders', label: 'orders' },
    { endpoint: '/api/reports/stats', label: 'reports/stats' },
    { endpoint: '/api/alert-rules', label: 'alert-rules' },
  ];

  for (const check of apiChecks) {
    await checkApiHealth(check.endpoint, check.label);
  }

  // 清理
  await pool.end();

  // 汇总
  console.log('');
  console.log('=== 快照汇总 ===');
  const failedTables = snapshot.tables.filter((t) => t.count === 0 && t.name !== 'orders');
  const failedApis = Object.entries(snapshot.apiHealth)
    .filter(([, v]) => !v.success)
    .map(([k]) => k);

  console.log('');
  if (failedTables.length === 0 && failedApis.length === 0) {
    console.log('Phase 0 PASS: 所有基础数据正常');
    process.exit(0);
  } else {
    if (failedTables.length > 0) {
      console.log(`WARN: ${failedTables.length} 个表无数据: ${failedTables.map((t) => t.name).join(', ')}`);
    }
    if (failedApis.length > 0) {
      console.log(`WARN: ${failedApis.length} 个 API 失败: ${failedApis.join(', ')}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Phase 0 FAIL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
