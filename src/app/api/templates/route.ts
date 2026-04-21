import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { normalizeTemplateType, syncTemplateTargetLink, transformTemplateRecord, type TemplateRecord } from '@/lib/template-utils';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取模板列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  try {
    let query = client.from('templates').select('*');

    if (type) {
      query = query.eq('type', normalizeTemplateType(type));
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('is_default', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询模板失败: ${error.message}`);

    const transformedData = (data || []).map((template) => transformTemplateRecord(template as TemplateRecord));

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
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

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
      type: normalizeTemplateType(body.type),
      target_type: body.targetType || null,
      target_id: body.targetId || null,
      target_name: body.targetName || null,
      field_mappings: body.fieldMappings ? JSON.stringify(body.fieldMappings) : '{}',
      config: {
        fieldMappings: body.fieldMappings || {},
      },
      is_default: body.isDefault ?? false,
      is_active: body.isActive !== false,
    };

    const { data, error } = await client
      .from('templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) throw new Error(`创建模板失败: ${error.message}`);

    await syncTemplateTargetLink(client, {
      templateId: String(data.id),
      targetType: body.targetType || null,
      targetId: body.targetId || null,
      targetName: body.targetName || null,
    });

    return NextResponse.json({
      success: true,
      data: transformTemplateRecord(data as TemplateRecord),
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
