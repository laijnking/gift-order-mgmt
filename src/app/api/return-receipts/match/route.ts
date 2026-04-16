import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 自动匹配回单与订单
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { receiptIds } = body;

    if (!receiptIds || !Array.isArray(receiptIds)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    let autoMatchedCount = 0;
    const results = [];

    // 获取待匹配的 回单
    const { data: receipts, error: receiptsError } = await client
      .from('return_receipts')
      .select('*')
      .in('id', receiptIds)
      .eq('match_status', 'pending');

    if (receiptsError) throw new Error(`查询回单失败: ${receiptsError.message}`);

    for (const receipt of (receipts || [])) {
      let matchedOrder = null;

      // 匹配规则0: 按供应商单据号精确匹配（优先级最高）
      if (receipt.supplier_order_no) {
        const { data: orders0, error: error0 } = await client
          .from('orders')
          .select('*')
          .eq('supplier_order_no', receipt.supplier_order_no)
          .eq('supplier_id', receipt.supplier_id)
          .single();

        if (!error0 && orders0) {
          matchedOrder = orders0;
        }
      }

      // 匹配规则1: 按客户订单号精确匹配
      if (!matchedOrder) {
        const { data: orders1, error: error1 } = await client
          .from('orders')
          .select('*')
          .eq('order_no', receipt.customer_order_no)
          .eq('supplier_id', receipt.supplier_id)
          .single();

        if (!error1 && orders1) {
          matchedOrder = orders1;
        }
      }

      // 匹配规则1b: 按客户单号模糊匹配
      if (!matchedOrder) {
        const { data: orders1b, error: error1b } = await client
          .from('orders')
          .select('*')
          .eq('supplier_id', receipt.supplier_id)
          .ilike('order_no', `%${receipt.customer_order_no}%`);

        if (!error1b && orders1b && orders1b.length > 0) {
          matchedOrder = orders1b[0];
        }
      }

      // 匹配规则2: 按客户订单号模糊匹配（含客户代码）
      if (!matchedOrder) {
        const { data: orders2, error: error2 } = await client
          .from('orders')
          .select('*')
          .eq('supplier_id', receipt.supplier_id)
          .ilike('order_no', `%${receipt.customer_order_no}%`);

        if (!error2 && orders2 && orders2.length > 0) {
          matchedOrder = orders2[0];
        }
      }

      // 匹配规则3: 按客户单号+供应商模糊匹配
      if (!matchedOrder) {
        const { data: orders3, error: error3 } = await client
          .from('orders')
          .select('*')
          .eq('supplier_id', receipt.supplier_id)
          .ilike('customer_order_no', `%${receipt.customer_order_no}%`);

        if (!error3 && orders3 && orders3.length > 0) {
          matchedOrder = orders3[0];
        }
      }

      // 更新回单状态
      if (matchedOrder) {
        await client
          .from('return_receipts')
          .update({
            order_id: matchedOrder.id,
            match_status: 'auto_matched',
            matched_at: new Date().toISOString(),
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
              updated_at: new Date().toISOString(),
            })
            .eq('id', matchedOrder.id);
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

    return NextResponse.json({
      success: true,
      message: `自动匹配完成，共匹配${autoMatchedCount}个，还有${results.length - autoMatchedCount}个待手动匹配`,
      data: {
        totalCount: results.length,
        autoMatchedCount,
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
