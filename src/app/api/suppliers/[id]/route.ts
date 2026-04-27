import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 数据库字段转前端格式（统一使用 shippers 表）
function transformSupplier(dbSupplier: Record<string, unknown>) {
  return {
    id: dbSupplier.id,
    code: (dbSupplier.code || String(dbSupplier.id).slice(0, 8)) as string,
    name: dbSupplier.name,
    shortName: (dbSupplier.short_name || '') as string,
    type: dbSupplier.type as string,
    contactPerson: ((dbSupplier.contact_person as string) || (dbSupplier.contact as string) || '') as string,
    contactPhone: (dbSupplier.contact_phone || (dbSupplier.phone as string) || '') as string,
    province: (dbSupplier.province || '') as string,
    city: (dbSupplier.city || '') as string,
    address: (dbSupplier.address || '') as string,
    sendType: (dbSupplier.send_type || 'download') as string,
    canJd: dbSupplier.can_jd ?? true,
    canPdd: dbSupplier.can_pdd ?? false,
    jdChannelId: (dbSupplier.jd_channel_id || '') as string,
    pddShopId: (dbSupplier.pdd_shop_id || '') as string,
    expressRestrictions: typeof dbSupplier.express_restrictions === 'string'
      ? JSON.parse(dbSupplier.express_restrictions)
      : (dbSupplier.express_restrictions as string[] | undefined),
    costFactor: dbSupplier.cost_factor as number | undefined,
    settlementType: (dbSupplier.settlement_type || 'monthly') as string,
    isActive: dbSupplier.is_active ?? true,
    remark: (dbSupplier.remark || '') as string,
    createdAt: dbSupplier.created_at,
    updatedAt: dbSupplier.updated_at as string | undefined,
  };
}

// 获取单个供应商（统一查询 shippers 表）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { data, error } = await client
      .from('shippers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询供应商失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: '供应商不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transformSupplier(data as Record<string, unknown>),
    });
  } catch (error) {
    console.error('获取供应商失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新供应商（统一更新 shippers 表）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    const supplierData = {
      name: body.name,
      short_name: body.shortName,
      type: body.type,
      contact_person: body.contactPerson,
      contact_phone: body.contactPhone,
      phone: body.contactPhone,
      province: body.province,
      city: body.city,
      address: body.address,
      send_type: body.sendType,
      can_jd: body.canJd,
      can_pdd: body.canPdd,
      jd_channel_id: body.jdChannelId,
      pdd_shop_id: body.pddShopId,
      express_restrictions: body.expressRestrictions ? JSON.stringify(body.expressRestrictions) : '[]',
      cost_factor: body.costFactor,
      settlement_type: body.settlementType || 'monthly',
      remark: body.remark,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('shippers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新供应商失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformSupplier(data as Record<string, unknown>),
      message: '供应商更新成功'
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除供应商（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_DELETE);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { error } = await client
      .from('shippers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`删除供应商失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '供应商删除成功'
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
