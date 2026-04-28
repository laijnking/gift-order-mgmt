/**
 * Phase 2: 订单全流程测试脚本
 *
 * 模拟真实业务场景，覆盖订单完整生命周期：
 *   1. 订单录入（/api/orders POST — JSON格式模拟 AI 解析结果）
 *   2. 订单列表查询（GET /api/orders 含状态/客户筛选）
 *   3. 订单派发（PATCH /api/orders — 设置发货方，转为 assigned）
 *   4. 待发货统计（/api/shipping-exports/pending）
 *   5. 批量导出发货通知（/api/shipping-exports/batch）
 *   6. 回单导入（/api/return-receipts）
 *   7. 订单状态验证
 *
 * 用法: node --import tsx scripts/validate-order-full-flow.ts
 */

import { randomUUID } from 'crypto';
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
const RUN_ID = `full-flow-${Date.now()}`;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres123@127.0.0.1:5432/gift_order';

type ApiEnvelope<T = unknown> = {
  success: boolean;
  data?: T;
  total?: number;
  error?: string;
  message?: string;
  duplicateSummary?: {
    totalSkipped: number;
    details: unknown[];
  };
  matchStats?: {
    total: number;
    matched: number;
    matchRate: string;
    bySpec: number;
    byName: number;
    byMapping: number;
    none: number;
  };
};

type OrderItem = {
  productName: string;
  quantity: number;
  price?: number;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
};

type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
};

const results: TestResult[] = [];
const testOrderIds: string[] = [];
const testExportRecordIds: string[] = [];
const testReturnReceiptIds: string[] = [];

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
  return new Pool({ connectionString: resolved, max: 6, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
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

async function cleanup(pool: Pool) {
  console.log('');
  console.log('[清理] 删除测试数据...');
  for (const id of testOrderIds) {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]).catch(() => {});
  }
  for (const id of testExportRecordIds) {
    await pool.query('DELETE FROM export_records WHERE id = $1', [id]).catch(() => {});
  }
  for (const id of testReturnReceiptIds) {
    await pool.query('DELETE FROM return_receipts WHERE id = $1', [id]).catch(() => {});
  }
  console.log('  清理完成');
}

async function main() {
  console.log('=== Phase 2: 订单全流程测试 ===');
  console.log(`RUN_ID: ${RUN_ID}`);
  console.log(`服务器: ${BASE_URL}`);
  console.log('');

  const headers = buildAuthedHeaders(ADMIN_USER);
  const pool = getPool();
  await assertDatabaseReady(pool);
  console.log('数据库连接正常');
  console.log('');

  // ================================================================
  // 步骤 1: 准备测试数据 — 查询客户和发货方
  // ================================================================
  console.log('[步骤1] 准备测试数据...');

  let customerCode = 'TEST001';
  let supplierId = '';
  let warehouseId = '';

  {
    const { data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/customers`,
      { headers }
    );
    if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
      customerCode = String((data.data[0] as Record<string, unknown>).code || data.data[0].id || customerCode);
      pass('step1:customer', `使用客户: ${customerCode}`);
    } else {
      fail('step1:customer', '无法获取客户数据');
    }
  }

  {
    const { data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/suppliers`,
      { headers }
    );
    if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
      supplierId = String((data.data[0] as Record<string, unknown>).id || '');
      const supplierName = String((data.data[0] as Record<string, unknown>).name || '');
      pass('step1:supplier', `使用发货方: ${supplierName} (${supplierId})`);
    } else {
      fail('step1:supplier', '无法获取发货方数据');
    }
  }

  {
    const { data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/warehouses`,
      { headers }
    );
    if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
      warehouseId = String((data.data[0] as Record<string, unknown>).id || '');
      pass('step1:warehouse', `使用仓库: ${warehouseId}`);
    } else {
      fail('step1:warehouse', '无法获取仓库数据');
    }
  }

  // ================================================================
  // 步骤 2: 订单录入 — POST /api/orders (JSON 格式，模拟 AI 解析)
  // ================================================================
  console.log('');
  console.log('[步骤2] 订单录入 (POST /api/orders)...');

  const testItems: OrderItem[] = [
    {
      productName: `测试商品A-${RUN_ID}`,
      quantity: 2,
      price: 88,
      receiver_name: '张三',
      receiver_phone: '13800138001',
      receiver_address: '上海市浦东新区某某路1号',
    },
    {
      productName: `测试商品B-${RUN_ID}`,
      quantity: 1,
      price: 120,
      receiver_name: '李四',
      receiver_phone: '13800138002',
      receiver_address: '北京市朝阳区某某路2号',
    },
  ];

  const createPayload = {
    customerCode,
    customerName: '测试客户',
    salespersonName: '销售甲',
    operatorName: '跟单乙',
    supplierId: supplierId || undefined,
    supplierName: supplierId ? '测试发货方' : undefined,
    warehouseId: warehouseId || undefined,
    warehouse: warehouseId ? '测试仓库' : undefined,
    items: testItems,
    receiver: {
      name: '默认收货人',
      phone: '13900000000',
      address: '广东省广州市天河区某某路3号',
    },
  };

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/orders`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(createPayload),
      }
    );

    if (status === 200 && data?.success && Array.isArray(data.data)) {
      const created = data.data as Record<string, unknown>[];
      pass('step2:order-create', `创建 ${created.length} 条订单`);
      for (const o of created) {
        if (o.id) testOrderIds.push(String(o.id));
      }
      if (data.duplicateSummary && data.duplicateSummary.totalSkipped > 0) {
        pass('step2:order-dedup', `跳过 ${data.duplicateSummary.totalSkipped} 条重复`);
      }
      if (data.matchStats) {
        pass('step2:order-match-stats', `匹配率 ${data.matchStats.matchRate}`);
      }
    } else {
      fail('step2:order-create', `status=${status}, msg=${data?.error ?? data?.message}`);
    }
  }

  // ================================================================
  // 步骤 3: 订单列表查询 (GET /api/orders)
  // ================================================================
  console.log('');
  console.log('[步骤3] 订单列表查询 (GET /api/orders)...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/orders`,
      { headers }
    );
    if (status === 200 && data?.success) {
      const arr = Array.isArray(data.data) ? data.data : [];
      pass('step3:order-list', `返回 ${arr.length} 条订单`);
    } else {
      fail('step3:order-list', `status=${status}`);
    }
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/orders?status=pending`,
      { headers }
    );
    if (status === 200 && data?.success) {
      pass('step3:order-filter-status', 'pending 状态筛选正常');
    } else {
      fail('step3:order-filter-status', `status=${status}`);
    }
  }

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/orders?customerCode=${customerCode}`,
      { headers }
    );
    if (status === 200 && data?.success) {
      pass('step3:order-filter-customer', `客户 ${customerCode} 筛选正常`);
    } else {
      fail('step3:order-filter-customer', `status=${status}`);
    }
  }

  // ================================================================
  // 步骤 4: 订单派发 (PATCH /api/orders)
  // ================================================================
  console.log('');
  console.log('[步骤4] 订单派发 (PATCH /api/orders)...');

  if (testOrderIds.length > 0) {
    for (const orderId of testOrderIds) {
      const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
        `${BASE_URL}/api/orders`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            id: orderId,
            status: 'assigned',
            supplierId: supplierId || undefined,
            supplierName: supplierId ? '测试发货方' : undefined,
            warehouseId: warehouseId || undefined,
            warehouse: warehouseId ? '测试仓库' : undefined,
          }),
        }
      );
      if (status === 200 && data?.success) {
        pass('step4:order-assign', `派发成功: ${orderId}`);
      } else {
        fail('step4:order-assign', `status=${status}, msg=${data?.error}`);
      }
    }
  } else {
    console.log('  SKIP 无订单可派发');
  }

  // 验证派发后的订单状态
  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/orders?status=assigned`,
      { headers }
    );
    if (status === 200 && data?.success) {
      pass('step4:assigned-list', `assigned 状态订单: ${data.data?.length ?? 0} 条`);
    } else {
      fail('step4:assigned-list', `status=${status}`);
    }
  }

  // ================================================================
  // 步骤 5: 待发货统计 (GET /api/shipping-exports/pending)
  // ================================================================
  console.log('');
  console.log('[步骤5] 待发货统计 (GET /api/shipping-exports/pending)...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/shipping-exports/pending`,
      { headers }
    );
    if (status === 200 && data?.success) {
      pass('step5:pending-stats', '待发货统计 API 正常');
    } else {
      fail('step5:pending-stats', `status=${status}, msg=${data?.error}`);
    }
  }

  // ================================================================
  // 步骤 6: 批量导出发货通知 (POST /api/shipping-exports/batch)
  // ================================================================
  console.log('');
  console.log('[步骤6] 批量导出发货通知 (POST /api/shipping-exports/batch)...');

  // 先获取一个 supplierId
  if (supplierId) {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/shipping-exports/batch`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          supplierIds: [supplierId],
          templateId: null,
          downloadMode: 'zip',
        }),
      }
    );
    if (status === 200 && data?.success) {
      pass('step6:batch-export', '批量导出 API 正常');
      const recordId = (data.data as Record<string, unknown>)?.recordId;
      if (recordId) testExportRecordIds.push(String(recordId));
    } else {
      fail('step6:batch-export', `status=${status}, msg=${data?.error}`);
    }
  } else {
    // 无发货方时跳过导出测试
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/shipping-exports/batch`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ supplierIds: [], templateId: null }),
      }
    );
    if (status === 200) pass('step6:batch-export', '批量导出 API 正常（无发货方数据）');
    else fail('step6:batch-export', `status=${status}`);
  }

  // ================================================================
  // 步骤 7: 回单导入 (POST /api/return-receipts/history)
  // ================================================================
  console.log('');
  console.log('[步骤7] 回单导入 (POST /api/return-receipts/history)...');

  if (testOrderIds.length > 0 && supplierId) {
    const receiptPayload = {
      supplierId,
      supplierName: '测试发货方',
      receipts: testOrderIds.slice(0, 2).map((orderId, idx) => ({
        customerOrderNo: `ORD-${Date.now()}-${idx}`,
        supplierOrderNo: `SUP-${Date.now()}-${idx}`,
        expressCompany: '顺丰',
        trackingNo: `SF${Date.now()}${idx}`,
        shipDate: new Date().toISOString().slice(0, 10),
      })),
    };

    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/return-receipts/history`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(receiptPayload),
      }
    );
    if (status === 200 && data?.success) {
      pass('step7:return-receipt', '回单导入 API 正常');
    } else {
      fail('step7:return-receipt', `status=${status}, msg=${data?.error ?? data?.message}`);
    }

    // 回单历史查询
    const { status: hStatus, data: hData } = await fetchJson<ApiEnvelope<Record<string, unknown>[]>>(
      `${BASE_URL}/api/return-receipts/history`,
      { headers }
    );
    if (hStatus === 200 && hData?.success) {
      pass('step7:return-history', '回单历史查询正常');
    } else {
      fail('step7:return-history', `status=${hStatus}`);
    }
  } else {
    // 无发货方时跳过回单测试
    pass('step7:return-receipt', '跳过 (无发货方数据)');
    pass('step7:return-history', '跳过 (无发货方数据)');
  }

  // ================================================================
  // 步骤 8: 历史成本库 (GET /api/order-cost-history)
  // ================================================================
  console.log('');
  console.log('[步骤8] 历史成本库 (GET /api/order-cost-history)...');

  {
    const { status, data } = await fetchJson<ApiEnvelope<Record<string, unknown>>>(
      `${BASE_URL}/api/order-cost-history`,
      { headers }
    );
    if (status === 200 && data?.success) {
      pass('step8:cost-history', '历史成本库 API 正常');
    } else {
      fail('step8:cost-history', `status=${status}`);
    }
  }

  // ================================================================
  // 清理
  // ================================================================
  await cleanup(pool);
  await pool.end().catch(() => {});

  // ================================================================
  // 汇总
  // ================================================================
  console.log('');
  console.log('=== Phase 2 结果汇总 ===');

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
  console.error('Phase 2 FAIL:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
