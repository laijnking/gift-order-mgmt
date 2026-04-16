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
    fieldMappings: typeof dbTemplate.field_mappings === 'string' 
      ? JSON.parse(dbTemplate.field_mappings) 
      : (dbTemplate.field_mappings as Record<string, string> || {}),
    isDefault: dbTemplate.is_default ?? false,
    isActive: dbTemplate.is_active ?? true,
    createdAt: dbTemplate.created_at,
    updatedAt: dbTemplate.updated_at as string | undefined,
  };
}

// 获取单个模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      data: transformTemplate(data as Record<string, unknown>),
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
  const client = getSupabaseClient();
  const { id } = await params;
  
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

    const templateData: Record<string, unknown> = {
      name: body.name,
      description: body.description,
      type: body.type,
      field_mappings: body.fieldMappings ? JSON.stringify(body.fieldMappings) : '{}',
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

    return NextResponse.json({
      success: true,
      data: transformTemplate(data as Record<string, unknown>),
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
  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
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
