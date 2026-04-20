import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
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

// 获取单个仓库
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'suppliers:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { data, error } = await client
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询仓库失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: '仓库不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transformWarehouse(data as Record<string, unknown>),
    });
  } catch (error) {
    console.error('获取仓库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新仓库
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'suppliers:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
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
      is_active: body.isActive !== undefined ? body.isActive : true,
      remark: body.remark,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('warehouses')
      .update(warehouseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新仓库失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformWarehouse(data as Record<string, unknown>),
      message: '仓库更新成功'
    });
  } catch (error) {
    console.error('更新仓库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除仓库（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'suppliers:delete');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { error } = await client
      .from('warehouses')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`删除仓库失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '仓库删除成功'
    });
  } catch (error) {
    console.error('删除仓库失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
