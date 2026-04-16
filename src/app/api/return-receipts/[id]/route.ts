import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取回单导入记录详情
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');

  try {
    if (!recordId) {
      return NextResponse.json({ success: false, error: '缺少recordId参数' }, { status: 400 });
    }

    // 获取导入记录
    const { data: record, error: recordError } = await client
      .from('return_receipt_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (recordError) throw new Error(`查询导入记录失败: ${recordError.message}`);

    // 获取回单明细
    const { data: receipts, error: receiptsError } = await client
      .from('return_receipts')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false });

    if (receiptsError) throw new Error(`查询回单明细失败: ${receiptsError.message}`);

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        receipts: receipts || [],
      },
    });
  } catch (error) {
    console.error('获取回单详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 手动匹配回单与订单
export async function PATCH(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { receiptId, orderId } = body;

    if (!receiptId || !orderId) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    // 获取订单信息
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw new Error(`查询订单失败: ${orderError.message}`);

    // 更新回单
    const { error: updateError } = await client
      .from('return_receipts')
      .update({
        order_id: orderId,
        match_status: 'manual_matched',
        matched_at: new Date().toISOString(),
      })
      .eq('id', receiptId);

    if (updateError) throw new Error(`更新回单失败: ${updateError.message}`);

    // 更新导入记录的匹配数量
    const { data: receipt } = await client
      .from('return_receipts')
      .select('record_id')
      .eq('id', receiptId)
      .single();

    if (receipt) {
      const { data: allReceipts } = await client
        .from('return_receipts')
        .select('id')
        .eq('record_id', receipt.record_id);

      const matchedCount = allReceipts?.filter((r: any) => 
        r.id !== receiptId && 
        (r.match_status === 'auto_matched' || r.match_status === 'manual_matched')
      ).length || 0;

      await client
        .from('return_receipt_records')
        .update({
          matched_count: matchedCount + 1,
          unmatched_count: (allReceipts?.length || 0) - matchedCount - 1,
        })
        .eq('id', receipt.record_id);
    }

    return NextResponse.json({
      success: true,
      message: '手动匹配成功',
      data: {
        receiptId,
        orderId,
        orderNo: order.order_no,
      },
    });
  } catch (error) {
    console.error('手动匹配回单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
