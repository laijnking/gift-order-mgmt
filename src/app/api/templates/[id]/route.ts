import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { normalizeTemplateType, syncTemplateTargetLink, transformTemplateRecord, type TemplateRecord } from '@/lib/template-utils';
import { requirePermission } from '@/lib/server-auth';

// 获取单个模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { data, error } = await client
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询模板失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: '模板不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transformTemplateRecord(data as TemplateRecord),
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新模板
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    // 如果设置为默认模板，先取消其他默认
    if (body.isDefault) {
      await client
        .from('templates')
        .update({ is_default: false })
        .eq('type', normalizeTemplateType(body.type))
        .eq('is_default', true);
    }

    const templateData: Record<string, unknown> = {
      name: body.name,
      code: body.code,
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
      is_active: body.isActive,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('templates')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新模板失败: ${error.message}`);

    await syncTemplateTargetLink(client, {
      templateId: id,
      targetType: body.targetType || null,
      targetId: body.targetId || null,
      targetName: body.targetName || null,
    });

    return NextResponse.json({
      success: true,
      data: transformTemplateRecord(data as TemplateRecord),
      message: '模板更新成功'
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除模板
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    await client.from('template_links').delete().eq('template_id', id);

    const { error } = await client
      .from('templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`删除模板失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
