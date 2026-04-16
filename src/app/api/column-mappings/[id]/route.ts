import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取指定版本的映射配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少配置ID' }, { status: 400 });
    }

    const { data, error } = await client
      .from('column_mappings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`查询映射配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取映射配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 恢复指定版本配置为活跃状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少配置ID' }, { status: 400 });
    }

    // 获取目标配置
    const { data: target, error: fetchError } = await client
      .from('column_mappings')
      .select('customer_code, version')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(`查询配置失败: ${fetchError.message}`);

    // 将该客户所有配置标记为非活跃
    await client
      .from('column_mappings')
      .update({ is_active: false })
      .eq('customer_code', target.customer_code);

    // 将目标版本标记为活跃
    const { data, error } = await client
      .from('column_mappings')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`恢复配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data,
      message: `已恢复到版本 ${target.version}`
    });
  } catch (error) {
    console.error('恢复配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 删除映射配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少配置ID' }, { status: 400 });
    }

    const { error } = await client
      .from('column_mappings')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '配置已删除'
    });
  } catch (error) {
    console.error('删除配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
