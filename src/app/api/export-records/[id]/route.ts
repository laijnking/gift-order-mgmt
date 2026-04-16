import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取导出记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 获取导出记录
    const { data: record, error: recordError } = await client
      .from('export_records')
      .select('*')
      .eq('id', id)
      .single();

    if (recordError) throw new Error(`查询导出记录失败: ${recordError.message}`);

    // 获取批量导出详情
    let details = [];
    if (record.metadata?.details) {
      details = record.metadata.details;
    }

    // 获取供应商/客户信息
    let entityName = '';
    if (record.supplier_id) {
      const { data: supplier } = await client
        .from('suppliers')
        .select('name')
        .eq('id', record.supplier_id)
        .single();
      entityName = supplier?.name || '';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        entityName,
        details,
      },
    });
  } catch (error) {
    console.error('获取导出记录详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
