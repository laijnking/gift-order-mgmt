import { NextRequest, NextResponse } from 'next/server';
import { syncOrderCostHistoryAfterReturn } from '@/lib/order-cost-history';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

type ReceiptRow = {
  id: string;
  record_id: string;
  supplier_id: string;
  supplier_order_no?: string | null;
  customer_order_no?: string | null;
  express_company?: string | null;
  tracking_no?: string | null;
};

type OrderRow = {
  id: string;
  order_no: string;
};

async function collectOrderCandidates(
  client: ReturnType<typeof getSupabaseClient>,
  receipt: ReceiptRow
) {
  const candidates = new Map<string, OrderRow>();

  const appendCandidates = (orders: OrderRow[] | null | undefined) => {
    for (const order of orders || []) {
      if (!candidates.has(order.id)) {
        candidates.set(order.id, order);
      }
    }
  };

  if (receipt.supplier_order_no) {
    const { data, error } = await client
      .from('orders')
      .select('id, order_no')
      .eq('supplier_order_no', receipt.supplier_order_no)
      .eq('supplier_id', receipt.supplier_id);

    if (error) throw new Error(`按供应商单据号匹配失败: ${error.message}`);
    appendCandidates((data || []) as OrderRow[]);
  }

  if (receipt.customer_order_no) {
    const { data: exactOrders, error: exactError } = await client
      .from('orders')
      .select('id, order_no')
      .eq('order_no', receipt.customer_order_no)
      .eq('supplier_id', receipt.supplier_id);

    if (exactError) throw new Error(`按客户订单号精确匹配失败: ${exactError.message}`);
    appendCandidates((exactOrders || []) as OrderRow[]);

    const { data: fuzzyOrderNoOrders, error: fuzzyOrderNoError } = await client
      .from('orders')
      .select('id, order_no')
      .eq('supplier_id', receipt.supplier_id)
      .ilike('order_no', `%${receipt.customer_order_no}%`);

    if (fuzzyOrderNoError) throw new Error(`按订单号模糊匹配失败: ${fuzzyOrderNoError.message}`);
    appendCandidates((fuzzyOrderNoOrders || []) as OrderRow[]);

  }

  return Array.from(candidates.values());
}

// 自动匹配回单与订单
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'orders:edit');
  if (authError) return authError;
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
      .in('id', receiptIds)
      .eq('match_status', 'pending');

    if (receiptsError) throw new Error(`查询回单失败: ${receiptsError.message}`);

    for (const receipt of ((receipts || []) as ReceiptRow[])) {
      touchedRecordIds.add(receipt.record_id);
      const candidates = await collectOrderCandidates(client, receipt);
      const matchedOrder = candidates.length === 1 ? candidates[0] : null;

      // 更新回单状态
      if (matchedOrder) {
        const now = new Date().toISOString();
        await client
          .from('return_receipts')
          .update({
            order_id: matchedOrder.id,
            match_status: 'auto_matched',
            matched_at: now,
            express_company: receipt.express_company || undefined,
            tracking_no: receipt.tracking_no || undefined,
          })
          .eq('id', receipt.id);

        // 更新订单的快递信息
        if (receipt.tracking_no || receipt.express_company) {
          await client
            .from('orders')
            .update({
              tracking_no: receipt.tracking_no || undefined,
              express_company: receipt.express_company || undefined,
              status: 'returned',
              returned_at: now,
              updated_at: now,
            })
            .eq('id', matchedOrder.id);

          await syncOrderCostHistoryAfterReturn(client, {
            orderId: matchedOrder.id,
            expressCompany: receipt.express_company,
            trackingNo: receipt.tracking_no,
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
          .eq('id', receipt.id);

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
        .eq('record_id', recordId);

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
        .eq('id', recordId);
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
