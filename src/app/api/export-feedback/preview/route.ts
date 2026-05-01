import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface PreviewRequest {
  customerIds: string[];
  templateId?: string | null;
}

/**
 * 导出预览接口
 * 
 * 返回预览信息：
 * - 客户数量
 * - 订单数量
 * - 将使用的模板来源
 */
export async function POST(request: NextRequest) {
  try {
    const body: PreviewRequest = await request.json();
    const { customerIds, templateId } = body;

    if (!customerIds || customerIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请至少选择一个客户' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 查询待导出的订单数量
    const { count: orderCount, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('customer_id', customerIds)
      .eq('status', 'returned');

    if (countError) {
      console.error('预览查询失败:', countError);
      return NextResponse.json(
        { success: false, error: '预览查询失败' },
        { status: 500 }
      );
    }

    // 确定模板来源
    let templateSource = 'default';
    if (templateId) {
      // 有指定模板 - 手动选择
      templateSource = 'explicit';
    } else {
      // 检查是否有客户映射
      const { data: mappings } = await supabase
        .from('column_mappings')
        .select('id')
        .in('customer_id', customerIds)
        .limit(1);

      if (mappings && mappings.length > 0) {
        templateSource = 'column_mapping';
      } else {
        // 使用兜底模板
        templateSource = 'first';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        customerCount: customerIds.length,
        orderCount: count || 0,
        templateSource,
      },
    });
  } catch (error) {
    console.error('预览接口异常:', error);
    return NextResponse.json(
      { success: false, error: '服务器异常' },
      { status: 500 }
    );
  }
}
