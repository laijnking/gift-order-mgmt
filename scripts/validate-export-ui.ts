import { chromium, type Page } from 'playwright';
import {
  ADMIN_USER,
  DEFAULT_HOST,
  startServer,
  stopServer,
  waitForServer,
} from './lib/api-test-harness';

const PORT = 5100;
const BASE_URL = `http://${DEFAULT_HOST}:${PORT}`;
const STORAGE_KEY = 'gift_order_user';

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
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

async function runShippingExportCheck(page: Page) {
  let recordFromShippingRegenerated = false;
  const batchRequests: Array<{
    supplierIds?: string[];
    dispatchMode?: 'preview' | 'dispatch';
    templateId?: string | null;
    persistenceMode?: 'none' | 'full';
  }> = [];

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
            pendingOrderCount: 3,
            lastExportTime: null,
          },
          {
            id: 'supplier-2',
            name: '供应商B',
            code: 'SUP-B',
            type: 'jd',
            pendingOrderCount: 2,
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
        data: [
          { id: 'tpl-ship-1', name: '默认发货模板' },
          { id: 'tpl-ship-2', name: '自定义发货模板' },
        ],
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
      templateId?: string | null;
      persistenceMode?: 'none' | 'full';
    };
    batchRequests.push(request);
    const supplierIds = request.supplierIds || [];
    const isPreview = request.dispatchMode === 'preview';
    const templateId = request.templateId ?? 'tpl-ship-1';
    const persistenceMode = isPreview ? 'none' : request.persistenceMode === 'none' ? 'none' : 'full';
    const executionMode = isPreview
      ? 'preview'
      : persistenceMode === 'none'
        ? 'dispatch_only'
        : 'dispatch_with_persistence';
    const templateName = templateId === 'tpl-ship-2' ? '自定义发货模板' : '默认发货模板';
    const details = supplierIds.map((supplierId, index) => {
      const supplierName = supplierId === 'supplier-1' ? '供应商A' : '供应商B';
      const orderCount = supplierId === 'supplier-1' ? 3 : 2;

      return {
        supplierId,
        supplierName,
        orderCount,
        fileName: `${supplierName}+发货通知单+20260419.xlsx`,
        fileUrl: isPreview ? null : `/api/export-records/record-ship-ui/download?detailIndex=${index}`,
        templateId,
        templateName,
        templateSource: 'default',
        artifact: isPreview
          ? null
          : {
              provider: 'local',
              relative_path: `data/exports/record-ship-ui/${supplierId}.xlsx`,
              file_name: `${supplierName}+发货通知单+20260419.xlsx`,
            },
        status: 'success',
      };
    });

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          batchId: 'batch-ship-1',
          recordId: isPreview ? null : 'record-ship-ui',
          zipFileName: '发货通知单批量导出+20260419.zip',
          zipFileUrl: isPreview ? null : '/api/export-records/record-ship-ui/download',
          zipBase64: 'UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
          templateId,
          templateName,
          templateSource: 'default',
          dispatchMode: isPreview ? 'preview' : 'dispatch',
          executionMode,
          persistenceMode,
          supplierIds,
          artifact: isPreview
            ? null
            : {
                provider: 'local',
                relative_path: 'data/exports/record-ship-ui/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
          totalSupplierCount: supplierIds.length,
          totalOrderCount: details.reduce((sum, detail) => sum + detail.orderCount, 0),
          details,
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
        total: 1,
        data: [
          {
            id: 'record-ship-ui',
            export_type: 'shipping_notice',
            supplier_id: 'supplier-1',
            customer_id: null,
            template_id: 'tpl-ship-2',
            template_name: '自定义发货模板',
            file_url: '/api/export-records/record-ship-ui/download',
            file_name: '发货通知单批量导出+20260419.zip',
            total_count: 3,
            exported_by: 'system',
            created_at: '2026-04-19T10:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-ship-ui/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [
                {
                  supplierId: 'supplier-1',
                  supplierName: '供应商A',
                  orderCount: 3,
                  fileName: '供应商A+发货通知单+20260419.xlsx',
                  fileUrl: recordFromShippingRegenerated
                    ? '/api/export-records/record-ship-ui/download?detailIndex=0'
                    : '/exports/record-ship-ui-detail.xlsx',
                  templateName: '自定义发货模板',
                  templateSource: 'default',
                  artifact: recordFromShippingRegenerated
                    ? {
                        provider: 'local',
                        relative_path: 'data/exports/record-ship-ui/supplier-a.xlsx',
                        file_name: '供应商A+发货通知单+20260419.xlsx',
                      }
                    : undefined,
                  status: 'success',
                },
              ],
            },
          },
        ],
      }),
    });
  });

  await page.route('**/api/export-records/record-ship-ui', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'record-ship-ui',
            export_type: 'shipping_notice',
            template_name: '自定义发货模板',
            file_url: '/api/export-records/record-ship-ui/download',
            file_name: '发货通知单批量导出+20260419.zip',
            total_count: 3,
            exported_by: 'system',
            created_at: '2026-04-19T10:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-ship-ui/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [
                {
                  supplierId: 'supplier-1',
                  supplierName: '供应商A',
                  orderCount: 3,
                  fileName: '供应商A+发货通知单+20260419.xlsx',
                  fileUrl: recordFromShippingRegenerated
                    ? '/api/export-records/record-ship-ui/download?detailIndex=0'
                    : '/exports/record-ship-ui-detail.xlsx',
                  templateName: '自定义发货模板',
                  templateSource: 'default',
                  artifact: recordFromShippingRegenerated
                    ? {
                        provider: 'local',
                        relative_path: 'data/exports/record-ship-ui/supplier-a.xlsx',
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
                orderCount: 3,
                fileName: '供应商A+发货通知单+20260419.xlsx',
                fileUrl: recordFromShippingRegenerated
                  ? '/api/export-records/record-ship-ui/download?detailIndex=0'
                  : '/exports/record-ship-ui-detail.xlsx',
                templateName: '自定义发货模板',
                templateSource: 'default',
                artifact: recordFromShippingRegenerated
                  ? {
                      provider: 'local',
                      relative_path: 'data/exports/record-ship-ui/supplier-a.xlsx',
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
      recordFromShippingRegenerated = true;
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
                orderCount: 3,
                fileName: '供应商A+发货通知单+20260419.xlsx',
                fileUrl: '/api/export-records/record-ship-ui/download?detailIndex=0',
                templateName: '自定义发货模板',
                templateSource: 'default',
                artifact: {
                  provider: 'local',
                  relative_path: 'data/exports/record-ship-ui/supplier-a.xlsx',
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
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: '自定义发货模板' }).click();

  const supplierRow = page.locator('tr').filter({ hasText: '供应商A' }).first();
  await supplierRow.getByRole('button', { name: '预览' }).click();

  if (JSON.stringify(batchRequests[0]?.supplierIds) !== JSON.stringify(['supplier-1'])) {
    throw new Error(`发货通知页单行预览未按预期提交 supplierIds，实际为 ${JSON.stringify(batchRequests[0])}`);
  }
  if (batchRequests[0]?.dispatchMode !== 'preview') {
    throw new Error(`发货通知页预览未按预期提交 dispatchMode=preview，实际为 ${JSON.stringify(batchRequests[0])}`);
  }
  if (batchRequests[0]?.templateId !== 'tpl-ship-2') {
    throw new Error(`发货通知页预览未携带自定义模板，实际为 ${JSON.stringify(batchRequests[0])}`);
  }

  await page.getByRole('dialog').waitFor();
  await page.getByRole('heading', { name: '预览结果' }).waitFor();
  await page.getByText('预览模式仅生成内容，不会写入导出记录，也不会触发派发副作用。').waitFor();
  await page.getByRole('button', { name: '确认仅派发' }).click();

  if (JSON.stringify(batchRequests[1]?.supplierIds) !== JSON.stringify(['supplier-1'])) {
    throw new Error(`发货通知页确认仅派发未沿用预览 supplierIds，实际为 ${JSON.stringify(batchRequests[1])}`);
  }
  if (batchRequests[1]?.dispatchMode !== 'dispatch') {
    throw new Error(`发货通知页确认仅派发未按预期提交 dispatchMode=dispatch，实际为 ${JSON.stringify(batchRequests[1])}`);
  }
  if (batchRequests[1]?.templateId !== 'tpl-ship-2') {
    throw new Error(`发货通知页确认仅派发未沿用预览模板，实际为 ${JSON.stringify(batchRequests[1])}`);
  }
  if (batchRequests[1]?.persistenceMode !== 'none') {
    throw new Error(`发货通知页确认仅派发未按预期提交 persistenceMode=none，实际为 ${JSON.stringify(batchRequests[1])}`);
  }

  await page.getByText('当前结果仅执行派发，不写导出记录，也不会落盘 ZIP 或明细文件。').waitFor();
  await page.getByText('执行：仅派发').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });

  await supplierRow.getByRole('button', { name: '预览' }).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', { name: '确认导出并派发' }).click();

  if (JSON.stringify(batchRequests[2]?.supplierIds) !== JSON.stringify(['supplier-1'])) {
    throw new Error(`发货通知页第二次预览未按预期提交 supplierIds，实际为 ${JSON.stringify(batchRequests[2])}`);
  }
  if (batchRequests[2]?.dispatchMode !== 'preview') {
    throw new Error(`发货通知页第二次预览未按预期提交 dispatchMode=preview，实际为 ${JSON.stringify(batchRequests[2])}`);
  }
  if (batchRequests[2]?.templateId !== 'tpl-ship-2') {
    throw new Error(`发货通知页第二次预览未沿用模板，实际为 ${JSON.stringify(batchRequests[2])}`);
  }
  if (JSON.stringify(batchRequests[3]?.supplierIds) !== JSON.stringify(['supplier-1'])) {
    throw new Error(`发货通知页确认导出并派发未沿用预览 supplierIds，实际为 ${JSON.stringify(batchRequests[3])}`);
  }
  if (batchRequests[3]?.dispatchMode !== 'dispatch') {
    throw new Error(`发货通知页确认导出并派发未按预期提交 dispatchMode=dispatch，实际为 ${JSON.stringify(batchRequests[3])}`);
  }
  if (batchRequests[3]?.templateId !== 'tpl-ship-2') {
    throw new Error(`发货通知页确认导出并派发未沿用预览模板，实际为 ${JSON.stringify(batchRequests[3])}`);
  }
  if (batchRequests[3]?.persistenceMode !== 'full') {
    throw new Error(`发货通知页确认导出并派发未按预期提交 persistenceMode=full，实际为 ${JSON.stringify(batchRequests[3])}`);
  }

  await page.getByText('将直接下载已落盘文件').first().waitFor();
  await page.getByText('执行：派发并留痕').waitFor();
  await page.getByRole('button', { name: '下载明细' }).waitFor();
  await page.getByRole('button', { name: '下载全部 (ZIP)' }).waitFor();
  await page.getByRole('button', { name: '查看导出记录' }).click();
  await page.waitForURL('**/export-records?recordId=record-ship-ui');
  await page.getByRole('heading', { name: '导出记录' }).waitFor();
  await page.getByRole('dialog').waitFor();
  await page.getByText('发货通知单批量导出+20260419.zip').first().waitFor();
  const detailRegenerateButton = page.getByRole('button', { name: '重新生成下载' }).last();
  await detailRegenerateButton.click();
  await page.getByRole('button', { name: '下载' }).last().waitFor();
  await page.getByText('将直接下载已落盘文件').first().waitFor();

  await page.goto(`${BASE_URL}/shipping-export`);
  await page.getByRole('heading', { name: '发货通知单导出' }).waitFor();
  const supplierARow = page.locator('tr').filter({ hasText: '供应商A' }).first();
  const supplierBRow = page.locator('tr').filter({ hasText: '供应商B' }).first();
  await supplierARow.getByRole('checkbox').click();
  await supplierBRow.getByRole('checkbox').click();
  await page.getByRole('button', { name: '批量导出 (2)' }).click();

  if (JSON.stringify(batchRequests[4]?.supplierIds) !== JSON.stringify(['supplier-1', 'supplier-2'])) {
    throw new Error(`发货通知页批量导出未按预期提交 supplierIds，实际为 ${JSON.stringify(batchRequests[4])}`);
  }
  if (batchRequests[4]?.dispatchMode !== 'dispatch') {
    throw new Error(`发货通知页批量导出未按预期提交 dispatchMode=dispatch，实际为 ${JSON.stringify(batchRequests[4])}`);
  }
  if (batchRequests[4]?.persistenceMode !== undefined && batchRequests[4]?.persistenceMode !== 'full') {
    throw new Error(`发货通知页批量导出 persistenceMode 异常，实际为 ${JSON.stringify(batchRequests[4])}`);
  }

  await page.getByRole('dialog').waitFor();
  await page.getByText('将直接下载已落盘文件').first().waitFor();
  const detailDownloadButtons = page.getByRole('button', { name: '下载明细' });
  await detailDownloadButtons.first().waitFor();
  if ((await detailDownloadButtons.count()) !== 2) {
    throw new Error('发货通知页批量导出结果未展示两条明细下载按钮');
  }
  await page.getByRole('button', { name: '下载全部 (ZIP)' }).waitFor();
}

async function runExportRecordsCheck(page: Page) {
  let record2Regenerated = false;
  let record1DetailRegenerated = false;

  await page.route('**/api/export-records?page=1&pageSize=20', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        total: 2,
        data: [
          {
            id: 'record-1',
            export_type: 'shipping_notice',
            supplier_id: 'supplier-1',
            customer_id: null,
            template_id: 'tpl-ship-1',
            template_name: '默认发货模板',
            file_url: '/api/export-records/record-1/download',
            file_name: '发货通知单批量导出+20260419.zip',
            total_count: 3,
            exported_by: 'system',
            created_at: '2026-04-19T10:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-1/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [],
            },
          },
          {
            id: 'record-2',
            export_type: 'customer_feedback',
            supplier_id: null,
            customer_id: 'customer-1',
            template_id: null,
            template_name: '客户反馈模板',
            file_url: record2Regenerated ? '/api/export-records/record-2/download' : '/exports/pending.zip',
            file_name: '客户反馈批量导出+20260419.zip',
            total_count: 2,
            exported_by: 'system',
            created_at: '2026-04-19T11:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: record2Regenerated
                ? {
                    provider: 'local',
                    relative_path: 'data/exports/record-2/batch.zip',
                    file_name: '客户反馈批量导出+20260419.zip',
                  }
                : undefined,
              template_source: 'default',
              details: [],
              shipped_order_count: 1,
              pending_receipt_count: 1,
            },
          },
        ],
      }),
    });
  });

  await page.route('**/api/export-records/record-1', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'record-1',
            export_type: 'shipping_notice',
            template_name: '默认发货模板',
            file_url: '/api/export-records/record-1/download',
            file_name: '发货通知单批量导出+20260419.zip',
            total_count: 3,
            exported_by: 'system',
            created_at: '2026-04-19T10:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-1/batch.zip',
                file_name: '发货通知单批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [
                {
                  supplierId: 'supplier-1',
                  supplierName: '供应商A',
                  orderCount: 3,
                  fileName: '供应商A+发货通知单+20260419.xlsx',
                  fileUrl: record1DetailRegenerated
                    ? '/api/export-records/record-1/download?detailIndex=0'
                    : '/exports/record-1-detail.xlsx',
                  templateName: '默认发货模板',
                  templateSource: 'default',
                  artifact: record1DetailRegenerated
                    ? {
                        provider: 'local',
                        relative_path: 'data/exports/record-1/supplier-a.xlsx',
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
                orderCount: 3,
                fileName: '供应商A+发货通知单+20260419.xlsx',
                fileUrl: record1DetailRegenerated
                  ? '/api/export-records/record-1/download?detailIndex=0'
                  : '/exports/record-1-detail.xlsx',
                templateName: '默认发货模板',
                templateSource: 'default',
                artifact: record1DetailRegenerated
                  ? {
                      provider: 'local',
                      relative_path: 'data/exports/record-1/supplier-a.xlsx',
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
      record1DetailRegenerated = true;
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
                orderCount: 3,
                fileName: '供应商A+发货通知单+20260419.xlsx',
                fileUrl: '/api/export-records/record-1/download?detailIndex=0',
                templateName: '默认发货模板',
                templateSource: 'default',
                artifact: {
                  provider: 'local',
                  relative_path: 'data/exports/record-1/supplier-a.xlsx',
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

  await page.route('**/api/export-records/record-2', async (route) => {
    if (route.request().method() === 'POST') {
      record2Regenerated = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            zipFileName: '客户反馈批量导出+20260419.zip',
            zipBase64: 'UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
            details: [],
          },
        }),
      });
      return;
    }

    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'record-2',
            export_type: 'customer_feedback',
            template_name: '客户反馈模板',
            file_url: '/api/export-records/record-2/download',
            file_name: '客户反馈批量导出+20260419.zip',
            total_count: 2,
            exported_by: 'system',
            created_at: '2026-04-19T11:00:00.000Z',
            metadata: {
              download_mode: 'regenerate',
              artifact: {
                provider: 'local',
                relative_path: 'data/exports/record-2/batch.zip',
                file_name: '客户反馈批量导出+20260419.zip',
              },
              template_source: 'default',
              details: [],
              shipped_order_count: 1,
              pending_receipt_count: 1,
              last_regenerated_file_name: '客户反馈批量导出+20260419.zip',
            },
            details: [],
          },
        }),
      });
      return;
    }

    await route.fulfill({ status: 405, body: 'unexpected' });
  });

  await page.goto(`${BASE_URL}/export-records`);
  await page.getByRole('heading', { name: '导出记录' }).waitFor();
  await page.getByText('当前会先重新生成再下载').first().waitFor();

  const regenerateButton = page.getByRole('button', { name: '重新生成下载' }).first();
  await regenerateButton.click();
  await page.getByRole('button', { name: '下载' }).nth(1).waitFor();
  await page.getByText('将直接下载已落盘文件').first().waitFor();

  await page.getByRole('button', { name: '详情' }).first().click();
  await page.getByRole('dialog').waitFor();
  const detailRegenerateButton = page.getByRole('button', { name: '重新生成下载' }).last();
  await detailRegenerateButton.click();
  await page.getByRole('button', { name: '下载' }).last().waitFor();
  await page.getByText('将直接下载已落盘文件').first().waitFor();
}

async function main() {
  const server = startServer(PORT);
  const browser = await chromium.launch({ headless: true });

  try {
    await waitForServer(BASE_URL, server);

    const context = await browser.newContext();
    const page = await context.newPage();
    await preparePage(page);

    await runShippingExportCheck(page);
    console.log('PASS Shipping Export UI');

    const page2 = await context.newPage();
    await preparePage(page2);
    await runExportRecordsCheck(page2);
    console.log('PASS Export Records UI');

    await context.close();
    console.log('All export UI validation checks passed.');
  } finally {
    await browser.close();
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error('FAIL Export UI Validation');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
