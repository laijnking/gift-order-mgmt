import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformTemplate(dbTemplate: Record<string, unknown>) {
  return {
    id: dbTemplate.id,
    code: dbTemplate.code,
    name: dbTemplate.name,
    description: dbTemplate.description as string || '',
    type: dbTemplate.type as string || 'dispatch',
    targetType: dbTemplate.target_type as string || '',
    targetId: dbTemplate.target_id as string || '',
    targetName: dbTemplate.target_name as string || '',
    fieldMappings: typeof dbTemplate.field_mappings === 'string' 
      ? JSON.parse(dbTemplate.field_mappings) 
      : (dbTemplate.field_mappings as Record<string, string> || {}),
    // config 字段用于前端配置，如果不存在则使用默认配置
    config: {
      columns: [
        { key: 'orderNo', header: '订单号', width: 20 },
        { key: 'customerOrderNo', header: '客户订单号', width: 20 },
        { key: 'receiverName', header: '收货人', width: 12 },
        { key: 'receiverPhone', header: '联系电话', width: 15 },
        { key: 'receiverAddress', header: '收货地址', width: 40 },
        { key: 'itemName', header: '商品名称', width: 20 },
        { key: 'itemQuantity', header: '数量', width: 8 },
        { key: 'itemPrice', header: '单价', width: 10 },
        { key: 'itemTotal', header: '小计', width: 10 },
        { key: 'remark', header: '备注', width: 20 }
      ],
      titleRow: true,
      freezePane: 'A2'
    },
    isDefault: dbTemplate.is_default ?? false,
    isActive: dbTemplate.is_active ?? true,
    createdAt: dbTemplate.created_at,
    updatedAt: dbTemplate.updated_at as string | undefined,
  };
}

// 获取模板列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  try {
    let query = client.from('templates').select('*');

    if (type) {
      query = query.eq('type', type);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('is_default', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询模板失败: ${error.message}`);

    const transformedData = (data || []).map((template) => transformTemplate(template as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建模板
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    // 如果设置为默认模板，先取消其他默认
    if (body.isDefault) {
      await client
        .from('templates')
        .update({ is_default: false })
        .eq('type', body.type)
        .eq('is_default', true);
    }

    const templateData = {
      code: body.code || `TPL-${Date.now()}`,
      name: body.name,
      description: body.description,
      type: body.type || 'dispatch',
      target_type: body.targetType || null,
      target_id: body.targetId || null,
      target_name: body.targetName || null,
      field_mappings: body.fieldMappings ? JSON.stringify(body.fieldMappings) : '{}',
      is_default: body.isDefault ?? false,
      is_active: body.isActive !== false,
    };

    const { data, error } = await client
      .from('templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) throw new Error(`创建模板失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformTemplate(data as Record<string, unknown>),
      message: '模板创建成功'
    });
  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
