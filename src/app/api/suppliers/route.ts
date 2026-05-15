import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getTenantFromRequest } from '@/lib/tenant-context';
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

// 获取所有活跃发货方（统一查询 shippers 表）
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SUPPLIERS_VIEW);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // warehouse | supplier | jd | pdd | self | third_party
  const active = searchParams.get('active'); // 显式传 false 才返回 inactive

  try {
    // 统一查询 shippers 表
    let query = client.from('shippers').select('*').eq('tenant_id', tenant.tenantId);

    // 默认只返回活跃发货方（除非显式传 active=false）
    if (active !== 'false') {
      query = query.eq('is_active', true);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw new Error(`查询发货方失败: ${error.message}`);

    // 转换数据格式
    const transformedData = (data || []).map((supplier) => transformSupplier(supplier as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取发货方失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建发货方（统一写入 shippers 表）
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SUPPLIERS_CREATE);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);
  const client = getSupabaseClient();

  try {
    const body = await request.json();

    // 统一写入 shippers 表
    const supplierData = {
      tenant_id: tenant.tenantId,
      name: body.name,
      short_name: body.shortName,
      type: body.type || 'supplier',
      contact_person: body.contactPerson,
      contact_phone: body.contactPhone,
      phone: body.contactPhone,
      province: body.province,
      city: body.city,
      address: body.address,
      send_type: body.sendType || 'download',
      can_jd: body.canJd ?? false,
      can_pdd: body.canPdd ?? false,
      jd_channel_id: body.jdChannelId,
      pdd_shop_id: body.pddShopId,
      express_restrictions: body.expressRestrictions ? JSON.stringify(body.expressRestrictions) : '[]',
      cost_factor: body.costFactor || 1.0,
      settlement_type: body.settlementType || 'monthly',
      is_active: true,
      remark: body.remark,
      ...(body.code ? { code: body.code } : {}),
    };

    const { data, error } = await client
      .from('shippers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) throw new Error(`创建发货方失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformSupplier(data as Record<string, unknown>),
      message: '发货方创建成功'
    });
  } catch (error) {
    console.error('创建发货方失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
