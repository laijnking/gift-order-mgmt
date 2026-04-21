import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 数据库字段转前端格式
function transformProduct(dbProduct: Record<string, unknown>) {
  return {
    id: dbProduct.id,
    code: dbProduct.code,
    barcode: dbProduct.barcode,
    name: dbProduct.name,
    brand: dbProduct.brand,
    category: dbProduct.category,
    spec: dbProduct.spec,
    unit: dbProduct.unit,
    costPrice: dbProduct.cost_price,
    retailPrice: dbProduct.retail_price,
    lifecycleStatus: dbProduct.lifecycle_status,
    isActive: dbProduct.is_active,
    remark: dbProduct.remark,
    // 尺寸和重量字段（用于抛货判断和运费计算）
    lengthCm: dbProduct.length_cm,
    widthCm: dbProduct.width_cm,
    heightCm: dbProduct.height_cm,
    weightKg: dbProduct.weight_kg,
    volumeFactor: Number(dbProduct.volume_factor) || 6000,
    // 计算体积重量
    volumeWeight: dbProduct.length_cm && dbProduct.width_cm && dbProduct.height_cm 
      ? Math.round((Number(dbProduct.length_cm) * Number(dbProduct.width_cm) * Number(dbProduct.height_cm) / (Number(dbProduct.volume_factor) || 6000)) * 100) / 100 
      : null,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
  };
}

// 获取单个商品
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
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询商品失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: '商品不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transformProduct(data as Record<string, unknown>),
    });
  } catch (error) {
    console.error('获取商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新商品
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
    
    const productData = {
      code: body.code,
      barcode: body.barcode,
      name: body.name,
      brand: body.brand,
      category: body.category,
      spec: body.spec,
      unit: body.unit || '台',
      cost_price: body.costPrice || 0,
      retail_price: body.retailPrice || 0,
      lifecycle_status: body.lifecycleStatus || 'active',
      is_active: body.isActive !== undefined ? body.isActive : true,
      remark: body.remark,
      // 尺寸和重量字段
      length_cm: body.lengthCm,
      width_cm: body.widthCm,
      height_cm: body.heightCm,
      weight_kg: body.weightKg,
      volume_factor: body.volumeFactor || 6000,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新商品失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformProduct(data as Record<string, unknown>),
      message: '商品更新成功'
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除商品（软删除）
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
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`删除商品失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '商品删除成功'
    });
  } catch (error) {
    console.error('删除商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
