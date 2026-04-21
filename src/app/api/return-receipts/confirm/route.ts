import { NextRequest, NextResponse } from 'next/server';
import { syncOrderCostHistoryAfterReturn } from '@/lib/order-cost-history';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 批量确认回单（匹配订单并更新状态）
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { receiptIds, importedBy } = body;

    if (!receiptIds || !Array.isArray(receiptIds)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    let matchedCount = 0;
    const updatedOrderIds: string[] = [];

    // 获取回单明细
    const { data: receipts, error: receiptsError } = await client
      .from('return_receipts')
      .select('*')
      .in('id', receiptIds)
      .in('match_status', ['auto_matched', 'manual_matched']);

    if (receiptsError) throw new Error(`查询回单失败: ${receiptsError.message}`);

    // 批量更新匹配的订单
    for (const receipt of (receipts || [])) {
      if (receipt.order_id) {
        const now = new Date().toISOString();
        // 更新订单物流信息
        const { error: updateError } = await client
          .from('orders')
          .update({
            express_company: receipt.express_company,
            tracking_no: receipt.tracking_no,
            status: 'returned',
            returned_at: now,
            updated_at: now,
          })
          .eq('id', receipt.order_id);

        if (!updateError) {
          matchedCount++;
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
            returnedAt: now,
          });
        }
      }
    }

    // 扣减供应商库存（简化版）
    // 实际实现需要根据订单商品查询供应商SKU映射，然后扣减对应库存
    for (const orderId of updatedOrderIds) {
      const { data: order } = await client
        .from('orders')
        .select('supplier_id')
        .eq('id', orderId)
        .single();

      if (order?.supplier_id) {
        // 简化：记录库存变更日志
        console.log(`订单 ${orderId} 发货，供应商 ${order.supplier_id} 库存扣减`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功确认${matchedCount}个回单，${matchedCount}个订单状态已更新为已回单`,
      data: {
        matchedCount,
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
