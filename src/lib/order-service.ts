/**
 * 订单服务层 — 从 /api/orders/route.ts 提取的可复用业务逻辑
 *
 * 提取原则：不改变 API 契约，仅将业务逻辑下沉到服务层，路由层只做参数解析和响应格式化。
 *
 * 更新历史：
 * - v1.0 (2026-05-01): 从 route.ts 提取 generateSysOrderNo、批量状态变更
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/** 批量操作结果（统一模型） */
export interface BulkOpResult {
  successCount: number;
  skippedCount: number;
  failed: Array<{ id: string; reason: string }>;
}

/**
 * 生成系统订单号: SYS-YYYYMMDD-XXXX-TIMESTAMP+RANDOM
 */
export async function generateSysOrderNo(client?: ReturnType<typeof getSupabaseClient>): Promise<string> {
  const db = client || getSupabaseClient();
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');

  const startOfDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`;
  const { count } = await db
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay);

  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const seq = (count || 0) + 1;
  return `SYS-${dateStr}-${String(seq).padStart(4, '0')}-${timestamp}${random}`;
}

/**
 * 批量更新订单状态（带校验和结果追踪）
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  targetStatus: string,
  allowedStatuses: string[],
  client?: ReturnType<typeof getSupabaseClient>
): Promise<BulkOpResult> {
  const db = client || getSupabaseClient();
  const result: BulkOpResult = { successCount: 0, skippedCount: 0, failed: [] };

  if (!orderIds.length) return result;

  // 先查询当前状态
  const { data: existingOrders, error: queryError } = await db
    .from('orders')
    .select('id, status')
    .in('id', orderIds);

  if (queryError) {
    orderIds.forEach(id => result.failed.push({ id, reason: `查询失败: ${queryError.message}` }));
    return result;
  }

  const allowedSet = new Set(allowedStatuses);
  const validIds: string[] = [];
  const now = new Date().toISOString();

  for (const order of existingOrders || []) {
    if (allowedSet.has(order.status as string)) {
      validIds.push(order.id as string);
    } else {
      result.failed.push({
        id: order.id as string,
        reason: `当前状态 ${order.status} 不允许转换为 ${targetStatus}`,
      });
    }
  }

  // 跳过不在数据库中的 ID
  const existingIdSet = new Set((existingOrders || []).map(o => o.id as string));
  for (const id of orderIds) {
    if (!existingIdSet.has(id)) {
      result.failed.push({ id, reason: '订单不存在' });
    }
  }

  if (validIds.length === 0) return result;

  // 批量更新
  const { error: updateError } = await db
    .from('orders')
    .update({ status: targetStatus, updated_at: now })
    .in('id', validIds);

  if (updateError) {
    validIds.forEach(id => result.failed.push({ id, reason: `更新失败: ${updateError.message}` }));
    return result;
  }

  result.successCount = validIds.length;
  return result;
}
