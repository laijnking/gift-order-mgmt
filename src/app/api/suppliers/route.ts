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
    contactPerson: (dbSupplier as Record<string, unknown>).contact_person as string || '',
    contactPhone: (dbSupplier as Record<string, unknown>).contact_phone as string || '',
    province: (dbSupplier as Record<string, unknown>).province as string || '',
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

// 获取所有供应商
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'suppliers:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // warehouse | supplier
  const active = searchParams.get('active');

  try {
    let query = client.from('suppliers').select('*');

    if (active === 'true') {
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
  const authError = requirePermission(request, 'suppliers:create');
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
