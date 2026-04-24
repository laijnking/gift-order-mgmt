import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformSupplier(dbSupplier: Record<string, unknown>) {
  return {
    id: dbSupplier.id,
    code: (dbSupplier as Record<string, unknown>).code as string || '',
    name: dbSupplier.name,
    shortName: dbSupplier.short_name || '',
    type: dbSupplier.type,
    contact: dbSupplier.contact as string | undefined,
    contactPerson: (dbSupplier as Record<string, unknown>).contact_person as string || dbSupplier.contact as string || '',
    contactPhone: (dbSupplier as Record<string, unknown>).contact_phone as string || '',
    province: dbSupplier.province as string | undefined || (dbSupplier as Record<string, unknown>).region as string || '',
    city: (dbSupplier as Record<string, unknown>).city as string || '',
    sendType: dbSupplier.send_type || 'download',
    canJd: dbSupplier.can_jd ?? true,
    expressRestrictions: typeof dbSupplier.express_restrictions === 'string'
      ? JSON.parse(dbSupplier.express_restrictions)
      : (dbSupplier.express_restrictions as string[] | undefined),
    costFactor: dbSupplier.cost_factor as number | undefined,
    settlementType: dbSupplier.settlement_type as string || 'monthly',
    isActive: dbSupplier.is_active ?? true,
    remark: (dbSupplier as Record<string, unknown>).remark as string || '',
    createdAt: dbSupplier.created_at,
    updatedAt: dbSupplier.updated_at as string | undefined,
  };
}

// 获取单个供应商
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
      .from('suppliers')
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

// 更新供应商
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
    
    const supplierData = {
      name: body.name,
      short_name: body.shortName,
      type: body.type,
      contact: body.contact,
      send_type: body.sendType,
      province: body.province,
      can_jd: body.canJd,
      express_restrictions: body.expressRestrictions ? JSON.stringify(body.expressRestrictions) : null,
      cost_factor: body.costFactor,
      settlement_type: body.settlementType || 'monthly',
      remark: body.remark,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('suppliers')
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
  const authError = requirePermission(request, 'suppliers:delete');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { error } = await client
      .from('suppliers')
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
