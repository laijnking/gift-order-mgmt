import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { chromium, type Page } from 'playwright';
import * as XLSX from 'xlsx';

const PORT = 5101;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const STORAGE_KEY = 'gift_order_user';
const IMPORT_BATCH = 'BATCH-20260419-0001';

type MockUser = {
  id: string;
  username: string;
  realName: string;
  role: string;
  roleName: string;
  dataScope: string;
  permissions: string[];
};

const ADMIN_USER: MockUser = {
  id: 'user-admin',
  username: 'admin',
  realName: '管理员',
  role: 'admin',
  roleName: '管理员',
  dataScope: 'all',
  permissions: [
    'dashboard:view',
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:delete',
    'orders:export',
    'customers:view',
    'suppliers:view',
    'products:view',
    'stocks:view',
    'users:view',
    'settings:view',
  ],
};

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function createReturnReceiptWorkbookBuffer() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([
    {
      客户订单号: 'ORDER-ASSIGNED-001',
      快递公司: '顺丰',
      快递单号: 'SF1234567890',
      发货日期: '2026-04-19',
    },
    {
      客户订单号: 'ORDER-ASSIGNED-002',
      快递公司: '中通',
      快递单号: 'ZT1234567890',
      发货日期: '2026-04-19',
    },
  ]);
  XLSX.utils.book_append_sheet(workbook, worksheet, '回单');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`${BASE_URL}/login`);
      if (response.ok) {
        return;
      }
    } catch {}
    await wait(1000);
  }

  throw new Error('本地服务启动超时');
}

function startServer() {
  const child = spawn('corepack', ['pnpm', 'tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      HOSTNAME: '127.0.0.1',
      COZE_PROJECT_ENV: 'DEV',
    },
    stdio: 'pipe',
  });

  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});

  return child;
}

async function stopServer(child: ChildProcessWithoutNullStreams) {
  if (child.exitCode !== null) return;

  child.kill('SIGTERM');
  for (let i = 0; i < 10; i += 1) {
    if (child.exitCode !== null) return;
    await wait(300);
  }

  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

async function preparePage(page: Page) {
  await page.addInitScript(([storageKey, user]) => {
    window.localStorage.setItem(storageKey, JSON.stringify(user));

    const nativeClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function patchedClick(this: HTMLAnchorElement) {
      if (this.href.startsWith('data:') || this.href.includes('/api/export-records/')) {
        return;
      }
      return nativeClick.call(this);
    };
  }, [STORAGE_KEY, ADMIN_USER] as const);
}

async function setupCommonRoutes(page: Page) {
  await page.route('**/api/customers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            code: 'C001',
            name: '测试客户A',
            salesUserId: 'sales-1',
            salesUserName: '销售甲',
            operatorUserId: 'operator-1',
            operatorUserName: '跟单乙',
          },
        ],
      }),
    });
  });

  await page.route('**/api/suppliers*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'supplier-1',
            name: '供应商A',
            type: 'self',
            province: '上海',
          },
        ],
      }),
    });
  });

  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'sales-1',
            username: 'sales001',
            realName: '销售甲',
            role: 'salesperson',
          },
          {
            id: 'operator-1',
            username: 'operator001',
            realName: '跟单乙',
            role: 'operator',
          },
        ],
      }),
    });
  });

  await page.route('**/api/column-mappings?customerCode=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: null,
      }),
    });
  });

  await page.route('**/api/column-mappings/history?customerCode=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });

  await page.route('**/api/alert-records?isResolved=false&limit=50', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
      }),
    });
  });
}

async function runOrderOpsNavigationCheck(page: Page) {
  let autoMatched = false;
  let confirmPayload: { receiptIds?: string[] } | null = null;

  await setupCommonRoutes(page);

  await page.route('**/api/orders**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'order-assigned-1',
            sysOrderNo: 'SYS-20260419-1001',
            orderNo: 'ORDER-ASSIGNED-001',
            billNo: 'BILL-ASSIGNED-001',
            billDate: '2026-04-19',
            supplierOrderNo: '',
            status: 'assigned',
            customerCode: 'C001',
            customerName: '测试客户A',
            salespersonName: '销售甲',
            operatorName: '跟单乙',
            supplierId: 'supplier-1',
            supplierName: '供应商A',
            receiver: {
              name: '李四',
              phone: '13900000000',
              address: '北京市海淀区中关村大街1号',
            },
            items: [
              {
                product_name: '测试商品B',
                product_spec: '高配版',
                quantity: 1,
                price: 299,
              },
            ],
            createdAt: '2026-04-19T13:00:00.000Z',
            importBatch: 'BATCH-OPS-001',
          },
        ],
      }),
    });
  });

  await page.route('**/api/shipping-exports/pending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'supplier-1',
            name: '供应商A',
            code: 'SUP-A',
            type: 'self',
            pendingOrderCount: 1,
            lastExportTime: null,
          },
        ],
      }),
    });
  });

  await page.route('**/api/templates?type=shipping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 'tpl-ship-1', name: '默认发货模板' }],
      }),
    });
  });

  await page.route('**/api/templates/default/shipping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'tpl-ship-1', name: '默认发货模板' },
      }),
    });
  });

  await page.route('**/api/return-receipts/history**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            recordId: 'receipt-record-1',
            totalCount: 2,
          },
        }),
      });
      return;
    }

    const url = new URL(route.request().url());
    const recordId = url.searchParams.get('recordId');

    if (recordId) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'receipt-record-1',
            supplierId: 'supplier-1',
            supplierName: '供应商A',
            fileName: '供应商A-回单-20260419.xlsx',
            totalCount: 2,
            matchedCount: autoMatched ? 2 : 1,
            unmatchedCount: autoMatched ? 0 : 1,
            importedAt: '2026-04-19T15:00:00.000Z',
            importedBy: 'system',
            reviewSummary: {
              matchedCount: autoMatched ? 2 : 1,
              needsReviewCount: autoMatched ? 0 : 1,
              conflictCount: 0,
            },
            receipts: [
              {
                id: 'receipt-1',
                supplierId: 'supplier-1',
                supplierName: '供应商A',
                customerOrderNo: 'ORDER-ASSIGNED-001',
                expressCompany: '顺丰',
                trackingNo: 'SF1234567890',
                shipDate: '2026-04-19',
                matchStatus: autoMatched ? 'auto_matched' : 'pending',
                orderId: autoMatched ? 'order-assigned-1' : null,
                orderNo: autoMatched ? 'SYS-20260419-1001' : null,
                createdAt: '2026-04-19T15:00:00.000Z',
                reviewStatus: autoMatched ? 'matched' : 'needs_review',
                reviewReason: autoMatched ? 'matched' : 'unmatched',
              },
              {
                id: 'receipt-2',
                supplierId: 'supplier-1',
                supplierName: '供应商A',
                customerOrderNo: 'ORDER-ASSIGNED-002',
                expressCompany: '中通',
                trackingNo: 'ZT1234567890',
                shipDate: '2026-04-19',
                matchStatus: 'auto_matched',
                orderId: 'order-assigned-2',
                orderNo: 'SYS-20260419-1002',
                createdAt: '2026-04-19T15:00:00.000Z',
                reviewStatus: 'matched',
                reviewReason: 'matched',
              },
            ],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'receipt-record-1',
            supplierId: 'supplier-1',
            supplierName: '供应商A',
            fileName: '供应商A-回单-20260419.xlsx',
            totalCount: 2,
            matchedCount: autoMatched ? 2 : 1,
            unmatchedCount: autoMatched ? 0 : 1,
            importedAt: '2026-04-19T15:00:00.000Z',
            importedBy: 'system',
            reviewCount: autoMatched ? 0 : 1,
            conflictCount: 0,
            reviewStatus: autoMatched ? 'clean' : 'needs_review',
          },
        ],
      }),
    });
  });

  await page.route('**/api/return-receipts/match', async (route) => {
    autoMatched = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          matched: 1,
        },
      }),
    });
  });

  await page.route('**/api/return-receipts/confirm', async (route) => {
    confirmPayload = route.request().postDataJSON() as { receiptIds?: string[] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '成功确认 2 条回单',
      }),
    });
  });

  await page.route('**/api/export-records?page=1&pageSize=20', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [
          {
            id: 'record-feedback-1',
            export_type: 'customer_feedback',
            template_name: '客户反馈模板',
            file_url: '/api/export-records/record-feedback-1/download',
            file_name: '客户反馈批量导出+20260419.zip',
            total_count: 2,
            exported_by: 'system',
            created_at: '2026-04-19T14:00:00.000Z',
            metadata: {
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-feedback-1/batch.zip',
                file_name: '客户反馈批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [
                {
                  customerId: 'customer-1',
                  customerName: '测试客户A',
                  orderCount: 2,
                  shippedOrderCount: 1,
                  pendingReceiptCount: 1,
                  fileName: '测试客户A+客户反馈+20260419.xlsx',
                  fileUrl: '/api/export-records/record-feedback-1/download?detailIndex=0',
                  status: 'success',
                  templateName: '客户反馈模板',
                  templateSource: 'default',
                },
              ],
              shipped_order_count: 1,
              pending_receipt_count: 1,
            },
          },
        ],
      }),
    });
  });

  await page.goto(`${BASE_URL}/orders?status=assigned`);
  await page.getByRole('heading', { name: '订单管理' }).waitFor();

  const assignedRow = page.locator('tr').filter({ hasText: 'ORDER-ASSIGNED-001' }).first();
  await assignedRow.locator('input[type="checkbox"]').click();
  await page.getByRole('button', { name: /发货通知/ }).click();

  await page.getByRole('heading', { name: '发货通知单导出' }).waitFor();
  await page.getByText('供应商A').waitFor();

  await page.goto(`${BASE_URL}/return-receipt`);
  await page.getByRole('heading', { name: '回单导入' }).waitFor();
  await page.getByText('导入供应商回传快递单号，自动匹配订单').waitFor();
  await page.getByRole('heading', { name: '回单导入' }).waitFor();
  await page.getByText('上传包含快递信息的Excel文件').waitFor();
  await page.locator('select').selectOption('supplier-1');
  await page.locator('input[type="file"]').setInputFiles({
    name: '供应商A-回单-20260419.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: createReturnReceiptWorkbookBuffer(),
  });
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: '开始匹配' }).click();
  await page.getByText('ORDER-ASSIGNED-001').waitFor();
  await page.getByText('已匹配').first().waitFor();
  await page.locator('tr').filter({ hasText: 'ORDER-ASSIGNED-001' }).locator('input[type="checkbox"]').click();
  await page.locator('tr').filter({ hasText: 'ORDER-ASSIGNED-002' }).locator('input[type="checkbox"]').click();
  await page.getByRole('button', { name: '批量确认 (2)' }).click();

  const submittedConfirmPayload = confirmPayload as { receiptIds?: string[] } | null;
  if (!submittedConfirmPayload || JSON.stringify(submittedConfirmPayload.receiptIds) !== JSON.stringify(['receipt-1', 'receipt-2'])) {
    throw new Error(`回单页批量确认未按预期提交 receiptIds，实际为 ${JSON.stringify(submittedConfirmPayload)}`);
  }

  await page.goto(`${BASE_URL}/export-records`);
  await page.getByRole('heading', { name: '导出记录' }).waitFor();
  await page.getByText('客户反馈批量导出+20260419.zip').waitFor();
  await page.getByText(/客户 1/).waitFor();
  await page.getByText('待回单').waitFor();
  await page.getByRole('button', { name: '详情' }).first().click();
  await page.getByRole('dialog').waitFor();
  await page.getByText('涉及客户数').waitFor();
  await page.getByText('待回单订单').waitFor();
}

async function runOrderIntakeToOrdersCheck(page: Page) {
  let createOrderRequest: Record<string, unknown> | null = null;

  await setupCommonRoutes(page);

  await page.route('**/api/order-parse', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: '解析成功',
        data: {
          duration: 123,
          orders: [
            {
              id: 'bundle-1',
              orderNo: 'ORDER-001',
              billDate: '2026-04-19',
              receiverName: '张三',
              receiverPhone: '13800000000',
              receiverAddress: '上海市浦东新区科苑路88号',
              province: '上海',
              city: '上海',
              district: '浦东新区',
              expressCompany: '',
              trackingNo: '',
              remark: '测试录单',
              items: [
                {
                  id: 'item-1',
                  customerProductName: '测试商品A',
                  customerProductSpec: '标准版',
                  customerProductCode: 'SKU-001',
                  customerBarcode: '',
                  systemProductId: 'product-1',
                  systemProductName: '系统商品A',
                  systemProductSpec: '标准版',
                  systemProductCode: 'P-001',
                  systemProductBrand: '品牌A',
                  systemProductPrice: 199,
                  matchType: 'mapping',
                  matchHint: '映射匹配',
                  supplierMatches: [
                    {
                      supplierId: 'supplier-1',
                      supplierName: '供应商A',
                      stockQuantity: 20,
                      stockPrice: 99,
                      warehouseName: '上海仓',
                      matchType: 'preferred',
                    },
                  ],
                  quantity: 1,
                  price: 199,
                  remark: '',
                },
              ],
            },
          ],
        },
      }),
    });
  });

  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'POST') {
      createOrderRequest = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          total: 1,
          importBatch: IMPORT_BATCH,
          message: '成功创建 1 条订单',
          data: [
            {
              id: 'order-1',
              sys_order_no: 'SYS-20260419-0001',
            },
          ],
          matchStats: {
            total: 1,
            bySpec: 0,
            byName: 0,
            byMapping: 1,
            none: 0,
            matched: 1,
            matchRate: '100%',
          },
        }),
      });
      return;
    }

    const url = new URL(route.request().url());
    const importBatch = url.searchParams.get('importBatch');
    const status = url.searchParams.get('status');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'order-1',
            sysOrderNo: 'SYS-20260419-0001',
            orderNo: 'ORDER-001',
            billNo: 'BILL-001',
            billDate: '2026-04-19',
            supplierOrderNo: '',
            status: status || 'pending',
            customerCode: 'C001',
            customerName: '测试客户A',
            salespersonName: '销售甲',
            operatorName: '跟单乙',
            supplierId: 'supplier-1',
            supplierName: '供应商A',
            expressCompany: '',
            trackingNo: '',
            receiver: {
              name: '张三',
              phone: '13800000000',
              address: '上海市浦东新区科苑路88号',
            },
            items: [
              {
                product_name: '测试商品A',
                product_spec: '标准版',
                quantity: 1,
                price: 199,
              },
            ],
            createdAt: '2026-04-19T10:00:00.000Z',
            importBatch: importBatch || IMPORT_BATCH,
          },
        ],
      }),
    });
  });

  await page.goto(`${BASE_URL}/order-parse`);
  await page.getByRole('heading', { name: 'AI智能订单录入' }).waitFor();

  await page.getByRole('combobox').click();
  await page.getByPlaceholder('输入客户名称或编码搜索...').fill('测试客户A');
  await page.getByText('测试客户A').click();

  await page.getByRole('tab', { name: '文本录入' }).click();
  await page.getByText('点击此处开始文本录入').click();
  await page.locator('textarea').fill('订单号：ORDER-001\n收货人：张三\n电话：13800000000\n地址：上海市浦东新区科苑路88号\n商品：测试商品A 1件');
  await page.getByLabel('文本录入').getByRole('button', { name: 'AI解析' }).click();

  await page.getByText('解析完成，耗时 123ms').waitFor();
  await page.getByText('测试商品A').first().waitFor();
  await page.getByRole('button', { name: '提交订单' }).click();

  const submittedOrderRequest = createOrderRequest as { customerCode?: string } | null;
  if (!submittedOrderRequest || submittedOrderRequest.customerCode !== 'C001') {
    throw new Error(`录单页提交订单未携带预期客户，实际为 ${JSON.stringify(submittedOrderRequest)}`);
  }

  await page.getByRole('dialog').waitFor();
  await page.getByText('订单导入成功').waitFor();
  await page.getByText(IMPORT_BATCH).waitFor();
  await page.getByRole('button', { name: '查看本批待派发' }).click();

  await page.getByRole('heading', { name: '订单管理' }).waitFor();
  await page.getByText('当前正在回看导入批次').waitFor();
  await page.getByText(IMPORT_BATCH).waitFor();
  await page.getByText('本批次复盘摘要').waitFor();
  await page.getByRole('button', { name: /待派发/ }).first().waitFor();
}

async function runExportEntryCheck(page: Page) {
  await setupCommonRoutes(page);

  await page.route('**/api/shipping-exports/pending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'supplier-1',
            name: '供应商A',
            code: 'SUP-A',
            type: 'self',
            pendingOrderCount: 1,
            lastExportTime: null,
          },
        ],
      }),
    });
  });

  await page.route('**/api/templates?type=shipping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 'tpl-ship-1', name: '默认发货模板' }],
      }),
    });
  });

  await page.route('**/api/templates/default/shipping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'tpl-ship-1', name: '默认发货模板' },
      }),
    });
  });

  await page.route('**/api/export-records?page=1&pageSize=20', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        total: 1,
        data: [
          {
            id: 'record-ship-1',
            export_type: 'shipping_notice',
            template_name: '默认发货模板',
            file_url: '/api/export-records/record-ship-1/download',
            file_name: '发货通知单批量导出+20260419.zip',
            total_count: 1,
            exported_by: 'system',
            created_at: '2026-04-19T12:00:00.000Z',
            metadata: {
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-ship-1/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [],
            },
          },
        ],
      }),
    });
  });

  await page.goto(`${BASE_URL}/shipping-export`);
  await page.getByRole('heading', { name: '发货通知单导出' }).waitFor();
  await page.getByText('供应商A').waitFor();

  await page.goto(`${BASE_URL}/export-records`);
  await page.getByRole('heading', { name: '导出记录' }).waitFor();
  await page.getByText('默认发货模板').first().waitFor();
  await page.getByRole('button', { name: '下载' }).first().waitFor();
}

async function runShippingPersistenceBranchSmoke(page: Page) {
  let recordPersisted = false;
  let detailRegenerated = false;
  const batchRequests: Array<{
    supplierIds?: string[];
    dispatchMode?: 'preview' | 'dispatch';
    persistenceMode?: 'none' | 'full';
    templateId?: string | null;
  }> = [];

  await setupCommonRoutes(page);

  await page.route('**/api/shipping-exports/pending', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'supplier-1',
            name: '供应商A',
            code: 'SUP-A',
            type: 'self',
            pendingOrderCount: 1,
            lastExportTime: recordPersisted ? '2026-04-19T16:00:00.000Z' : null,
          },
        ],
      }),
    });
  });

  await page.route('**/api/templates?type=shipping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [{ id: 'tpl-ship-1', name: '默认发货模板' }],
      }),
    });
  });

  await page.route('**/api/templates/default/shipping', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { id: 'tpl-ship-1', name: '默认发货模板' },
      }),
    });
  });

  await page.route('**/api/shipping-exports/batch', async (route) => {
    const request = route.request().postDataJSON() as {
      supplierIds?: string[];
      dispatchMode?: 'preview' | 'dispatch';
      persistenceMode?: 'none' | 'full';
      templateId?: string | null;
    };
    batchRequests.push(request);

    const isPreview = request.dispatchMode === 'preview';
    const persistenceMode = isPreview ? 'none' : request.persistenceMode === 'none' ? 'none' : 'full';
    const executionMode = isPreview
      ? 'preview'
      : persistenceMode === 'none'
        ? 'dispatch_only'
        : 'dispatch_with_persistence';
    if (executionMode === 'dispatch_with_persistence') {
      recordPersisted = true;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          recordId: executionMode === 'dispatch_with_persistence' ? 'record-ship-smoke' : null,
          zipFileName: '发货通知单批量导出+20260419.zip',
          zipFileUrl:
            executionMode === 'dispatch_with_persistence'
              ? '/api/export-records/record-ship-smoke/download'
              : null,
          zipBase64: 'UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
          templateId: request.templateId ?? 'tpl-ship-1',
          templateName: '默认发货模板',
          templateSource: 'default',
          dispatchMode: request.dispatchMode ?? 'dispatch',
          persistenceMode,
          executionMode,
          supplierIds: request.supplierIds ?? ['supplier-1'],
          dispatchSummary: {
            mode: request.dispatchMode ?? 'dispatch',
            newDispatchCount: 1,
            reusedDispatchCount: 0,
            assignedOnlyCount: 0,
          },
          persistenceSummary: {
            exportRecordCreated: executionMode === 'dispatch_with_persistence',
            zipArtifactPersisted: executionMode === 'dispatch_with_persistence',
            detailArtifactPersistedCount: executionMode === 'dispatch_with_persistence' ? 1 : 0,
          },
          artifact:
            executionMode === 'dispatch_with_persistence'
              ? {
                  provider: 'local',
                  relative_path: 'data/exports/record-ship-smoke/batch.zip',
                  file_name: '发货通知单批量导出+20260419.zip',
                }
              : null,
          totalSupplierCount: 1,
          totalOrderCount: 1,
          details: [
            {
              supplierId: 'supplier-1',
              supplierName: '供应商A',
              orderCount: 1,
              fileName: '供应商A+发货通知单+20260419.xlsx',
              fileUrl:
                executionMode === 'dispatch_with_persistence'
                  ? '/api/export-records/record-ship-smoke/download?detailIndex=0'
                  : '',
              templateId: request.templateId ?? 'tpl-ship-1',
              templateName: '默认发货模板',
              templateSource: 'default',
              artifact:
                executionMode === 'dispatch_with_persistence'
                  ? {
                      provider: 'local',
                      relative_path: 'data/exports/record-ship-smoke/supplier-a.xlsx',
                      file_name: '供应商A+发货通知单+20260419.xlsx',
                    }
                  : null,
              status: 'success',
            },
          ],
        },
      }),
    });
  });

  await page.route('**/api/export-records?page=1&pageSize=20', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        total: recordPersisted ? 1 : 0,
        data: recordPersisted
          ? [
              {
                id: 'record-ship-smoke',
                export_type: 'shipping_notice',
                supplier_id: 'supplier-1',
                customer_id: null,
                template_id: 'tpl-ship-1',
                template_name: '默认发货模板',
                file_url: '/api/export-records/record-ship-smoke/download',
                file_name: '发货通知单批量导出+20260419.zip',
                total_count: 1,
                exported_by: 'system',
                created_at: '2026-04-19T16:00:00.000Z',
                metadata: {
                  download_mode: 'regenerate',
                  artifact: {
                    provider: 'local',
                    relative_path: 'data/exports/record-ship-smoke/batch.zip',
                    file_name: '发货通知单批量导出+20260419.zip',
                  },
                  template_source: 'default',
                  details: [
                    {
                      supplierId: 'supplier-1',
                      supplierName: '供应商A',
                      orderCount: 1,
                      fileName: '供应商A+发货通知单+20260419.xlsx',
                      fileUrl: detailRegenerated
                        ? '/api/export-records/record-ship-smoke/download?detailIndex=0'
                        : '/exports/record-ship-smoke-detail.xlsx',
                      templateName: '默认发货模板',
                      templateSource: 'default',
                      artifact: detailRegenerated
                        ? {
                            provider: 'local',
                            relative_path: 'data/exports/record-ship-smoke/supplier-a.xlsx',
                            file_name: '供应商A+发货通知单+20260419.xlsx',
                          }
                        : undefined,
                      status: 'success',
                    },
                  ],
                },
              },
            ]
          : [],
      }),
    });
  });

  await page.route('**/api/export-records/record-ship-smoke', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'record-ship-smoke',
            export_type: 'shipping_notice',
            template_name: '默认发货模板',
            file_url: '/api/export-records/record-ship-smoke/download',
            file_name: '发货通知单批量导出+20260419.zip',
            total_count: 1,
            exported_by: 'system',
            created_at: '2026-04-19T16:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-ship-smoke/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [
                {
                  supplierId: 'supplier-1',
                  supplierName: '供应商A',
                  orderCount: 1,
                  fileName: '供应商A+发货通知单+20260419.xlsx',
                  fileUrl: detailRegenerated
                    ? '/api/export-records/record-ship-smoke/download?detailIndex=0'
                    : '/exports/record-ship-smoke-detail.xlsx',
                  templateName: '默认发货模板',
                  templateSource: 'default',
                  artifact: detailRegenerated
                    ? {
                        provider: 'local',
                        relative_path: 'data/exports/record-ship-smoke/supplier-a.xlsx',
                        file_name: '供应商A+发货通知单+20260419.xlsx',
                      }
                    : undefined,
                  status: 'success',
                },
              ],
            },
            details: [
              {
                supplierId: 'supplier-1',
                supplierName: '供应商A',
                orderCount: 1,
                fileName: '供应商A+发货通知单+20260419.xlsx',
                fileUrl: detailRegenerated
                  ? '/api/export-records/record-ship-smoke/download?detailIndex=0'
                  : '/exports/record-ship-smoke-detail.xlsx',
                templateName: '默认发货模板',
                templateSource: 'default',
                artifact: detailRegenerated
                  ? {
                      provider: 'local',
                      relative_path: 'data/exports/record-ship-smoke/supplier-a.xlsx',
                      file_name: '供应商A+发货通知单+20260419.xlsx',
                    }
                  : undefined,
                status: 'success',
              },
            ],
          },
        }),
      });
      return;
    }

    if (route.request().method() === 'POST') {
      detailRegenerated = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            zipFileName: '供应商A+发货通知单+20260419.zip',
            zipBase64: 'UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
            details: [
              {
                supplierId: 'supplier-1',
                supplierName: '供应商A',
                orderCount: 1,
                fileName: '供应商A+发货通知单+20260419.xlsx',
                fileUrl: '/api/export-records/record-ship-smoke/download?detailIndex=0',
                templateName: '默认发货模板',
                templateSource: 'default',
                artifact: {
                  provider: 'local',
                  relative_path: 'data/exports/record-ship-smoke/supplier-a.xlsx',
                  file_name: '供应商A+发货通知单+20260419.xlsx',
                },
                status: 'success',
              },
            ],
          },
        }),
      });
      return;
    }

    await route.fulfill({ status: 405, body: 'unexpected' });
  });

  await page.goto(`${BASE_URL}/shipping-export`);
  await page.getByRole('heading', { name: '发货通知单导出' }).waitFor();
  const supplierRow = page.locator('tr').filter({ hasText: '供应商A' }).first();
  await supplierRow.getByRole('button', { name: '预览' }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: '确认仅派发' }).click();
  await page.getByText('执行：仅派发').waitFor();

  if (batchRequests[1]?.persistenceMode !== 'none') {
    throw new Error(`仅派发分支未提交 persistenceMode=none，实际为 ${JSON.stringify(batchRequests[1])}`);
  }

  await page.goto(`${BASE_URL}/export-records`);
  await page.getByRole('heading', { name: '导出记录' }).waitFor();
  await page.getByText('暂无导出记录').waitFor();

  await page.goto(`${BASE_URL}/shipping-export`);
  await page.getByRole('heading', { name: '发货通知单导出' }).waitFor();
  const persistedSupplierRow = page.locator('tr').filter({ hasText: '供应商A' }).first();
  await persistedSupplierRow.getByRole('button', { name: '预览' }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: '确认导出并派发' }).click();
  await page.getByText('执行：派发并留痕').waitFor();

  if (batchRequests[3]?.persistenceMode !== 'full') {
    throw new Error(`派发并留痕分支未提交 persistenceMode=full，实际为 ${JSON.stringify(batchRequests[3])}`);
  }

  await page.getByRole('button', { name: '查看导出记录' }).click();
  await page.waitForURL('**/export-records?recordId=record-ship-smoke');
  await page.getByRole('dialog').waitFor();
  await page.getByText('发货通知单批量导出+20260419.zip').first().waitFor();
  await page.getByRole('button', { name: '重新生成下载' }).last().click();
  await page.getByRole('button', { name: '下载' }).last().waitFor();
}

async function main() {
  const server = startServer();
  const browser = await chromium.launch({ headless: true });

  try {
    await waitForServer();

    const context = await browser.newContext();
    const intakePage = await context.newPage();
    await preparePage(intakePage);
    await runOrderIntakeToOrdersCheck(intakePage);
    console.log('PASS Order Intake -> Orders Smoke');

    const exportPage = await context.newPage();
    await preparePage(exportPage);
    await runExportEntryCheck(exportPage);
    console.log('PASS Export Pages Smoke');

    const opsPage = await context.newPage();
    await preparePage(opsPage);
    await runOrderOpsNavigationCheck(opsPage);
    console.log('PASS Order Ops Navigation Smoke');

    const branchPage = await context.newPage();
    await preparePage(branchPage);
    await runShippingPersistenceBranchSmoke(branchPage);
    console.log('PASS Shipping Persistence Branch Smoke');

    await context.close();
    console.log('All business smoke checks passed.');
  } finally {
    await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error('FAIL Business Smoke Validation');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
