import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取模板字段列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');

  try {
    if (!templateId) {
      return NextResponse.json({ success: false, error: '缺少templateId参数' }, { status: 400 });
    }

    const { data, error } = await client
      .from('template_fields')
      .select('*')
      .eq('template_id', templateId)
      .order('order_num', { ascending: true });

    if (error) throw new Error(`查询模板字段失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取模板字段失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 保存模板字段配置
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { templateId, fields } = body;

    if (!templateId || !Array.isArray(fields)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    // 先删除现有字段
    await client.from('template_fields').delete().eq('template_id', templateId);

    // 插入新字段
    const fieldsData = fields.map((field: any, index: number) => ({
      template_id: templateId,
      field_id: field.fieldId,
      field_name: field.fieldName,
      source_table: field.sourceTable || null,
      source_field: field.sourceField || null,
      is_required: field.isRequired || false,
      order_num: field.order ?? index,
      width: field.width || 100,
      format: field.format || null,
    }));

    const { error } = await client.from('template_fields').insert(fieldsData);

    if (error) throw new Error(`保存模板字段失败: ${error.message}`);

    return NextResponse.json({ success: true, message: '模板字段保存成功' });
  } catch (error) {
    console.error('保存模板字段失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 更新单个模板字段
export async function PUT(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少字段ID' }, { status: 400 });
    }

    const { error } = await client
      .from('template_fields')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`更新模板字段失败: ${error.message}`);

    return NextResponse.json({ success: true, message: '模板字段更新成功' });
  } catch (error) {
    console.error('更新模板字段失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
