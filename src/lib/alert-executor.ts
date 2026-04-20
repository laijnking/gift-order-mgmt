import { getSupabaseClient } from '@/storage/database/supabase-client';

type AlertRuleRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  config: Record<string, unknown> | null;
  priority: number | null;
  is_enabled: boolean;
};

type AlertRecordRow = {
  id: string;
  rule_code: string;
  order_id?: string | null;
  stock_id?: string | null;
  is_resolved: boolean;
};

type ExecuteAlertRulesOptions = {
  ruleId?: string;
  ruleCode?: string;
  type?: string;
};

type RuleExecutionSummary = {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  triggered: number;
  reused: number;
  resolved: number;
};

type ExecuteAlertRulesResult = {
  executedRules: number;
  summaries: RuleExecutionSummary[];
  totals: {
    triggered: number;
    reused: number;
    resolved: number;
  };
};

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

async function fetchUnresolvedRecords(ruleCode: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_records')
    .select('id, rule_code, order_id, stock_id, is_resolved')
    .eq('rule_code', ruleCode)
    .eq('is_resolved', false);

  if (error) {
    throw new Error(`查询未处理预警失败: ${error.message}`);
  }

  return (data || []) as AlertRecordRow[];
}

async function markResolved(ids: string[], resolution: string) {
  if (ids.length === 0) return 0;

  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_records')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: 'alert_executor',
      resolution,
    })
    .in('id', ids);

  if (error) {
    throw new Error(`更新预警处理状态失败: ${error.message}`);
  }

  return ids.length;
}

async function createAlertRecord(payload: Record<string, unknown>) {
  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_records')
    .insert(payload);

  if (error) {
    throw new Error(`创建预警记录失败: ${error.message}`);
  }
}

async function executeLowStockRule(rule: AlertRuleRecord): Promise<RuleExecutionSummary> {
  const client = getSupabaseClient();
  const config = rule.config || {};
  const threshold = toNumber(config.threshold, 2);
  const compare = String(config.compare || 'lte').toLowerCase();

  let query = client
    .from('stocks')
    .select('id, product_code, product_name, supplier_id, supplier_name, quantity, status')
    .eq('status', 'active');

  query = compare === 'lt' ? query.lt('quantity', threshold) : query.lte('quantity', threshold);

  const { data, error } = await query;
  if (error) {
    throw new Error(`执行库存预警失败: ${error.message}`);
  }

  const matches = (data || []) as Array<Record<string, unknown>>;
  const unresolved = await fetchUnresolvedRecords(rule.code);
  const unresolvedByStock = new Map(
    unresolved.filter((record) => record.stock_id).map((record) => [record.stock_id as string, record])
  );

  let triggered = 0;
  let reused = 0;

  for (const stock of matches) {
    const stockId = String(stock.id);
    if (unresolvedByStock.has(stockId)) {
      reused += 1;
      unresolvedByStock.delete(stockId);
      continue;
    }

    const quantity = toNumber(stock.quantity, 0);
    await createAlertRecord({
      rule_id: rule.id,
      rule_code: rule.code,
      stock_id: stockId,
      alert_type: quantity === 0 ? 'out_of_stock' : 'low_stock',
      alert_level: quantity === 0 ? 'error' : 'warning',
      title: quantity === 0 ? '库存已耗尽' : '库存不足预警',
      content: `${stock.product_name || '商品'} 在「${stock.supplier_name || '未知发货方'}」库存剩余 ${quantity} 台`,
      data: {
        stockId,
        threshold,
        quantity,
        supplierName: stock.supplier_name || '',
        productName: stock.product_name || '',
      },
      is_read: false,
      is_resolved: false,
      created_at: new Date().toISOString(),
    });
    triggered += 1;
  }

  const resolved = await markResolved(
    Array.from(unresolvedByStock.values()).map((record) => record.id),
    '库存已恢复到阈值以上，自动关闭预警'
  );

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    ruleName: rule.name,
    triggered,
    reused,
    resolved,
  };
}

async function executeOrderTimeoutRule(rule: AlertRuleRecord): Promise<RuleExecutionSummary> {
  const client = getSupabaseClient();
  const timeoutHours = toNumber(rule.config?.timeout_hours, 24);
  const cutoff = hoursAgo(timeoutHours);

  const { data, error } = await client
    .from('orders')
    .select('id, order_no, customer_code, customer_name, created_at, status')
    .eq('status', 'pending')
    .lte('created_at', cutoff);

  if (error) {
    throw new Error(`执行订单超时预警失败: ${error.message}`);
  }

  const matches = (data || []) as Array<Record<string, unknown>>;
  const unresolved = await fetchUnresolvedRecords(rule.code);
  const unresolvedByOrder = new Map(
    unresolved.filter((record) => record.order_id).map((record) => [record.order_id as string, record])
  );

  let triggered = 0;
  let reused = 0;

  for (const order of matches) {
    const orderId = String(order.id);
    if (unresolvedByOrder.has(orderId)) {
      reused += 1;
      unresolvedByOrder.delete(orderId);
      continue;
    }

    await createAlertRecord({
      rule_id: rule.id,
      rule_code: rule.code,
      order_id: orderId,
      order_no: order.order_no || '',
      alert_type: 'order_timeout',
      alert_level: 'warning',
      title: '订单超时预警',
      content: `订单 ${order.order_no || ''} 已待派发超过 ${timeoutHours} 小时`,
      data: {
        orderId,
        timeoutHours,
        createdAt: order.created_at,
        status: order.status,
      },
      is_read: false,
      is_resolved: false,
      created_at: new Date().toISOString(),
    });
    triggered += 1;
  }

  const resolved = await markResolved(
    Array.from(unresolvedByOrder.values()).map((record) => record.id),
    '订单已不再满足超时条件，自动关闭预警'
  );

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    ruleName: rule.name,
    triggered,
    reused,
    resolved,
  };
}

async function executeReturnDelayRule(rule: AlertRuleRecord): Promise<RuleExecutionSummary> {
  const client = getSupabaseClient();
  const delayHours = toNumber(rule.config?.delay_hours, 48);
  const cutoff = hoursAgo(delayHours);

  const { data, error } = await client
    .from('orders')
    .select('id, order_no, customer_code, customer_name, assigned_at, status, tracking_no')
    .in('status', ['assigned', 'partial_returned'])
    .lte('assigned_at', cutoff);

  if (error) {
    throw new Error(`执行回单超时预警失败: ${error.message}`);
  }

  const matches = ((data || []) as Array<Record<string, unknown>>).filter(
    (order) => !order.tracking_no
  );
  const unresolved = await fetchUnresolvedRecords(rule.code);
  const unresolvedByOrder = new Map(
    unresolved.filter((record) => record.order_id).map((record) => [record.order_id as string, record])
  );

  let triggered = 0;
  let reused = 0;

  for (const order of matches) {
    const orderId = String(order.id);
    if (unresolvedByOrder.has(orderId)) {
      reused += 1;
      unresolvedByOrder.delete(orderId);
      continue;
    }

    await createAlertRecord({
      rule_id: rule.id,
      rule_code: rule.code,
      order_id: orderId,
      order_no: order.order_no || '',
      alert_type: 'return_delay',
      alert_level: 'warning',
      title: '回单超时预警',
      content: `订单 ${order.order_no || ''} 派发超过 ${delayHours} 小时仍未回传物流单号`,
      data: {
        orderId,
        delayHours,
        assignedAt: order.assigned_at,
        status: order.status,
      },
      is_read: false,
      is_resolved: false,
      created_at: new Date().toISOString(),
    });
    triggered += 1;
  }

  const resolved = await markResolved(
    Array.from(unresolvedByOrder.values()).map((record) => record.id),
    '订单已回传物流或不再满足回单超时条件，自动关闭预警'
  );

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    ruleName: rule.name,
    triggered,
    reused,
    resolved,
  };
}

async function executeRule(rule: AlertRuleRecord): Promise<RuleExecutionSummary> {
  if (rule.code === 'LOW_STOCK_ALERT' || rule.type === 'stock') {
    return executeLowStockRule(rule);
  }

  if (rule.code === 'ORDER_TIMEOUT_ALERT' || rule.type === 'order') {
    return executeOrderTimeoutRule(rule);
  }

  if (rule.code === 'RETURN_DELAY_ALERT' || rule.type === 'return') {
    return executeReturnDelayRule(rule);
  }

  return {
    ruleId: rule.id,
    ruleCode: rule.code,
    ruleName: rule.name,
    triggered: 0,
    reused: 0,
    resolved: 0,
  };
}

export async function executeAlertRules(
  options: ExecuteAlertRulesOptions = {}
): Promise<ExecuteAlertRulesResult> {
  const client = getSupabaseClient();
  let query = client
    .from('alert_rules')
    .select('id, code, name, type, config, priority, is_enabled')
    .eq('is_enabled', true)
    .order('priority', { ascending: false });

  if (options.ruleId) {
    query = query.eq('id', options.ruleId);
  }
  if (options.ruleCode) {
    query = query.eq('code', options.ruleCode);
  }
  if (options.type) {
    query = query.eq('type', options.type);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`加载预警规则失败: ${error.message}`);
  }

  const rules = (data || []) as AlertRuleRecord[];
  const summaries: RuleExecutionSummary[] = [];

  for (const rule of rules) {
    summaries.push(await executeRule(rule));
  }

  return {
    executedRules: summaries.length,
    summaries,
    totals: summaries.reduce(
      (acc, summary) => {
        acc.triggered += summary.triggered;
        acc.reused += summary.reused;
        acc.resolved += summary.resolved;
        return acc;
      },
      { triggered: 0, reused: 0, resolved: 0 }
    ),
  };
}
