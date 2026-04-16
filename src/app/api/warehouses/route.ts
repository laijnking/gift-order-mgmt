import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformWarehouse(dbWarehouse: Record<string, unknown>) {
  return {
    id: dbWarehouse.id,
    code: dbWarehouse.code,
    name: dbWarehouse.name,
    shortName: dbWarehouse.short_name,
    type: dbWarehouse.type,
    contactPerson: dbWarehouse.contact_person,
    contactPhone: dbWarehouse.contact_phone,
    address: dbWarehouse.address,
    province: dbWarehouse.province,
    city: dbWarehouse.city,
    isActive: dbWarehouse.is_active,
    remark: dbWarehouse.remark,
    createdAt: dbWarehouse.created_at,
    updatedAt: dbWarehouse.updated_at,
  };
}

// 获取仓库列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  try {
    let query = client.from('warehouses').select('*');

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询仓库失败: ${error.message}`);

    const transformedData = (data || []).map((warehouse) => transformWarehouse(warehouse as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取仓库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增仓库
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    const warehouseData = {
      code: body.code,
      name: body.name,
      short_name: body.shortName,
      type: body.type,
      contact_person: body.contactPerson,
      contact_phone: body.contactPhone,
      address: body.address,
      province: body.province,
      city: body.city,
      is_active: body.isActive !== false,
      remark: body.remark,
    };

    const { data, error } = await client
      .from('warehouses')
      .insert(warehouseData)
      .select()
      .single();
    
    if (error) throw new Error(`创建仓库失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformWarehouse(data as Record<string, unknown>),
      message: '仓库创建成功'
    });
  } catch (error) {
    console.error('创建仓库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
