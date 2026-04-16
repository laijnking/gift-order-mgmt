import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 库存预警阈值
const LOW_STOCK_THRESHOLD = 2;

// 获取库存列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const supplierId = searchParams.get('supplierId');
  const supplierName = searchParams.get('supplierName');
  const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
  const warehouseId = searchParams.get('warehouseId');

  try {
    let query = client.from('stocks').select('*');

    if (search) {
      query = query.or(`product_code.ilike.%${search}%,product_name.ilike.%${search}%`);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (supplierName) {
      query = query.eq('supplier_name', supplierName);
    }

    if (lowStockOnly) {
      // 尾货预警：库存≤2台
      query = query.lte('quantity', LOW_STOCK_THRESHOLD);
    }

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    query = query.limit(500).order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询库存失败: ${error.message}`);

    // 增强数据：添加预警状态
    const enhancedData = (data || []).map(stock => ({
      ...stock,
      isLowStock: stock.quantity <= LOW_STOCK_THRESHOLD,
      stockLevel: stock.quantity === 0 ? 'out' : stock.quantity <= LOW_STOCK_THRESHOLD ? 'low' : 'normal',
      available: stock.quantity - (stock.in_transit || 0),
    }));

    // 统计预警数量
    const lowStockCount = enhancedData.filter(s => s.isLowStock).length;
    const outOfStockCount = enhancedData.filter(s => s.quantity === 0).length;

    return NextResponse.json({
      success: true,
      data: enhancedData,
      total: enhancedData.length,
      stats: {
        lowStockCount,
        outOfStockCount,
        totalCount: enhancedData.length,
      }
    });
  } catch (error) {
    console.error('获取库存失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增库存
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    // 检查是否已存在该供应商和商品的库存记录
    if (body.supplier_id && body.product_code) {
      const { data: existing } = await client
        .from('stocks')
        .select('id, quantity')
        .eq('supplier_id', body.supplier_id)
        .eq('product_code', body.product_code)
        .maybeSingle();

      if (existing) {
        // 更新现有库存
        const { data, error } = await client
          .from('stocks')
          .update({
            quantity: body.quantity ?? existing.quantity + (body.quantity || 0),
            price: body.price,
            warehouse_id: body.warehouse_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw new Error(`更新库存失败: ${error.message}`);

        return NextResponse.json({
          success: true,
          data: data,
          message: '库存已更新'
        });
      }
    }

    const stockData = {
      id: body.id || crypto.randomUUID(),
      supplier_id: body.supplierId || body.supplier_id,
      supplier_name: body.supplierName || body.supplier_name,
      product_code: body.productCode || body.product_code,
      product_name: body.productName || body.product_name,
      quantity: body.quantity || 0,
      in_transit: body.inTransit || body.in_transit || 0,
      price: body.price || 0,
      warehouse_id: body.warehouse_id,
    };

    const { data, error } = await client
      .from('stocks')
      .insert(stockData)
      .select()
      .single();
    
    if (error) throw new Error(`添加库存失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('添加库存失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 批量更新库存
export async function PATCH(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { id, quantity, in_transit, price } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少库存ID' 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (quantity !== undefined) updateData.quantity = quantity;
    if (in_transit !== undefined) updateData.in_transit = in_transit;
    if (price !== undefined) updateData.price = price;

    const { data, error } = await client
      .from('stocks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新库存失败: ${error.message}`);

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
