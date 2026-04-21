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

// 获取单个SKU映射
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { data, error } = await client
      .from('product_mappings')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询SKU映射失败: ${error.message}`);
    if (!data) throw new Error('SKU映射不存在');

    return NextResponse.json({
      success: true,
      data: transformMapping(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('获取SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新SKU映射
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {};
    
    if (body.productId !== undefined) updateData.product_id = body.productId;
    if (body.productCode !== undefined) updateData.product_code = body.productCode;
    if (body.productName !== undefined) updateData.product_name = body.productName;
    if (body.customerId !== undefined) updateData.customer_id = body.customerId;
    if (body.customerCode !== undefined) updateData.customer_code = body.customerCode;
    if (body.customerName !== undefined) updateData.customer_name = body.customerName;
    if (body.supplierId !== undefined) updateData.supplier_id = body.supplierId;
    if (body.supplierName !== undefined) updateData.supplier_name = body.supplierName;
    if (body.customerSku !== undefined) updateData.customer_sku = body.customerSku;
    if (body.customerBarcode !== undefined) updateData.customer_barcode = body.customerBarcode;
    if (body.customerProductName !== undefined) updateData.customer_product_name = body.customerProductName;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.remark !== undefined) updateData.remark = body.remark;

    const { data, error } = await client
      .from('product_mappings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新SKU映射失败: ${error.message}`);
    if (!data) throw new Error('SKU映射不存在');

    return NextResponse.json({
      success: true,
      data: transformMapping(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('更新SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除SKU映射
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_DELETE);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { error } = await client
      .from('product_mappings')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`删除SKU映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
