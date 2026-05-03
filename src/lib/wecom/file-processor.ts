/**
 * WeCom Plugin - File Processor
 * 文件处理：下载 → 解析 → 创建订单
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { WeComAPIClient } from './api-client';
import type {
  WeComFileTask,
  WeComAppConfig,
  CustomerMatchResult,
} from './types';

// 导入解析相关函数（稍后从 order-parser.ts 导入）
// 目前先内联必要逻辑，后续会提取

const DOWNLOAD_DIR = process.env.WECOM_DOWNLOAD_DIR || '/tmp/wecom-files';

/**
 * 获取应用配置
 */
async function getAppConfig(appId: string): Promise<WeComAppConfig | null> {
  const client = getSupabaseClient();
  const { data } = await client
    .from('wecom_app_config')
    .select('*')
    .eq('id', appId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}

/**
 * 获取客户历史列映射
 */
async function getCustomerColumnMapping(customerId: string): Promise<{
  id: string;
  mapping: Record<string, string>;
  feedbackHeaders: Record<string, string>;
} | null> {
  const client = getSupabaseClient();

  // 获取最新的活跃映射
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

  // 确保目录存在
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

  // 第一行是表头
  const headers = data[0].map((h) => String(h ?? ''));
  const rows = data.slice(1);

  return { headers, rows };
}

/**
 * 自动检测列映射
 */
async function autoDetectColumnMapping(headers: string[]): Promise<Record<string, string>> {
  const client = getSupabaseClient();

  // 简化实现：按表头文本匹配
  const mapping: Record<string, string> = {};

  // 定义标准字段及其可能的表头关键词
  const fieldPatterns: Record<string, string[]> = {
    customer_order_no: ['订单号', '客户订单号', 'order_no', '订单编号'],
    order_no: ['订单号', '客户订单号', 'order_no', '订单编号'],
    product_name: ['商品名称', '产品名称', 'product_name', '品名', '商品', '产品'],
    product_spec: ['规格', '型号', 'spec', 'product_spec', '商品规格'],
    product_code: ['商品编码', '产品编码', 'product_code', '编码'],
    quantity: ['数量', 'quantity', 'qty', '件数'],
    price: ['单价', 'price', '价格', '批发价'],
    receiver_name: ['收货人', '收件人', 'receiver_name', '姓名', '收货人姓名'],
    receiver_phone: ['手机', '电话', 'phone', '手机号', '联系电话', 'receiver_phone'],
    receiver_address: ['地址', '收货地址', 'address', 'receiver_address', '详细地址'],
    express_company: ['快递', '快递公司', 'express', '物流'],
    tracking_no: ['单号', '运单号', 'tracking', 'tracking_no', '快递单号'],
    remark: ['备注', 'remark', '说明'],
    bill_date: ['日期', '订单日期', 'bill_date', '下单日期'],
  };

  for (const [field, keywords] of Object.entries(fieldPatterns)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().trim();
      const matched = keywords.some((keyword) =>
        header.includes(keyword.toLowerCase())
      );
      if (matched && !mapping[i.toString()]) {
        mapping[i.toString()] = field;
        break;
      }
    }
  }

  return mapping;
}

/**
 * 解析订单数据
 */
async function parseOrders(
  client: ReturnType<typeof getSupabaseClient>,
  rows: (string | number | null)[][],
  columnMapping: Record<string, string>,
  customerCode: string
): Promise<Array<{
  orderNo: string;
  items: Array<{
    customerProductName: string;
    customerProductSpec: string;
    customerProductCode: string;
    quantity: number;
    price: number | null;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    expressCompany: string;
    trackingNo: string;
    remark: string;
  }>;
}>> {
  const orders = new Map<string, {
    orderNo: string;
    items: Array<{
      customerProductName: string;
      customerProductSpec: string;
      customerProductCode: string;
      quantity: number;
      price: number | null;
      receiverName: string;
      receiverPhone: string;
      receiverAddress: string;
      expressCompany: string;
      trackingNo: string;
      remark: string;
    }>;
  }>();

  const getFieldValue = (row: (string | number | null)[], field: string): string => {
    for (const [colIdx, mappedField] of Object.entries(columnMapping)) {
      if (mappedField === field) {
        const value = row[parseInt(colIdx)];
        return value === null || value === undefined ? '' : String(value).trim();
      }
    }
    return '';
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const customerOrderNo = getFieldValue(row, 'customer_order_no');
    const orderNo = getFieldValue(row, 'order_no') || customerOrderNo || `WECOM-${Date.now()}-${i}`;
    const productName = getFieldValue(row, 'product_name');
    const productSpec = getFieldValue(row, 'product_spec');
    const productCode = getFieldValue(row, 'product_code');
    const quantity = parseInt(getFieldValue(row, 'quantity')) || 1;
    const price = parseFloat(getFieldValue(row, 'price')) || null;
    const receiverName = getFieldValue(row, 'receiver_name');
    const receiverPhone = getFieldValue(row, 'receiver_phone');
    const receiverAddress = getFieldValue(row, 'receiver_address');
    const expressCompany = getFieldValue(row, 'express_company');
    const trackingNo = getFieldValue(row, 'tracking_no');
    const remark = getFieldValue(row, 'remark');

    if (!productName) continue;

    let order = orders.get(orderNo);
    if (!order) {
      order = { orderNo, items: [] };
      orders.set(orderNo, order);
    }

    order.items.push({
      customerProductName: productName,
      customerProductSpec: productSpec,
      customerProductCode: productCode,
      quantity,
      price,
      receiverName,
      receiverPhone,
      receiverAddress,
      expressCompany,
      trackingNo,
      remark,
    });
  }

  return Array.from(orders.values());
}

/**
 * 创建订单
 */
async function createOrders(
  client: ReturnType<typeof getSupabaseClient>,
  customerId: string,
  ordersData: Array<{
    orderNo: string;
    items: Array<{
      customerProductName: string;
      customerProductSpec: string;
      customerProductCode: string;
      quantity: number;
      price: number | null;
      receiverName: string;
      receiverPhone: string;
      receiverAddress: string;
      expressCompany: string;
      trackingNo: string;
      remark: string;
    }>;
  }>
): Promise<string[]> {
  const createdOrderIds: string[] = [];
  const batchId = `WECOM-${Date.now()}`;

  for (const orderData of ordersData) {
    try {
      // 提取地址
      const addressParts = extractAddressParts(orderData.items[0]?.receiverAddress || '');

      // 构建订单 items
      const items = orderData.items.map((item, idx) => ({
        id: `${batchId}-${idx}`,
        customerProductName: item.customerProductName,
        customerProductSpec: item.customerProductSpec,
        customerProductCode: item.customerProductCode,
        customerBarcode: '',
        systemProductId: null,
        systemProductName: null,
        systemProductSpec: null,
        systemProductCode: null,
        systemProductBrand: null,
        systemProductPrice: item.price,
        matchType: null,
        matchHint: null,
        supplierMatches: [],
        quantity: item.quantity,
        price: item.price,
        remark: item.remark,
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
        receiver_name: orderData.items[0]?.receiverName || '',
        receiver_phone: orderData.items[0]?.receiverPhone || '',
        receiver_address: orderData.items[0]?.receiverAddress || '',
        province: addressParts.province,
        city: addressParts.city,
        district: addressParts.district,
        express_company: orderData.items[0]?.expressCompany || '',
        tracking_no: orderData.items[0]?.trackingNo || '',
        remark: orderData.items[0]?.remark || '',
        bill_date: new Date().toISOString().slice(0, 10),
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
 * 提取地址的省市区
 */
function extractAddressParts(address: string): { province: string; city: string; district: string } {
  const provinceMatch = address.match(/^([^省市区县]+省|北京|上海|天津|重庆|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)/);
  const province = provinceMatch ? provinceMatch[1] : '';

  let remaining = address.slice(province.length);
  const cityMatch = remaining.match(/^([^市]+市)/);
  const city = cityMatch ? cityMatch[1] : '';

  remaining = remaining.slice(city.length);
  const districtMatch = remaining.match(/^([^区]+区|([^县]+县))/);
  const district = districtMatch ? (districtMatch[1] || districtMatch[2] || '') : '';

  return { province, city, district };
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
    const appConfig = task.app_id ? await getAppConfig(task.app_id) : null;
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

    // 如果没有历史映射，自动检测
    if (Object.keys(columnMapping).length === 0) {
      columnMapping = await autoDetectColumnMapping(headers);
    }

    // 7. 解析订单
    const ordersData = await parseOrders(client, rows, columnMapping, '');

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
      createdOrderIds = await createOrders(client, task.customer_id, ordersData);
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

    // 更新失败状态
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

    // 发送失败通知
    if (task.group_id && task.app_id) {
      try {
        const appConfig = await getAppConfig(task.app_id);
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
