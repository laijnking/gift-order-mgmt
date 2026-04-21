import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取价格历史
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.STOCKS_VIEW);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get('productCode');
    const supplierId = searchParams.get('supplierId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = client
      .from('price_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (productCode) {
      query = query.eq('product_code', productCode);
    }
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw new Error(`查询价格历史失败: ${error.message}`);

    // 转换数据格式
    const history = (data || []).map(h => ({
      id: h.id,
      productCode: h.product_code,
      productName: h.product_name,
      supplierId: h.supplier_id,
      supplierName: h.supplier_name,
      beforePrice: h.before_price,
      afterPrice: h.after_price,
      changePrice: h.change_price,
      changeType: h.change_type,
      changeReason: h.change_reason,
      operator: h.operator,
      effectiveFrom: h.effective_from,
      effectiveTo: h.effective_to,
      createdAt: h.created_at,
    }));

    // 获取当前价格（从stocks表）
    const currentPrices: Record<string, number> = {};
    if (productCode) {
      const { data: stocks } = await client
        .from('stocks')
        .select('product_code, price')
        .eq('product_code', productCode);
      
      if (stocks) {
        stocks.forEach(s => {
          if (s.price !== null) {
            currentPrices[s.product_code] = s.price;
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: history,
      currentPrices,
      total: history.length
    });

  } catch (error) {
    console.error('查询价格历史失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 记录价格变更
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.STOCKS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { 
      productCode, 
      productName,
      supplierId,
      supplierName,
      beforePrice,
      afterPrice,
      changeType,
      changeReason,
      operator,
      effectiveFrom
    } = body;

    if (!productCode || afterPrice === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    // 更新之前记录的有效期
    if (supplierId) {
      await client
        .from('price_history')
        .update({ 
          effective_to: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('supplier_id', supplierId)
        .eq('product_code', productCode)
        .is('effective_to', null);
    }

    const historyData = {
      product_code: productCode,
      product_name: productName || '',
      supplier_id: supplierId || null,
      supplier_name: supplierName || '',
      before_price: beforePrice ?? null,
      after_price: afterPrice,
      change_price: (afterPrice ?? 0) - (beforePrice ?? 0),
      change_type: changeType || 'manual',
      change_reason: changeReason || '',
      operator: operator || 'system',
      effective_from: effectiveFrom || new Date().toISOString(),
      effective_to: null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('price_history')
      .insert(historyData)
      .select()
      .single();

    if (error) throw new Error(`记录价格变更失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data,
      message: '价格变更已记录'
    });

  } catch (error) {
    console.error('记录价格变更失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
