/**
 * 订单服务层 — 从 /api/orders/route.ts 提取的可复用业务逻辑
 *
 * 提取原则：不改变 API 契约，仅将业务逻辑下沉到服务层，路由层只做参数解析和响应格式化。
 *
 * 更新历史：
 * - v1.1 (2026-05-01): 提取 buildRelatedMaps、findCustomerIdByCode 等查找函数
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

  const existingIdSet = new Set((existingOrders || []).map(o => o.id as string));
  for (const id of orderIds) {
    if (!existingIdSet.has(id)) {
      result.failed.push({ id, reason: '订单不存在' });
    }
  }

  if (validIds.length === 0) return result;

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

// ============================================================
// 通用查找函数
// ============================================================

/** 提取纯姓名（去除括号内容） */
export function extractName(realName: string): string {
  return realName.replace(/\s*[\（\(].*[\）\)].*$/, '').trim();
}

/** 根据 username 获取用户的真实姓名 */
export async function getUserRealNameByUsername(
  client: ReturnType<typeof getSupabaseClient>,
  username: string
): Promise<string | null> {
  if (!username) return null;
  const { data: users } = await client
    .from('users')
    .select('real_name')
    .eq('username', username)
    .limit(1);
  return users?.[0]?.real_name || null;
}

/** 根据名称查找用户ID */
export async function findUserIdByName(
  client: ReturnType<typeof getSupabaseClient>,
  name: string
): Promise<string | null> {
  if (!name) return null;
  const pureName = extractName(name);
  const { data: users } = await client
    .from('users')
    .select('id, real_name')
    .ilike('real_name', `%${pureName}%`)
    .limit(1);
  return users?.[0]?.id || null;
}

/** 根据客户代码查找客户ID和名称 */
export async function findCustomerIdByCode(
  client: ReturnType<typeof getSupabaseClient>,
  code: string
): Promise<{ id: string; name: string } | null> {
  if (!code) return null;
  const { data: customers } = await client
    .from('customers')
    .select('id, name')
    .eq('code', code)
    .limit(1);
  if (customers?.[0]) {
    return { id: customers[0].id, name: customers[0].name };
  }
  const { data: customersByName } = await client
    .from('customers')
    .select('id, name')
    .ilike('name', `%${code}%`)
    .limit(1);
  return customersByName?.[0] ? { id: customersByName[0].id, name: customersByName[0].name } : null;
}

/** 根据发货方名称查找发货方ID（统一查询 shippers 表） */
export async function findSupplierIdByName(
  client: ReturnType<typeof getSupabaseClient>,
  name: string
): Promise<{ id: string; name: string } | null> {
  if (!name) return null;
  const { data: shippers } = await client
    .from('shippers')
    .select('id, name')
    .eq('is_active', true)
    .ilike('name', `%${name}%`)
    .limit(1);
  return shippers?.[0] ? { id: shippers[0].id, name: shippers[0].name } : null;
}

/** 根据仓库名称查找仓库ID */
export async function findWarehouseIdByName(
  client: ReturnType<typeof getSupabaseClient>,
  name: string
): Promise<{ id: string; name: string } | null> {
  if (!name) return null;
  const { data: warehouses } = await client
    .from('warehouses')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .limit(1);
  return warehouses?.[0] ? { id: warehouses[0].id, name: warehouses[0].name } : null;
}

// ============================================================
// 批量关联数据构建
// ============================================================

/** 批量构建订单关联档案映射（客户、用户、发货方、仓库） */
export async function buildRelatedMaps(
  client: ReturnType<typeof getSupabaseClient>,
  orders: Record<string, unknown>[]
) {
  const userIds = new Set<string>();
  const customerCodes = new Set<string>();
  const supplierIds = new Set<string>();
  const warehouseIds = new Set<string>();

  for (const order of orders) {
    if (order.salesperson_id) userIds.add(order.salesperson_id as string);
    if (order.operator_id) userIds.add(order.operator_id as string);
    if (order.customer_code) customerCodes.add(order.customer_code as string);
    if (order.supplier_id) supplierIds.add(order.supplier_id as string);
    if (order.warehouse_id) warehouseIds.add(order.warehouse_id as string);
  }

  const userMap: Record<string, { id: string; realName: string }> = {};
  if (userIds.size > 0) {
    const { data: users } = await client
      .from('users')
      .select('id, real_name')
      .in('id', Array.from(userIds));
    users?.forEach(u => { userMap[u.id] = { id: u.id, realName: u.real_name }; });
  }

  const customerMap: Record<string, { id: string; salesUserName: string; operatorUserName: string }> = {};
  if (customerCodes.size > 0) {
    const { data: customers } = await client
      .from('customers')
      .select('code, id, salesperson_name, order_taker_name')
      .in('code', Array.from(customerCodes));
    customers?.forEach(c => {
      customerMap[c.code] = {
        id: c.id,
        salesUserName: c.salesperson_name || '',
        operatorUserName: c.order_taker_name || '',
      };
    });
  }

  const supplierMap: Record<string, { id: string; name: string }> = {};
  if (supplierIds.size > 0) {
    const { data: shippers } = await client
      .from('shippers')
      .select('id, name')
      .in('id', Array.from(supplierIds));
    shippers?.forEach(s => { supplierMap[s.id] = { id: s.id, name: s.name }; });
  }

  const warehouseMap: Record<string, { id: string; name: string }> = {};
  if (warehouseIds.size > 0) {
    const { data: warehouses } = await client
      .from('warehouses')
      .select('id, name')
      .in('id', Array.from(warehouseIds));
    warehouses?.forEach(w => { warehouseMap[w.id] = { id: w.id, name: w.name }; });
  }

  return { userMap, customerMap, supplierMap, warehouseMap };
}
