import type { getSupabaseClient } from '@/storage/database/supabase-client';

type DbClient = ReturnType<typeof getSupabaseClient>;
type Row = Record<string, unknown>;

function asText(...values: unknown[]) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

function asNullableText(...values: unknown[]) {
  const text = asText(...values);
  return text || null;
}

function asNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toDateOnly(value?: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function toCurrencyCents(value: number) {
  return Math.round(value * 100);
}

function allocateCents(total: number, weights: number[]) {
  const totalCents = toCurrencyCents(total);
  if (weights.length === 0) return [];
  if (totalCents === 0) return weights.map(() => 0);

  const normalizedWeights = weights.map((weight) => (weight > 0 ? weight : 0));
  const weightSum = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
  const effectiveWeights = weightSum > 0 ? normalizedWeights : normalizedWeights.map(() => 1);
  const effectiveWeightSum = effectiveWeights.reduce((sum, weight) => sum + weight, 0);

  let allocated = 0;
  return effectiveWeights.map((weight, index) => {
    if (index === effectiveWeights.length - 1) {
      return totalCents - allocated;
    }

    const cents = Math.floor((totalCents * weight) / effectiveWeightSum);
    allocated += cents;
    return cents;
  });
}

async function findExistingDispatchCostRecord(
  client: DbClient,
  payload: {
    orderId: string;
    supplierId: string;
    productCode: string | null;
    productName: string | null;
    warehouseId: string | null;
  }
) {
  const { data, error } = await client
    .from('order_cost_history')
    .select('*')
    .eq('order_id', payload.orderId)
    .eq('supplier_id', payload.supplierId);

  if (error) {
    throw new Error(`查询历史成本失败: ${error.message}`);
  }

  const rows = ((data || []) as Row[]);
  return rows.find((row) => {
    const rowProductCode = asNullableText(row.product_code);
    if (payload.productCode && rowProductCode && rowProductCode === payload.productCode) {
      return true;
    }

    const rowProductName = asNullableText(row.product_name);
    const rowWarehouseId = asNullableText(row.warehouse_id);
    return (
      payload.productName &&
      rowProductName === payload.productName &&
      rowWarehouseId === payload.warehouseId
    );
  }) || null;
}

export async function recordOrderCostFromDispatch(
  client: DbClient,
  payload: {
    order: Row;
    supplier: Row;
    stock?: Row | null;
    item?: Row | null;
    quantity: number;
    unitCost: number;
    batchNo: string;
    shippedAt?: string;
  }
) {
  const orderId = asText(payload.order.id);
  const supplierId = asText(payload.supplier.id);
  const productCode = asNullableText(
    payload.stock?.product_code,
    payload.item?.product_code,
    payload.item?.productCode
  );
  const productName = asNullableText(
    payload.stock?.product_name,
    payload.item?.product_name,
    payload.item?.productName
  );
  const warehouseId = asNullableText(payload.stock?.warehouse_id);
  const existing = await findExistingDispatchCostRecord(client, {
    orderId,
    supplierId,
    productCode,
    productName,
    warehouseId,
  });

  if (existing) {
    return { reusedExistingRecord: true, recordId: asText(existing.id) };
  }

  const totalCost = roundCurrency(payload.unitCost * payload.quantity);
  const shippedDate = toDateOnly(payload.shippedAt);
  const now = new Date().toISOString();

  const { error } = await client.from('order_cost_history').insert({
    order_id: orderId,
    order_no: payload.order.order_no,
    match_code: payload.order.match_code || null,
    supplier_id: supplierId,
    supplier_name: payload.supplier.name,
    warehouse_id: payload.stock?.warehouse_id || null,
    warehouse_name: payload.stock?.warehouse_name || null,
    product_code: productCode,
    product_name: productName,
    quantity: payload.quantity,
    unit_cost: payload.unitCost,
    total_cost: totalCost,
    express_fee: 0,
    other_fee: 0,
    total_amount: totalCost,
    receiver_name: payload.order.receiver_name || null,
    receiver_phone: payload.order.receiver_phone || null,
    receiver_address: payload.order.receiver_address || null,
    customer_code: payload.order.customer_code || null,
    customer_name: payload.order.customer_name || null,
    salesperson: payload.order.salesperson || null,
    operator_name: payload.order.operator_name || null,
    order_date: toDateOnly(payload.order.created_at),
    shipped_date: shippedDate,
    dispatch_batch: payload.batchNo,
    remark: payload.order.remark || null,
    created_at: now,
    updated_at: now,
  });

  if (error) {
    throw new Error(`写入历史成本失败: ${error.message}`);
  }

  return { reusedExistingRecord: false, recordId: null };
}

export async function syncOrderCostHistoryAfterReturn(
  client: DbClient,
  payload: {
    orderId: string;
    expressCompany?: string | null;
    trackingNo?: string | null;
    returnedAt?: string;
  }
) {
  const updatePayload: Row = {
    updated_at: payload.returnedAt || new Date().toISOString(),
    returned_date: toDateOnly(payload.returnedAt),
  };

  if (payload.expressCompany) {
    updatePayload.express_company = payload.expressCompany;
  }

  if (payload.trackingNo) {
    updatePayload.tracking_no = payload.trackingNo;
  }

  const { error } = await client
    .from('order_cost_history')
    .update(updatePayload)
    .eq('order_id', payload.orderId);

  if (error) {
    throw new Error(`更新历史成本回单信息失败: ${error.message}`);
  }
}

export async function updateOrderCostHistoryFees(
  client: DbClient,
  payload: {
    orderId?: string;
    orderNo?: string;
    expressFee: number;
    otherFee?: number;
    remark?: string;
  }
) {
  let query = client
    .from('order_cost_history')
    .select('id, order_id, order_no, total_cost, remark');

  if (payload.orderId) {
    query = query.eq('order_id', payload.orderId);
  } else if (payload.orderNo) {
    query = query.eq('order_no', payload.orderNo);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`查询历史成本失败: ${error.message}`);
  }

  const records = ((data || []) as Row[]);
  if (records.length === 0) {
    return null;
  }

  const expressFee = roundCurrency(payload.expressFee);
  const otherFee = roundCurrency(payload.otherFee || 0);
  const weights = records.map((record) => asNumber(record.total_cost));
  const expressAllocations = allocateCents(expressFee, weights);
  const otherAllocations = allocateCents(otherFee, weights);
  const now = new Date().toISOString();

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const lineExpressFee = expressAllocations[index] / 100;
    const lineOtherFee = otherAllocations[index] / 100;
    const lineTotalCost = asNumber(record.total_cost);

    const { error: updateError } = await client
      .from('order_cost_history')
      .update({
        express_fee: lineExpressFee,
        other_fee: lineOtherFee,
        total_amount: roundCurrency(lineTotalCost + lineExpressFee + lineOtherFee),
        remark: payload.remark !== undefined ? payload.remark : record.remark || null,
        updated_at: now,
      })
      .eq('id', record.id);

    if (updateError) {
      throw new Error(`更新历史成本费用失败: ${updateError.message}`);
    }
  }

  return {
    updatedCount: records.length,
    orderIds: Array.from(new Set(records.map((record) => asText(record.order_id)).filter(Boolean))),
    orderNos: Array.from(new Set(records.map((record) => asText(record.order_no)).filter(Boolean))),
    expressFee,
    otherFee,
    totalAmount: roundCurrency(
      records.reduce((sum, record) => sum + asNumber(record.total_cost), 0) + expressFee + otherFee
    ),
  };
}
