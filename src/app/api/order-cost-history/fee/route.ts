import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 更新历史成本库的快递费用
export async function PATCH(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { 
      orderId,        // 订单ID（可选，与orderNo二选一）
      orderNo,        // 客户订单号（可选）
      expressFee,     // 快递费用
      otherFee,       // 其他费用（可选）
      remark          // 备注（可选）
    } = body;

    if (!orderId && !orderNo) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供订单ID或客户订单号' 
      }, { status: 400 });
    }

    if (expressFee === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供快递费用' 
      }, { status: 400 });
    }

    // 构建查询条件
    let query = client
      .from('order_cost_history')
      .select('id, order_id, order_no, unit_cost, quantity, total_cost, express_fee, other_fee, total_amount, remark');

    if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (orderNo) {
      query = query.eq('order_no', orderNo);
    }

    const { data: records, error: queryError } = await query;
    
    if (queryError) throw new Error(`查询历史成本失败: ${queryError.message}`);

    if (!records || records.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到对应的历史成本记录' 
      }, { status: 404 });
    }

    // 更新费用
    const updatedRecords: string[] = [];
    for (const record of records) {
      const newExpressFee = expressFee || 0;
      const newOtherFee = otherFee || record.other_fee || 0;
      const newTotalAmount = (record.unit_cost * record.quantity) + newExpressFee + newOtherFee;

      await client
        .from('order_cost_history')
        .update({
          express_fee: newExpressFee,
          other_fee: newOtherFee,
          total_amount: newTotalAmount,
          remark: remark || record.remark,
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);

      updatedRecords.push(record.order_no);
    }

    return NextResponse.json({
      success: true,
      message: `已更新 ${updatedRecords.length} 条记录的费用信息`,
      data: {
        orderNos: updatedRecords,
        expressFee,
        otherFee: otherFee || 0,
        updatedCount: updatedRecords.length
      }
    });

  } catch (error) {
    console.error('更新快递费用失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
