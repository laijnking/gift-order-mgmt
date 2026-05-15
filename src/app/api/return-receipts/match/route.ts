import { NextRequest, NextResponse } from 'next/server';
import { syncOrderCostHistoryAfterReturn } from '@/lib/order-cost-history';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { PERMISSIONS } from '@/lib/permissions';

type ReceiptRow = {
  id: string;
  record_id: string;
  supplier_id?: string | null;
  supplier_order_no?: string | null;
  customer_order_no?: string | null;
  express_company?: string | null;
  tracking_no?: string | null;
  freight_cost?: number | null;
};

type OrderRow = {
  id: string;
  order_no: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
};

async function collectOrderCandidates(
  client: ReturnType<typeof getSupabaseClient>,
  receipt: ReceiptRow,
  tenantId: string,
) {
  const candidates = new Map<string, OrderRow>();

  const appendCandidates = (orders: OrderRow[] | null | undefined) => {
    for (const order of orders || []) {
      if (!candidates.has(order.id)) {
        candidates.set(order.id, order);
      }
    }
  };

  // 匹配优先级：系统订单号精确匹配 > 客户订单号精确匹配 > 客户订单号模糊匹配
  // 不再强制依赖 supplier_id，按订单号全局匹配

  // 1. 优先按系统订单号精确匹配
  if (receipt.customer_order_no) {
    // 先尝试作为系统订单号 (sys_order_no) 精确匹配
    const { data: sysOrderData, error: sysOrderError } = await client
      .from('orders')
      .select('id, order_no, supplier_id, supplier_name')
      .eq('sys_order_no', receipt.customer_order_no)
      .eq('tenant_id', tenantId)
      .limit(1);

    if (sysOrderError) throw new Error(`按系统订单号精确匹配失败: ${sysOrderError.message}`);
    if (sysOrderData && sysOrderData.length > 0) {
      appendCandidates(sysOrderData as OrderRow[]);
      return Array.from(candidates.values());
    }

    // 2. 按客户订单号 (order_no) 精确匹配
    const { data: exactOrders, error: exactError } = await client
      .from('orders')
      .select('id, order_no, supplier_id, supplier_name')
      .eq('order_no', receipt.customer_order_no)
      .eq('tenant_id', tenantId)
      .limit(10);

    if (exactError) throw new Error(`按客户订单号精确匹配失败: ${exactError.message}`);
    appendCandidates((exactOrders || []) as OrderRow[]);

    // 3. 按客户订单号模糊匹配（仅当精确匹配为空时）
    if (exactOrders?.length === 0) {
      const { data: fuzzyOrderNoOrders, error: fuzzyOrderNoError } = await client
        .from('orders')
        .select('id, order_no, supplier_id, supplier_name')
        .ilike('order_no', `%${receipt.customer_order_no}%`)
        .eq('tenant_id', tenantId)
        .limit(10);

      if (fuzzyOrderNoError) throw new Error(`按订单号模糊匹配失败: ${fuzzyOrderNoError.message}`);
      appendCandidates((fuzzyOrderNoOrders || []) as OrderRow[]);
    }
  }

  return Array.from(candidates.values());
}

// 自动匹配回单与订单
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { receiptIds } = body;

    if (!receiptIds || !Array.isArray(receiptIds)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    let autoMatchedCount = 0;
    let conflictCount = 0;
    const results = [];
    const touchedRecordIds = new Set<string>();

    // 获取待匹配的 回单
    const { data: receipts, error: receiptsError } = await client
      .from('return_receipts')
      .select('*')
      .eq('tenant_id', tenant.tenantId)
      .in('id', receiptIds)
      .eq('match_status', 'pending');

    if (receiptsError) throw new Error(`查询回单失败: ${receiptsError.message}`);

    for (const receipt of ((receipts || []) as ReceiptRow[])) {
      touchedRecordIds.add(receipt.record_id);
      const candidates = await collectOrderCandidates(client, receipt, tenant.tenantId);
      const matchedOrder = candidates.length === 1 ? candidates[0] : null;

      // 更新回单状态
      if (matchedOrder) {
        const now = new Date().toISOString();
        
        // 匹配成功后，自动获取订单的发货方信息并填充
        await client
          .from('return_receipts')
          .update({
            order_id: matchedOrder.id,
            supplier_id: matchedOrder.supplier_id || null,
            supplier_name: matchedOrder.supplier_name || null,
            match_status: 'auto_matched',
            matched_at: now,
            express_company: receipt.express_company || undefined,
            tracking_no: receipt.tracking_no || undefined,
            freight_cost: receipt.freight_cost || undefined,
          })
          .eq('id', receipt.id)
          .eq('tenant_id', tenant.tenantId);

        // 更新订单的快递信息（追加模式，支持部分回单）
        // 先获取当前订单的物流信息
        const { data: existingOrder } = await client
          .from('orders')
          .select('tracking_no, express_company, status')
          .eq('id', matchedOrder.id)
          .single();

        // 物流信息合并策略：用 ";" 隔开多个快递信息
        const existingTrackingNo = existingOrder?.tracking_no || '';
        const existingExpressCompany = existingOrder?.express_company || '';
        const newTrackingNo = existingTrackingNo 
          ? `${existingTrackingNo}; ${receipt.tracking_no || ''}`
          : (receipt.tracking_no || '');
        const newExpressCompany = existingExpressCompany 
          ? `${existingExpressCompany}; ${receipt.express_company || ''}`
          : (receipt.express_company || '');

        // 状态判断：已有回单记录或当前状态为 partial_returned 时保持，部分回单新状态
        // 如果订单已有 tracking_no，说明之前有回单过，此次追加回单
        const hasExistingReceipt = Boolean(existingTrackingNo) && existingOrder?.status !== 'returned';
        const newStatus = hasExistingReceipt ? 'partial_returned' : 'returned';

        // 只有当回单包含物流信息（快递公司或快递单号）时才更新订单状态为已回单
        const hasLogisticsInfo = Boolean(receipt.express_company || receipt.tracking_no);
        if (hasLogisticsInfo) {
          await client
            .from('orders')
            .update({
              tracking_no: newTrackingNo || undefined,
              express_company: newExpressCompany || undefined,
              freight_cost: receipt.freight_cost || undefined,
              status: newStatus,
              returned_at: now,
              updated_at: now,
            })
            .eq('id', matchedOrder.id);

          await syncOrderCostHistoryAfterReturn(client, {
            orderId: matchedOrder.id,
            expressCompany: receipt.express_company,
            trackingNo: receipt.tracking_no,
            freightCost: receipt.freight_cost,
            returnedAt: now,
          });
        }

        autoMatchedCount++;
        results.push({
          receiptId: receipt.id,
          customerOrderNo: receipt.customer_order_no,
          supplierOrderNo: receipt.supplier_order_no,
          matched: true,
          orderId: matchedOrder.id,
          orderNo: matchedOrder.order_no,
          isPartialReturn: hasExistingReceipt,
        });
      } else if (candidates.length > 1) {
        conflictCount++;
        await client
          .from('return_receipts')
          .update({
            order_id: null,
            match_status: 'conflict',
            matched_at: null,
          })
          .eq('id', receipt.id)
          .eq('tenant_id', tenant.tenantId);

        results.push({
          receiptId: receipt.id,
          customerOrderNo: receipt.customer_order_no,
          supplierOrderNo: receipt.supplier_order_no,
          matched: false,
          conflict: true,
          orderId: null,
          orderNo: null,
          candidateOrderIds: candidates.map((order) => order.id),
          candidateOrderNos: candidates.map((order) => order.order_no),
        });
      } else {
        results.push({
          receiptId: receipt.id,
          customerOrderNo: receipt.customer_order_no,
          supplierOrderNo: receipt.supplier_order_no,
          matched: false,
          orderId: null,
          orderNo: null,
        });
      }
    }

    for (const recordId of touchedRecordIds) {
      const { data: recordReceipts, error: countError } = await client
        .from('return_receipts')
        .select('match_status')
        .eq('record_id', recordId)
        .eq('tenant_id', tenant.tenantId);

      if (countError) {
        throw new Error(`更新回单记录计数失败: ${countError.message}`);
      }

      const matchedCount = (recordReceipts || []).filter(
        (item) => item.match_status === 'auto_matched' || item.match_status === 'manual_matched'
      ).length;

      await client
        .from('return_receipt_records')
        .update({
          matched_count: matchedCount,
          unmatched_count: (recordReceipts?.length || 0) - matchedCount,
        })
        .eq('id', recordId)
        .eq('tenant_id', tenant.tenantId);
    }

    return NextResponse.json({
      success: true,
      message:
        conflictCount > 0
          ? `自动匹配完成，共匹配${autoMatchedCount}个，冲突${conflictCount}个，待复核${results.length - autoMatchedCount}个`
          : `自动匹配完成，共匹配${autoMatchedCount}个，还有${results.length - autoMatchedCount}个待手动匹配`,
      data: {
        totalCount: results.length,
        autoMatchedCount,
        conflictCount,
        unmatchedCount: results.length - autoMatchedCount,
        results,
      },
    });
  } catch (error) {
    console.error('自动匹配回单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
