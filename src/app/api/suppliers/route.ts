import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 数据库字段转前端格式
function transformSupplier(dbSupplier: Record<string, unknown>) {
  return {
    id: dbSupplier.id,
    code: (dbSupplier.code || String(dbSupplier.id).slice(0, 8)) as string,
    name: dbSupplier.name,
    shortName: (dbSupplier.short_name || '') as string,
    type: dbSupplier.type as string,
    contactPerson: (dbSupplier.contact_person || '') as string,
    contactPhone: (dbSupplier.contact_phone || '') as string,
    province: (dbSupplier.province || '') as string,
    city: (dbSupplier.city || '') as string,
    sendType: (dbSupplier.send_type || 'download') as string,
    canJd: dbSupplier.can_jd ?? true,
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

// 获取所有活跃供应商
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // warehouse | supplier
  const active = searchParams.get('active'); // 显式传 false 才返回 inactive

  try {
    let query = client.from('suppliers').select('*');

    // 默认只返回活跃供应商（除非显式传 active=false）
    if (active !== 'false') {
      query = query.eq('is_active', true);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询供应商失败: ${error.message}`);

    // 转换数据格式
    const transformedData = (data || []).map((supplier) => transformSupplier(supplier as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取供应商失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建供应商
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_CREATE);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    const supplierData = {
      name: body.name,
      short_name: body.shortName,
      type: body.type,
      contact: body.contact,
      send_type: body.sendType,
      province: body.province,
      can_jd: body.canJd ?? true,
      express_restrictions: body.expressRestrictions ? JSON.stringify(body.expressRestrictions) : null,
      cost_factor: body.costFactor || 1.0,
      settlement_type: body.settlementType || 'monthly',
      is_active: true,
      remark: body.remark,
      // code 由数据库迁移或 transformSupplier fallback 保证，此处可选传入
      ...(body.code ? { code: body.code } : {}),
    };

    const { data, error } = await client
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) throw new Error(`创建供应商失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformSupplier(data as Record<string, unknown>),
      message: '供应商创建成功'
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
