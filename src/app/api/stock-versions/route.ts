import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取库存版本历史
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get('stockId');
    const productCode = searchParams.get('productCode');
    const supplierId = searchParams.get('supplierId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = client
      .from('stock_versions')
      .select('*')
      .order('created_at', { ascending: false });

    if (stockId) {
      query = query.eq('stock_id', stockId);
    }
    if (productCode) {
      query = query.eq('product_code', productCode);
    }
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw new Error(`查询库存版本失败: ${error.message}`);

    // 转换数据格式
    const versions = (data || []).map(v => ({
      id: v.id,
      stockId: v.stock_id,
      productCode: v.product_code,
      productName: v.product_name,
      supplierId: v.supplier_id,
      supplierName: v.supplier_name,
      beforeQuantity: v.before_quantity,
      afterQuantity: v.after_quantity,
      changeQuantity: v.change_quantity,
      beforePrice: v.before_price,
      afterPrice: v.after_price,
      changePrice: v.change_price,
      changeType: v.change_type,
      changeReason: v.change_reason,
      operator: v.operator,
      createdAt: v.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: versions,
      total: versions.length
    });

  } catch (error) {
    console.error('查询库存版本失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建库存版本记录（自动在库存变更时调用）
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { 
      stockId,
      productCode, 
      productName,
      supplierId,
      supplierName,
      beforeQuantity,
      afterQuantity,
      beforePrice,
      afterPrice,
      changeType,
      changeReason,
      operator
    } = body;

    if (!productCode || afterQuantity === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    const versionData = {
      stock_id: stockId || null,
      product_code: productCode,
      product_name: productName || '',
      supplier_id: supplierId || null,
      supplier_name: supplierName || '',
      before_quantity: beforeQuantity ?? null,
      after_quantity: afterQuantity,
      change_quantity: (afterQuantity ?? 0) - (beforeQuantity ?? 0),
      before_price: beforePrice ?? null,
      after_price: afterPrice ?? null,
      change_price: (afterPrice ?? 0) - (beforePrice ?? 0),
      change_type: changeType || 'manual',
      change_reason: changeReason || '',
      operator: operator || 'system',
      created_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('stock_versions')
      .insert(versionData)
      .select()
      .single();

    if (error) throw new Error(`创建库存版本失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data,
      message: '库存版本记录已创建'
    });

  } catch (error) {
    console.error('创建库存版本失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
