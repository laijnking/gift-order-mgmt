import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 库存预警阈值
const LOW_STOCK_THRESHOLD = 2;

// 获取单个库存详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { data, error } = await client
      .from('stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: '库存记录不存在'
        }, { status: 404 });
      }
      throw new Error(`查询库存失败: ${error.message}`);
    }

    // 添加预警状态
    const isLowStock = (data.quantity || 0) <= LOW_STOCK_THRESHOLD;

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        isLowStock,
        stockLevel: data.quantity === 0 ? 'out' : isLowStock ? 'low' : 'normal',
      }
    });
  } catch (error) {
    console.error('获取库存详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 更新库存
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 先获取当前库存记录
    const { data: currentStock, error: currentError } = await client
      .from('stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError) throw new Error(`查询当前库存失败: ${currentError.message}`);

    const body = await request.json();
    const { quantity, in_transit, price, supplier_id, supplier_name, product_code, product_name, changeReason, operator } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (quantity !== undefined) updateData.quantity = quantity;
    if (in_transit !== undefined) updateData.in_transit = in_transit;
    if (price !== undefined) updateData.price = price;
    if (supplier_id !== undefined) updateData.supplier_id = supplier_id;
    if (supplier_name !== undefined) updateData.supplier_name = supplier_name;
    if (product_code !== undefined) updateData.product_code = product_code;
    if (product_name !== undefined) updateData.product_name = product_name;

    const { data, error } = await client
      .from('stocks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新库存失败: ${error.message}`);

    // 创建版本历史记录（如果有变更）
    const beforeQuantity = currentStock.quantity;
    const afterQuantity = data.quantity;
    const beforePrice = currentStock.price;
    const afterPrice = data.price;

    if (beforeQuantity !== afterQuantity || beforePrice !== afterPrice) {
      await client.from('stock_versions').insert({
        stock_id: id,
        product_code: data.product_code,
        product_name: data.product_name,
        supplier_id: data.supplier_id,
        supplier_name: data.supplier_name,
        before_quantity: beforeQuantity,
        after_quantity: afterQuantity,
        change_quantity: afterQuantity - beforeQuantity,
        before_price: beforePrice,
        after_price: afterPrice,
        change_price: afterPrice - beforePrice,
        change_type: 'manual',
        change_reason: changeReason || '',
        operator: operator || 'system',
        created_at: new Date().toISOString()
      });
    }

    // 检查是否触发预警
    const isLowStock = (data.quantity || 0) <= LOW_STOCK_THRESHOLD;

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        isLowStock,
        stockLevel: data.quantity === 0 ? 'out' : isLowStock ? 'low' : 'normal',
      },
      warning: isLowStock ? `库存预警：${data.product_name || '商品'}库存仅剩 ${data.quantity} 台` : null,
    });
  } catch (error) {
    console.error('更新库存失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 删除库存
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { error } = await client
      .from('stocks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除库存失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除库存失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
