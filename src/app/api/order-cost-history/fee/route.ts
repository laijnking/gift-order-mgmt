import { NextRequest, NextResponse } from 'next/server';
import { updateOrderCostHistoryFees } from '@/lib/order-cost-history';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 更新历史成本库的快递费用
export async function PATCH(request: NextRequest) {
  const authError = requirePermission(request, 'orders:edit');
  if (authError) return authError;
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

    const summary = await updateOrderCostHistoryFees(client, {
      orderId,
      orderNo,
      expressFee,
      otherFee,
      remark,
    });

    if (!summary) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到对应的历史成本记录' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `已更新 ${summary.updatedCount} 条记录的费用信息`,
      data: {
        orderIds: summary.orderIds,
        orderNos: summary.orderNos,
        expressFee: summary.expressFee,
        otherFee: summary.otherFee,
        totalAmount: summary.totalAmount,
        updatedCount: summary.updatedCount,
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
