import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformShipper(dbShipper: Record<string, unknown>) {
  return {
    id: dbShipper.id,
    code: dbShipper.code,
    name: dbShipper.name,
    shortName: dbShipper.short_name || '',
    type: dbShipper.type || 'supplier',
    contactPerson: dbShipper.contact_person || '',
    contactPhone: dbShipper.contact_phone || '',
    province: dbShipper.province || '',
    city: dbShipper.city || '',
    address: dbShipper.address || '',
    sendType: dbShipper.send_type || 'download',
    jdChannelId: dbShipper.jd_channel_id || '',
    pddShopId: dbShipper.pdd_shop_id || '',
    canJd: dbShipper.can_jd ?? true,
    canPdd: dbShipper.can_pdd ?? true,
    expressRestrictions: typeof dbShipper.express_restrictions === 'string' 
      ? JSON.parse(dbShipper.express_restrictions as string) 
      : (dbShipper.express_restrictions as string[] | undefined) || [],
    settlementType: dbShipper.settlement_type || 'monthly',
    costFactor: dbShipper.cost_factor as number || 1.0,
    isActive: dbShipper.is_active ?? true,
    remark: dbShipper.remark || '',
    createdAt: dbShipper.created_at,
    updatedAt: dbShipper.updated_at as string | undefined,
  };
}

// 获取发货方列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'suppliers:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const active = searchParams.get('active');
  const sendType = searchParams.get('sendType');

  try {
    let query = client.from('shippers').select('*');

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,short_name.ilike.%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (sendType) {
      query = query.eq('send_type', sendType);
    }

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询发货方失败: ${error.message}`);

    const transformedData = (data || []).map((shipper) => transformShipper(shipper as Record<string, unknown>));

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

// 创建发货方
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'suppliers:create');
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    // 检查编码唯一性
    if (body.code) {
      const { data: existing } = await client
        .from('shippers')
        .select('id')
        .eq('code', body.code)
        .maybeSingle();
      
      if (existing) {
        return NextResponse.json({ 
          success: false, 
          error: '发货方编码已存在' 
        }, { status: 400 });
      }
    }

    const shipperData = {
      code: body.code,
      name: body.name,
      short_name: body.shortName,
      type: body.type || 'supplier',
      contact_person: body.contactPerson,
      contact_phone: body.contactPhone,
      province: body.province,
      city: body.city,
      address: body.address,
      send_type: body.sendType || 'download',
      jd_channel_id: body.jdChannelId,
      pdd_shop_id: body.pddShopId,
      can_jd: body.canJd ?? true,
      can_pdd: body.canPdd ?? true,
      express_restrictions: body.expressRestrictions ? JSON.stringify(body.expressRestrictions) : null,
      settlement_type: body.settlementType || 'monthly',
      cost_factor: body.costFactor || 1.0,
      is_active: body.isActive !== false,
      remark: body.remark,
    };

    const { data, error } = await client
      .from('shippers')
      .insert(shipperData)
      .select()
      .single();
    
    if (error) throw new Error(`创建发货方失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformShipper(data as Record<string, unknown>),
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
