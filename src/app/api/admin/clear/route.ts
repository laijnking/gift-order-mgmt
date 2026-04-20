import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function DELETE(request: NextRequest) {
  const authError = requirePermission(request, 'settings:edit');
  if (authError) return authError;

  try {
    // 获取清理类型
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // 管理员密钥验证
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'clear-all-orders-2024') {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const result = { orders: 0, costHistory: 0 };

    // 清空订单
    if (type === 'all' || type === 'orders') {
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录
      
      if (ordersError) {
        return NextResponse.json({ success: false, error: `清空订单失败: ${ordersError.message}` }, { status: 500 });
      }
      result.orders = 1;
    }

    // 清空历史成本库
    if (type === 'all' || type === 'cost-history') {
      const { error: costError } = await supabase
        .from('order_cost_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (costError) {
        return NextResponse.json({ success: false, error: `清空历史成本库失败: ${costError.message}` }, { status: 500 });
      }
      result.costHistory = 1;
    }

    return NextResponse.json({ success: true, message: '清理完成', result });
  } catch (error) {
    console.error('清理失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '清理失败' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'settings:edit');
  if (authError) return authError;

  try {
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== 'clear-all-orders-2024') {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    const { count: costCount } = await supabase
      .from('order_cost_history')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      data: {
        orders: orderCount || 0,
        costHistory: costCount || 0
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '查询失败' 
    }, { status: 500 });
  }
}
