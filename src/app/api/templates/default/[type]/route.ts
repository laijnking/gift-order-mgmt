import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取指定类型的默认模板
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const partnerId = searchParams.get('partnerId');
  const partnerType = searchParams.get('partnerType'); // 'customer' | 'supplier'

  try {
    if (!type) {
      return NextResponse.json({ success: false, error: '缺少type参数' }, { status: 400 });
    }

    // 1. 先查找是否有专属模板（客户或供应商关联的模板）
    if (partnerId && partnerType) {
      const linkTable = partnerType === 'customer' ? 'customer_links' : 'supplier_links';
      
      // 查找关联的模板
      const { data: links, error: linkError } = await client
        .from('template_links')
        .select('template_id')
        .eq('link_type', partnerType)
        .eq('partner_id', partnerId);

      if (!linkError && links && links.length > 0) {
        const templateIds = links.map((l: any) => l.template_id);
        
        // 获取这些模板中该类型的
        const { data: linkedTemplates, error: templateError } = await client
          .from('templates')
          .select('*')
          .in('id', templateIds)
          .eq('type', type)
          .eq('is_active', true)
          .single();

        if (!templateError && linkedTemplates) {
          return NextResponse.json({
            success: true,
            data: linkedTemplates,
            source: 'linked'
          });
        }
      }
    }

    // 2. 查找默认模板
    const { data: defaultTemplates, error: defaultError } = await client
      .from('templates')
      .select('*')
      .eq('type', type)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (defaultError && defaultError.code !== 'PGRST116') {
      throw new Error(`查询默认模板失败: ${defaultError.message}`);
    }

    if (defaultTemplates) {
      return NextResponse.json({
        success: true,
        data: defaultTemplates,
        source: 'default'
      });
    }

    // 3. 如果没有默认模板，返回该类型第一个可用模板
    const { data: firstTemplates, error: firstError } = await client
      .from('templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (firstError && firstError.code !== 'PGRST116') {
      throw new Error(`查询模板失败: ${firstError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: firstTemplates,
      source: 'first'
    });
  } catch (error) {
    console.error('获取默认模板失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
