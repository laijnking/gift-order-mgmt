/**
 * WeCom Plugin - Feedback Sender
 * 回单发送：扫描待回单 → 生成 Excel → 上传 → 发送
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { WeComAPIClient } from './api-client';
import { getWeComAppConfig } from './shared';
import { buildFeedbackRows, DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS } from '@/lib/feedback-exporter';
import type { WeComGroupMapping } from './types';

/**
 * 扫描待回单订单
 */
async function scanFeedbackOrders(
  mapping: WeComGroupMapping
): Promise<Array<{ id: string; customer_id: string; order_no: string; items: unknown[] }>> {
  const client = getSupabaseClient();

  // 查询已回单但未发送反馈的订单
  const { data: orders } = await client
    .from('orders')
    .select('id, customer_id, order_no, items')
    .eq('customer_id', mapping.customer_id!)
    .in('status', ['returned', 'feedbacked'])
    .order('updated_at', { ascending: true });

  if (!orders || orders.length === 0) {
    return [];
  }

  // 过滤掉已经在反馈任务中的订单
  const existingTask = await client
    .from('wecom_feedback_tasks')
    .select('order_ids')
    .eq('customer_id', mapping.customer_id!)
    .eq('group_id', mapping.group_id)
    .not('status', 'eq', 'failed')
    .maybeSingle();

  const existingOrderIds = new Set<string>();
  if (existingTask?.data?.order_ids) {
    const orderIds = Array.isArray(existingTask.data.order_ids)
      ? existingTask.data.order_ids
      : JSON.parse(JSON.stringify(existingTask.data.order_ids) || '[]');
    for (const id of orderIds) {
      existingOrderIds.add(id);
    }
  }

  return orders.filter((o) => !existingOrderIds.has(o.id));
}

/**
 * 构建回单 Excel 数据（使用共享的 buildFeedbackRows）
 */
async function buildFeedbackExcelData(
  client: ReturnType<typeof getSupabaseClient>,
  orders: Array<{ id: string; order_no: string; items: unknown[]; customer_code?: string }>,
  customerId: string
): Promise<{
  headers: string[];
  rows: (string | number | null)[][];
}> {
  // 获取客户的列名映射（优先 customer_id，fallback customer_code）
  const orderCustomerCode = orders[0]?.customer_code || '';
  const buildMappingQuery = (activeOnly: boolean) => {
    let q = client
      .from('column_mappings')
      .select('feedback_export_headers, column_order')
      .order('version', { ascending: false })
      .limit(1);
    if (activeOnly) q = q.eq('is_active', true);
    if (customerId && orderCustomerCode) {
      q = q.or(`customer_id.eq.${customerId},customer_code.eq.${orderCustomerCode}`);
    } else if (customerId) {
      q = q.eq('customer_id', customerId);
    } else if (orderCustomerCode) {
      q = q.eq('customer_code', orderCustomerCode);
    }
    return q;
  };
  let { data: mapping } = await buildMappingQuery(true).maybeSingle();
  if (!mapping) {
    const fallbackRes = await buildMappingQuery(false).maybeSingle();
    mapping = fallbackRes.data ?? null;
  }

  const rawFeedbackHeaders = mapping?.feedback_export_headers;
  const feedbackHeaders = (rawFeedbackHeaders && typeof rawFeedbackHeaders === 'object' && !Array.isArray(rawFeedbackHeaders)
    ? rawFeedbackHeaders
    : {}) as Record<string, string>;

  // 获取原始 Excel 列名顺序
  let columnOrder: string[] | undefined;
  if (mapping?.column_order && Array.isArray(mapping.column_order) && mapping.column_order.length > 0) {
    columnOrder = (mapping.column_order as unknown[]).map(String);
  }

  // 使用共享的 buildFeedbackRows 构建回单行数据
  const rowObjects = buildFeedbackRows(
    orders as Record<string, unknown>[],
    DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS,
    feedbackHeaders,
    columnOrder
  );

  if (rowObjects.length === 0) {
    return { headers: [], rows: [] };
  }

  // 从第一行提取表头（保持客户列名顺序 + 物流列在末尾）
  const headers = Object.keys(rowObjects[0]);
  const rows = rowObjects.map((obj) =>
    headers.map((h) => {
      const v = obj[h];
      return v === null || v === undefined ? '' : v;
    }) as (string | number | null)[]
  );

  return { headers, rows };
}

/**
 * 生成 Excel 文件
 */
async function generateFeedbackExcel(
  headers: string[],
  rows: (string | number | null)[][]
): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  ws['!cols'] = headers.map(() => ({ wch: 15 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '回单');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return Buffer.from(buffer);
}

/**
 * 扫描并处理回单
 */
export async function scanAndProcessFeedback(): Promise<{
  processed: number;
  errors: string[];
}> {
  const client = getSupabaseClient();
  const errors: string[] = [];
  let processed = 0;

  try {
    // 1. 获取所有激活的群映射
    const { data: mappings } = await client
      .from('wecom_group_mappings')
      .select('*')
      .eq('is_active', true)
      .eq('auto_send_feedback', true)
      .not('customer_id', 'is', null)
      .is('deleted_at', null);

    if (!mappings || mappings.length === 0) {
      return { processed: 0, errors: [] };
    }

    // 2. 对每个映射处理
    for (const mapping of mappings) {
      try {
        // 检查应用配置
        const appConfig = await getWeComAppConfig(mapping.app_id);
        if (!appConfig) {
          continue;
        }

        // 扫描待回单订单
        const orders = await scanFeedbackOrders(mapping);
        if (orders.length === 0) {
          continue;
        }

        // 创建反馈任务
        const orderIds = orders.map((o) => o.id);

        const { data: task, error: taskError } = await client
          .from('wecom_feedback_tasks')
          .insert({
            app_id: mapping.app_id,
            mapping_id: mapping.id,
            customer_id: mapping.customer_id!,
            group_id: mapping.group_id,
            order_ids: orderIds,
            orders_count: orders.length,
            status: 'pending',
          })
          .select('id')
          .single();

        if (taskError) {
          console.error(`[WeComFeedback] Failed to create task:`, taskError);
          errors.push(`创建反馈任务失败: ${taskError.message}`);
          continue;
        }

        // 3. 构建 Excel 数据
        const { headers, rows } = await buildFeedbackExcelData(client, orders, mapping.customer_id!);

        // 4. 更新状态为 exporting
        await client
          .from('wecom_feedback_tasks')
          .update({ status: 'exporting', updated_at: new Date().toISOString() })
          .eq('id', task.id);

        // 5. 生成 Excel
        const excelBuffer = await generateFeedbackExcel(headers, rows);

        // 6. 更新状态为 uploading
        await client
          .from('wecom_feedback_tasks')
          .update({ status: 'uploading', updated_at: new Date().toISOString() })
          .eq('id', task.id);

        // 7. 上传并发送
        const apiClient = new WeComAPIClient(appConfig);
        const fileName = `回单_${new Date().toISOString().slice(0, 10)}.xlsx`;

        await apiClient.sendFeedbackMessage(
          mapping.group_id,
          `订单回单已生成，共 ${orders.length} 条，请查收`,
          excelBuffer,
          fileName
        );

        // 8. 更新完成状态
        await client
          .from('wecom_feedback_tasks')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[WeComFeedback] Failed to process feedback for mapping ${mapping.id}:`, err);
        errors.push(`映射 ${mapping.id}: ${errorMessage}`);

        // 更新任务状态为失败
        await client
          .from('wecom_feedback_tasks')
          .update({
            status: 'failed',
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', (err as { taskId?: string }).taskId || '');
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[WeComFeedback] Scan error:', err);
    errors.push(`扫描错误: ${errorMessage}`);
  }

  return { processed, errors };
}

/**
 * 重发反馈任务
 */
export async function resendFeedbackTask(taskId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getSupabaseClient();

  try {
    // 获取任务
    const { data: task } = await client
      .from('wecom_feedback_tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // 获取应用配置
    const appConfig = await getWeComAppConfig(task.app_id || '');
    if (!appConfig) {
      return { success: false, error: 'App config not found' };
    }

    // 获取订单数据
    const orderIds = Array.isArray(task.order_ids)
      ? task.order_ids
      : JSON.parse(JSON.stringify(task.order_ids) || '[]');

    const { data: orders } = await client
      .from('orders')
      .select('id, customer_id, order_no, items')
      .in('id', orderIds);

    if (!orders || orders.length === 0) {
      return { success: false, error: 'No orders found' };
    }

    // 构建 Excel
    const { headers, rows } = await buildFeedbackExcelData(client, orders as Array<{ id: string; order_no: string; items: unknown[] }>, task.customer_id);
    const excelBuffer = await generateFeedbackExcel(headers, rows);

    // 发送
    const apiClient = new WeComAPIClient(appConfig);
    const fileName = `回单_${new Date().toISOString().slice(0, 10)}.xlsx`;

    await apiClient.sendFeedbackMessage(
      task.group_id,
      `订单回单已生成，共 ${orders.length} 条，请查收`,
      excelBuffer,
      fileName
    );

    // 更新状态
    await client
      .from('wecom_feedback_tasks')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: null,
        retry_count: (task.retry_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[WeComFeedback] Failed to resend task ${taskId}:`, err);

    await client
      .from('wecom_feedback_tasks')
      .update({
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return { success: false, error: errorMessage };
  }
}
