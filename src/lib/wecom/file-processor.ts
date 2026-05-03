/**
 * WeCom Plugin - File Processor
 * 文件处理：下载 → 解析 → 创建订单
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { parseExcelData } from '@/lib/order-parser';
import { autoDetectColumnMapping } from '@/lib/column-mapping-rules';
import { WeComAPIClient } from './api-client';
import { getWeComAppConfig } from './shared';
import type {
  WeComFileTask,
  WeComAppConfig,
} from './types';
import type { ParsedOrderBundleDraft } from '@/types/order-parse';

const DOWNLOAD_DIR = process.env.WECOM_DOWNLOAD_DIR || '/tmp/wecom-files';

/**
 * 获取客户历史列映射
 */
async function getCustomerColumnMapping(customerId: string): Promise<{
  id: string;
  mapping: Record<string, string>;
  feedbackHeaders: Record<string, string>;
} | null> {
  const client = getSupabaseClient();

  const { data } = await client
    .from('column_mappings')
    .select('id, column_mapping, feedback_export_headers')
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    mapping: (data.column_mapping || {}) as Record<string, string>,
    feedbackHeaders: (data.feedback_export_headers || {}) as Record<string, string>,
  };
}

/**
 * 下载文件
 */
async function downloadFile(
  appConfig: WeComAppConfig,
  mediaId: string,
  taskId: string
): Promise<string> {
  const client = new WeComAPIClient(appConfig);
  const buffer = await client.downloadMedia(mediaId);

  const fs = await import('fs');
  const path = await import('path');
  const fsSync = fs.default || fs;

  if (!fsSync.existsSync(DOWNLOAD_DIR)) {
    fsSync.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const filePath = path.join(DOWNLOAD_DIR, `${taskId}.xlsx`);
  fsSync.writeFileSync(filePath, buffer);

  return filePath;
}

/**
 * 解析 Excel 文件
 */
async function parseExcelFile(
  filePath: string
): Promise<{
  headers: string[];
  rows: (string | number | null)[][];
}> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as (string | number | null)[][];

  if (data.length === 0) {
    throw new Error('Excel 文件为空');
  }

  const headers = data[0].map((h) => String(h ?? ''));
  const rows = data.slice(1);

  return { headers, rows };
}

/**
 * 创建订单（基于 parseExcelData 返回的 ParsedOrderBundleDraft）
 */
async function createOrdersFromParsed(
  client: ReturnType<typeof getSupabaseClient>,
  customerId: string,
  ordersData: ParsedOrderBundleDraft[]
): Promise<string[]> {
  const createdOrderIds: string[] = [];
  const batchId = `WECOM-${Date.now()}`;

  for (const orderData of ordersData) {
    try {
      const items = orderData.items.map((item, idx) => ({
        id: `${batchId}-${idx}`,
        customerProductName: item.customerProductName,
        customerProductSpec: item.customerProductSpec,
        customerProductCode: item.customerProductCode,
        customerBarcode: item.customerBarcode || '',
        systemProductId: item.systemProductId,
        systemProductName: item.systemProductName,
        systemProductSpec: item.systemProductSpec,
        systemProductCode: item.systemProductCode,
        systemProductBrand: item.systemProductBrand,
        systemProductPrice: item.systemProductPrice,
        matchType: item.matchType,
        matchHint: item.matchHint,
        supplierMatches: item.supplierMatches,
        quantity: item.quantity,
        price: item.price,
        remark: item.remark || '',
      }));

      const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const { error: insertError } = await client.from('orders').insert({
        id: orderId,
        customer_id: customerId,
        order_no: orderData.orderNo,
        sys_order_no: `SYS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now() % 10000}-${Math.random().toString(36).slice(2, 6)}`,
        items,
        status: 'pending',
        source: 'wechat',
        import_batch: batchId,
        receiver_name: orderData.receiverName || '',
        receiver_phone: orderData.receiverPhone || '',
        receiver_address: orderData.receiverAddress || '',
        province: orderData.province || '',
        city: orderData.city || '',
        district: orderData.district || '',
        express_company: orderData.expressCompany || '',
        tracking_no: orderData.trackingNo || '',
        remark: orderData.remark || '',
        bill_date: orderData.billDate || new Date().toISOString().slice(0, 10),
      });

      if (insertError) {
        console.error(`[WeComFileProcessor] Failed to create order ${orderData.orderNo}:`, insertError);
        continue;
      }

      createdOrderIds.push(orderId);
    } catch (err) {
      console.error(`[WeComFileProcessor] Error creating order:`, err);
    }
  }

  return createdOrderIds;
}

/**
 * 发送微信消息
 */
async function sendWeComMessage(
  appConfig: WeComAppConfig,
  chatId: string,
  content: string
): Promise<void> {
  const client = new WeComAPIClient(appConfig);
  await client.sendGroupTextMessage(chatId, content);
}

/**
 * 处理文件任务（主函数）
 */
export async function processFileTask(task: WeComFileTask): Promise<{
  success: boolean;
  createdOrderIds?: string[];
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 1. 更新状态为 downloading
    await client
      .from('wecom_file_process_queue')
      .update({ status: 'downloading', updated_at: new Date().toISOString() })
      .eq('id', task.id);

    // 2. 获取应用配置
    const appConfig = task.app_id ? await getWeComAppConfig(task.app_id) : null;
    if (!appConfig || !task.media_id) {
      throw new Error('App config or media_id not found');
    }

    // 3. 下载文件
    const filePath = await downloadFile(appConfig, task.media_id, task.id);

    // 4. 更新下载路径
    await client
      .from('wecom_file_process_queue')
      .update({ download_path: filePath, status: 'parsing', updated_at: new Date().toISOString() })
      .eq('id', task.id);

    // 5. 解析 Excel
    const { headers, rows } = await parseExcelFile(filePath);

    // 6. 获取列映射
    let columnMapping: Record<string, string> = {};
    if (task.customer_id) {
      const existingMapping = await getCustomerColumnMapping(task.customer_id);
      if (existingMapping && Object.keys(existingMapping.mapping).length > 0) {
        columnMapping = existingMapping.mapping;
      }
    }

    // 如果没有历史映射，使用 column-mapping-rules 自动检测
    if (Object.keys(columnMapping).length === 0) {
      columnMapping = autoDetectColumnMapping(headers);
    }

    // 7. 使用共享的 parseExcelData 解析订单（含商品匹配 + 发货方库存匹配）
    const ordersData = await parseExcelData(client, rows, columnMapping, '');

    // 8. 更新解析的订单数量
    await client
      .from('wecom_file_process_queue')
      .update({
        parsed_order_count: ordersData.reduce((sum, o) => sum + o.items.length, 0),
        status: 'creating_orders',
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    // 9. 创建订单
    let createdOrderIds: string[] = [];
    if (task.customer_id && ordersData.length > 0) {
      createdOrderIds = await createOrdersFromParsed(client, task.customer_id, ordersData);
    }

    // 10. 更新完成状态
    await client
      .from('wecom_file_process_queue')
      .update({
        status: 'completed',
        created_order_count: createdOrderIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    // 11. 发送确认消息
    if (task.group_id && createdOrderIds.length > 0) {
      try {
        const message = `已收到订单，共 ${createdOrderIds.length} 条，正在处理中`;
        await sendWeComMessage(appConfig, task.group_id, message);
      } catch (msgErr) {
        console.error('[WeComFileProcessor] Failed to send confirmation message:', msgErr);
      }
    }

    return { success: true, createdOrderIds };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[WeComFileProcessor] Failed to process task ${task.id}:`, err);

    await client
      .from('wecom_file_process_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
        retry_count: (task.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    if (task.group_id && task.app_id) {
      try {
        const appConfig = await getWeComAppConfig(task.app_id);
        if (appConfig) {
          await sendWeComMessage(appConfig, task.group_id, `订单处理失败：${errorMessage}`);
        }
      } catch (msgErr) {
        console.error('[WeComFileProcessor] Failed to send error message:', msgErr);
      }
    }

    return { success: false, error: errorMessage };
  }
}
