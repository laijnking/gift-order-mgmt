import { NextRequest, NextResponse } from 'next/server';
import { syncOrderCostHistoryAfterReturn } from '@/lib/order-cost-history';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

type ReceiptRow = {
  id: string;
  order_id: string | null;
  express_company: string | null;
  tracking_no: string | null;
  freight_cost: number | null;
  supplier_id: string | null;
  supplier_name: string | null;
};

// 追加物流信息（用 ";" 隔开）
function appendLogisticsInfo(existing: string | null, newValue: string | null): string {
  if (!newValue) return existing || '';
  if (!existing) return newValue;
  return `${existing}; ${newValue}`;
}

// 批量确认回单（支持部分回单，物流信息追加）
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { receiptIds, importedBy } = body;

    if (!receiptIds || !Array.isArray(receiptIds)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    let matchedCount = 0;
    let partialReturnCount = 0;
    const updatedOrderIds: string[] = [];

    // 获取回单明细
    const { data: receipts, error: receiptsError } = await client
      .from('return_receipts')
      .select('*')
      .in('id', receiptIds)
      .in('match_status', ['auto_matched', 'manual_matched']);

    if (receiptsError) throw new Error(`查询回单失败: ${receiptsError.message}`);

    // 批量更新匹配的订单
    for (const receipt of ((receipts || []) as ReceiptRow[])) {
      if (receipt.order_id) {
        const now = new Date().toISOString();

        // 获取当前订单的物流信息（用于追加模式）
        const { data: existingOrder } = await client
          .from('orders')
          .select('tracking_no, express_company, status')
          .eq('id', receipt.order_id)
          .single();

        const existingTrackingNo = existingOrder?.tracking_no || '';
        const existingExpressCompany = existingOrder?.express_company || '';
        const hasExistingReceipt = Boolean(existingTrackingNo) && 
          existingOrder?.status !== 'returned';

        // 物流信息追加策略
        const newTrackingNo = appendLogisticsInfo(existingTrackingNo, receipt.tracking_no);
        const newExpressCompany = appendLogisticsInfo(existingExpressCompany, receipt.express_company);

        // 状态判断：如果订单已有回单记录，则为部分回单
        const newStatus = hasExistingReceipt ? 'partial_returned' : 'returned';

        // 更新订单物流信息
        const { error: updateError } = await client
          .from('orders')
          .update({
            express_company: newExpressCompany || undefined,
            tracking_no: newTrackingNo || undefined,
            freight_cost: receipt.freight_cost || undefined,
            status: newStatus,
            returned_at: now,
            updated_at: now,
          })
          .eq('id', receipt.order_id);

        if (!updateError) {
          matchedCount++;
          if (hasExistingReceipt) partialReturnCount++;
          updatedOrderIds.push(receipt.order_id);

          // 更新回单状态为已确认
          await client
            .from('return_receipts')
            .update({ matched_at: now })
            .eq('id', receipt.id);

          await syncOrderCostHistoryAfterReturn(client, {
            orderId: receipt.order_id,
            expressCompany: receipt.express_company,
            trackingNo: receipt.tracking_no,
            freightCost: receipt.freight_cost,
            returnedAt: now,
          });
        }
      }
    }

    // 生成结果消息
    let message = `成功确认 ${matchedCount} 个回单`;
    if (partialReturnCount > 0) {
      message += `（其中 ${partialReturnCount} 个为部分回单追加）`;
    }

    return NextResponse.json({
      success: true,
      message,
      data: {
        matchedCount,
        partialReturnCount,
        updatedOrderIds,
      },
    });
  } catch (error) {
    console.error('批量确认回单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
