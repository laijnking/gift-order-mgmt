import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取客户字段映射配置
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const customerCode = searchParams.get('customerCode');
  const activeOnly = searchParams.get('activeOnly') !== 'false';

  try {
    if (!customerCode) {
      return NextResponse.json({ success: false, error: '缺少customerCode参数' }, { status: 400 });
    }

    let query = client
      .from('column_mappings')
      .select('*')
      .eq('customer_code', customerCode)
      .order('version', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true).limit(1);
    }

    const { data, error } = await query;

    if (error) throw new Error(`查询字段映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取字段映射失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 保存客户字段映射配置
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerCode, mappingConfig, headerRow, remark, createdBy } = body;

    if (!customerCode || !mappingConfig) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // 获取当前最新版本号
    const { data: existing } = await client
      .from('column_mappings')
      .select('version')
      .eq('customer_code', customerCode)
      .eq('is_active', true)
      .single();

    const newVersion = (existing?.version || 0) + 1;

    // 先将旧的配置标记为非活跃
    await client
      .from('column_mappings')
      .update({ is_active: false })
      .eq('customer_code', customerCode)
      .eq('is_active', true);

    // 插入新配置
    const { data, error } = await client
      .from('column_mappings')
      .insert({
        customer_code: customerCode,
        mapping_config: mappingConfig,
        header_row: headerRow ?? 0,
        version: newVersion,
        is_active: true,
        remark: remark || null,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (error) throw new Error(`保存字段映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data,
      message: `成功保存字段映射配置，版本号：${newVersion}`
    });
  } catch (error) {
    console.error('保存字段映射失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 获取映射配置历史版本
export async function PUT(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const customerCode = searchParams.get('customerCode');

  try {
    if (!customerCode) {
      return NextResponse.json({ success: false, error: '缺少customerCode参数' }, { status: 400 });
    }

    const { data, error } = await client
      .from('column_mappings')
      .select('id, version, header_row, is_active, created_at, created_by, remark')
      .eq('customer_code', customerCode)
      .order('version', { ascending: false });

    if (error) throw new Error(`查询历史版本失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取历史版本失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
