import { NextRequest, NextResponse } from 'next/server';
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

// 获取发货方详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { data, error } = await client
      .from('shippers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: '发货方不存在' 
        }, { status: 404 });
      }
      throw new Error(`查询发货方失败: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: transformShipper(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('获取发货方详情失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新发货方
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const body = await request.json();

    // 检查编码唯一性（排除自己）
    if (body.code) {
      const { data: existing } = await client
        .from('shippers')
        .select('id')
        .eq('code', body.code)
        .neq('id', id)
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
      type: body.type,
      contact_person: body.contactPerson,
      contact_phone: body.contactPhone,
      province: body.province,
      city: body.city,
      address: body.address,
      send_type: body.sendType,
      jd_channel_id: body.jdChannelId,
      pdd_shop_id: body.pddShopId,
      can_jd: body.canJd,
      can_pdd: body.canPdd,
      express_restrictions: body.expressRestrictions ? JSON.stringify(body.expressRestrictions) : null,
      settlement_type: body.settlementType,
      cost_factor: body.costFactor,
      is_active: body.isActive,
      remark: body.remark,
      updated_at: new Date().toISOString(),
    };

    // 移除 undefined 值
    Object.keys(shipperData).forEach(key => {
      if (shipperData[key as keyof typeof shipperData] === undefined) {
        delete shipperData[key as keyof typeof shipperData];
      }
    });

    const { data, error } = await client
      .from('shippers')
      .update(shipperData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新发货方失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformShipper(data as Record<string, unknown>),
      message: '发货方更新成功'
    });
  } catch (error) {
    console.error('更新发货方失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除发货方
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 检查是否有关联的库存
    const { data: stockData } = await client
      .from('stocks')
      .select('id')
      .eq('supplier_id', id)
      .limit(1);
    
    if (stockData && stockData.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该发货方存在关联的库存记录，无法删除' 
      }, { status: 400 });
    }

    // 检查是否有关联的订单
    const { data: orderData } = await client
      .from('orders')
      .select('id')
      .eq('supplier_id', id)
      .limit(1);
    
    if (orderData && orderData.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: '该发货方存在关联的订单，无法删除' 
      }, { status: 400 });
    }

    const { error } = await client
      .from('shippers')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`删除发货方失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '发货方删除成功'
    });
  } catch (error) {
    console.error('删除发货方失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
