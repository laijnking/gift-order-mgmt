import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 数据库字段转前端格式
function transformMapping(dbMapping: Record<string, unknown>) {
  return {
    id: dbMapping.id,
    productId: dbMapping.product_id,
    productCode: dbMapping.product_code,
    productName: dbMapping.product_name,
    customerId: dbMapping.customer_id,
    customerCode: dbMapping.customer_code,
    customerName: dbMapping.customer_name,
    supplierId: dbMapping.supplier_id,
    supplierName: dbMapping.supplier_name,
    customerSku: dbMapping.customer_sku,
    customerBarcode: dbMapping.customer_barcode,
    customerProductName: dbMapping.customer_product_name,
    price: dbMapping.price,
    isActive: dbMapping.is_active,
    remark: dbMapping.remark,
    createdAt: dbMapping.created_at,
    updatedAt: dbMapping.updated_at,
  };
}

// 获取SKU映射列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const productCode = searchParams.get('productCode');
  const customerCode = searchParams.get('customerCode');
  const supplierId = searchParams.get('supplierId');

  try {
    let query = client.from('product_mappings').select('*');

    if (search) {
      query = query.or(`product_code.ilike.%${search}%,product_name.ilike.%${search}%,customer_sku.ilike.%${search}%,customer_product_name.ilike.%${search}%`);
    }

    if (productCode) {
      query = query.eq('product_code', productCode);
    }

    if (customerCode) {
      query = query.eq('customer_code', customerCode);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询SKU映射失败: ${error.message}`);

    const transformedData = (data || []).map((mapping) => transformMapping(mapping as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增SKU映射
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    const mappingData = {
      product_id: body.productId || null,
      product_code: body.productCode || '',
      product_name: body.productName || '',
      customer_id: body.customerId || null,
      customer_code: body.customerCode || '',
      customer_name: body.customerName || '',
      supplier_id: body.supplierId || null,
      supplier_name: body.supplierName || '',
      customer_sku: body.customerSku || '',
      customer_barcode: body.customerBarcode || '',
      customer_product_name: body.customerProductName || '',
      price: body.price || null,
      is_active: body.isActive !== false,
      remark: body.remark || '',
    };

    const { data, error } = await client
      .from('product_mappings')
      .insert(mappingData)
      .select()
      .single();
    
    if (error) throw new Error(`添加SKU映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformMapping(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('添加SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 批量导入SKU映射
export async function PUT(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_EDIT);
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
      price: m.price || null,
      is_active: m.isActive !== false,
      remark: m.remark || '',
    }));

    const { data, error } = await client
      .from('product_mappings')
      .upsert(insertData, { onConflict: 'customer_sku,customer_code' })
      .select();
    
    if (error) throw new Error(`批量导入SKU映射失败: ${error.message}`);

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
