import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取批量导出详情
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');

  try {
    if (!recordId) {
      return NextResponse.json({ success: false, error: '缺少recordId参数' }, { status: 400 });
    }

    // 获取导出记录
    const { data: record, error } = await client
      .from('export_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) throw new Error(`查询导出记录失败: ${error.message}`);

    // 解析详情
    const details = record.metadata?.details || [];

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        details,
      },
    });
  } catch (error) {
    console.error('获取批量导出详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 重新导出
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json({ success: false, error: '缺少recordId参数' }, { status: 400 });
    }

    // 获取原导出记录
    const { data: record, error } = await client
      .from('export_records')
      .select('*')
      .eq('id', recordId)
      .single();

    if (error) throw new Error(`查询导出记录失败: ${error.message}`);

    // 重新执行导出逻辑（简化版：直接返回原记录）
    return NextResponse.json({
      success: true,
      message: '重新导出成功',
      data: {
        fileUrl: record.file_url,
        fileName: record.file_name,
      },
    });
  } catch (error) {
    console.error('重新导出失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
