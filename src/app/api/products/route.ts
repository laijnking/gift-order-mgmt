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

// 获取商品列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const brand = searchParams.get('brand');
  const category = searchParams.get('category');
  const lifecycleStatus = searchParams.get('lifecycleStatus');
  const isActive = searchParams.get('isActive');

  try {
    // 先获取数据
    let dataQuery = client.from('products').select('*');

    if (search) {
      dataQuery = dataQuery.or(`code.ilike.%${search}%,name.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (brand) {
      dataQuery = dataQuery.eq('brand', brand);
    }

    if (category) {
      dataQuery = dataQuery.eq('category', category);
    }

    if (lifecycleStatus) {
      dataQuery = dataQuery.eq('lifecycle_status', lifecycleStatus);
    }

    if (isActive === 'true') {
      dataQuery = dataQuery.eq('is_active', true);
    }

    dataQuery = dataQuery.order('created_at', { ascending: false });
    
    const { data, error } = await dataQuery.range(0, 9999);
    if (error) throw new Error(`查询商品失败: ${error.message}`);

    // 使用返回的数据长度作为总数
    // 注意：Supabase 免费版限制返回最多 1000 条
    const total = data?.length || 0;
    const hasMore = total >= 10000; // 如果获取了 10000 条，可能还有更多

    const transformedData = (data || []).map((product) => transformProduct(product as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: total,
      hasMore: hasMore,
    });
  } catch (error) {
    console.error('获取商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增商品
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_CREATE);
  if (authError) return authError;

  const client = getSupabaseClient();
  
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
      is_active: body.isActive !== false,
      remark: body.remark,
      // 尺寸和重量字段
      length_cm: body.lengthCm || null,
      width_cm: body.widthCm || null,
      height_cm: body.heightCm || null,
      weight_kg: body.weightKg || null,
      volume_factor: body.volumeFactor || 6000,
    };

    const { data, error } = await client
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) throw new Error(`创建商品失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformProduct(data as Record<string, unknown>),
      message: '商品创建成功'
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
