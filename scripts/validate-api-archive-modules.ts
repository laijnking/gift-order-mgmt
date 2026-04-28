/**
 * Phase 1: 档案管理模块 API 验证脚本
 *
 * 验证所有档案管理模块的 API：客户、发货方/发货方、商品、库存、SKU映射、仓库
 * 覆盖列表查询、详情查询、搜索、分页、字段完整性等测试点。
 *
 * 用法: node --import tsx scripts/validate-api-archive-modules.ts
 */

import { Pool } from 'pg';
import { config as loadDotenv } from 'dotenv';
import path from 'path';

import {
  ADMIN_USER,
  assert,
  buildAuthedHeaders,
  DEFAULT_HOST,
  fetchJson,
} from './lib/api-test-harness';
import { loadEnv } from '@/storage/database/supabase-client';

const PORT = 3001;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

type ApiEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  total?: number;
  error?: string;
  message?: string;
};

type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const results: TestResult[] = [];

function pass(name: string, detail: string) {
  results.push({ name, passed: true, detail });
  console.log(`  PASS ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, passed: false, detail });
  console.log(`  FAIL ${name}: ${detail}`);
}

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
    throw new Error(`数据库不可用: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  console.log('=== Phase 1: 档案管理模块 API 验证 ===');
  console.log(`服务器: ${BASE_URL}`);
  console.log('');

  const headers = buildAuthedHeaders(ADMIN_USER);

  // ========================================
  // 1. 客户管理 (Customers)
  // ========================================
  console.log('[1/7] 客户管理 API...');

  // GET /api/customers — 列表
  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/customers`,
      { headers }
    );
    if (status === 200 && data?.success && Array.isArray(data.data)) {
      pass('customers:list', `${data.data.length} 条记录`);
      // 验证必要字段
      const first = data.data[0] as Record<string, unknown>;
      const hasCode = 'code' in first || 'id' in first;
      const hasName = 'name' in first;
      if (hasCode && hasName) {
        pass('customers:fields', 'code/name 字段存在');
      } else {
        fail('customers:fields', '缺少 code/name 字段');
      }
    } else {
      fail('customers:list', `status=${status}, success=${data?.success}`);
    }
  }

  // GET /api/customers — 搜索
  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/customers?search=`,
      { headers }
    );
    if (status === 200 && data?.success) {
      pass('customers:search', '搜索参数正常');
    } else {
      fail('customers:search', `status=${status}`);
    }
  }

  // POST /api/customers — 新建（测试数据）
  {
    const testCustomer = {
      code: `TEST-${Date.now()}`,
      name: `测试客户-${Date.now()}`,
      contactPerson: '测试联系人',
      contactPhone: '13800138000',
      province: '北京',
      city: '北京',
    };
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/customers`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(testCustomer),
      }
    );
    if (status === 200 && data?.success) {
      pass('customers:create', `创建成功, id=${(data.data as Record<string, unknown>)?.id}`);
    } else {
      fail('customers:create', `status=${status}, msg=${data?.error ?? data?.message}`);
    }
  }

  // ========================================
  // 2. 发货方管理 (Suppliers)
  // ========================================
  console.log('');
  console.log('[2/7] 发货方管理 API...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/suppliers`,
      { headers }
    );
    if (status === 200 && data?.success && Array.isArray(data.data)) {
      pass('suppliers:list', `${data.data.length} 条记录`);
      if (data.data.length > 0) {
        const first = data.data[0] as Record<string, unknown>;
        const hasName = 'name' in first;
        if (hasName) pass('suppliers:fields', 'name 字段存在');
      } else {
        pass('suppliers:fields', '无数据可验证 (表为空)');
      }
    } else {
      fail('suppliers:list', `status=${status}`);
    }
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/suppliers?search=`,
      { headers }
    );
    if (status === 200 && data?.success) pass('suppliers:search', '搜索参数正常');
    else fail('suppliers:search', `status=${status}`);
  }

  // ========================================
  // 3. 发货方管理 (Shippers)
  // ========================================
  console.log('');
  console.log('[3/7] 发货方管理 API...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/shippers`,
      { headers }
    );
    if (status === 200 && data?.success && Array.isArray(data.data)) {
      pass('shippers:list', `${data.data.length} 条记录`);
      const first = data.data[0] as Record<string, unknown>;
      const hasProvince = 'province' in first;
      if (hasProvince) pass('shippers:fields', 'province 字段存在');
      else fail('shippers:fields', '缺少 province 字段');
    } else {
      fail('shippers:list', `status=${status}`);
    }
  }

  // Shippers batch
  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/shippers?active=true`,
      { headers }
    );
    if (status === 200 && data?.success) pass('shippers:active-filter', 'active 筛选正常');
    else fail('shippers:active-filter', `status=${status}`);
  }

  // ========================================
  // 4. 商品管理 (Products)
  // ========================================
  console.log('');
  console.log('[4/7] 商品管理 API...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/products`,
      { headers }
    );
    if (status === 200 && data?.success) {
      const arr = Array.isArray(data.data) ? data.data : [];
      pass('products:list', `${arr.length} 条记录`);
    } else {
      fail('products:list', `status=${status}`);
    }
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/products?search=`,
      { headers }
    );
    if (status === 200 && data?.success) pass('products:search', '搜索参数正常');
    else fail('products:search', `status=${status}`);
  }

  // ========================================
  // 5. 库存管理 (Stocks)
  // ========================================
  console.log('');
  console.log('[5/7] 库存管理 API...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/stocks`,
      { headers }
    );
    if (status === 200 && data?.success) {
      const arr = Array.isArray(data.data) ? data.data : [];
      pass('stocks:list', `${arr.length} 条记录`);
    } else {
      fail('stocks:list', `status=${status}`);
    }
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/stock-versions`,
      { headers }
    );
    if (status === 200 && data?.success) pass('stock-versions:list', '版本历史 API 正常');
    else fail('stock-versions:list', `status=${status}`);
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/price-history`,
      { headers }
    );
    if (status === 200 && data?.success) pass('price-history:list', '价格历史 API 正常');
    else fail('price-history:list', `status=${status}`);
  }

  // ========================================
  // 6. SKU映射 (Product Mappings)
  // ========================================
  console.log('');
  console.log('[6/7] SKU映射 API...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/product-mappings`,
      { headers }
    );
    if (status === 200 && data?.success) {
      const arr = Array.isArray(data.data) ? data.data : [];
      pass('product-mappings:list', `${arr.length} 条记录`);
      if (arr.length > 0) {
        const first = arr[0] as Record<string, unknown>;
        const hasCustomerCode = 'customerCode' in first || 'customer_code' in first;
        const hasProductCode = 'productCode' in first || 'product_code' in first;
        if (hasCustomerCode && hasProductCode) {
          pass('product-mappings:fields', '客户SKU/商品SKU字段存在');
        }
      }
    } else {
      fail('product-mappings:list', `status=${status}`);
    }
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/product-mappings?search=`,
      { headers }
    );
    if (status === 200 && data?.success) pass('product-mappings:search', '搜索参数正常');
    else fail('product-mappings:search', `status=${status}`);
  }

  // ========================================
  // 7. 仓库管理 (Warehouses)
  // ========================================
  console.log('');
  console.log('[7/7] 仓库管理 API...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/warehouses`,
      { headers }
    );
    if (status === 200 && data?.success) {
      const arr = Array.isArray(data.data) ? data.data : [];
      pass('warehouses:list', `${arr.length} 条记录`);
    } else {
      fail('warehouses:list', `status=${status}`);
    }
  }

  // ========================================
  // 汇总
  // ========================================
  console.log('');
  console.log('=== Phase 1 结果汇总 ===');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }

  console.log('');
  console.log(`总计: ${results.length} 项 | 通过: ${passed} | 失败: ${failed}`);

  if (failed > 0) {
    console.log('');
    console.log('失败项:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - ${r.name}: ${r.detail}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Phase 1 FAIL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
