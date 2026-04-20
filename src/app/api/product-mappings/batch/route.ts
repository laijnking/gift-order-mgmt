import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 批量导入SKU映射
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'products:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { mappings } = body;
    
    if (!Array.isArray(mappings)) {
      return NextResponse.json({ 
        success: false, 
        error: '无效的参数，需要 mappings 数组' 
      }, { status: 400 });
    }
    
    if (mappings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '映射数据为空' 
      }, { status: 400 });
    }
    
    const insertData = mappings.map((m: Record<string, unknown>) => ({
      product_id: m.productId || null,
      product_code: m.productCode || '',
      product_name: m.productName || '',
      customer_id: m.customerId || null,
      customer_code: m.customerCode || '',
      customer_name: m.customerName || '',
      supplier_id: m.supplierId || null,
      supplier_name: m.supplierName || '',
      customer_sku: m.customerSku || '',
      customer_barcode: m.customerBarcode || '',
      customer_product_name: m.customerProductName || '',
      price: m.price !== undefined && m.price !== null ? Number(m.price) : null,
      is_active: m.isActive !== false,
      remark: m.remark || '',
      mapping_type: m.mappingType || (m.customerCode ? 'customer' : 'supplier'),
    }));

    const { data, error } = await client
      .from('product_mappings')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('批量导入SKU映射失败:', error);
      return NextResponse.json({ 
        success: false, 
        error: `批量导入失败: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data?.length || 0,
      message: `成功导入 ${data?.length || 0} 条映射`
    });
  } catch (error) {
    console.error('批量导入SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
