import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 关联模板到客户或发货方
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { templateId, linkType, partnerId, partnerName } = body;

    if (!templateId || !linkType || !partnerId) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    if (!['customer', 'supplier'].includes(linkType)) {
      return NextResponse.json({ success: false, error: 'linkType必须是customer或supplier' }, { status: 400 });
    }

    // 检查是否已存在关联
    const { data: existing, error: existingError } = await client
      .from('template_links')
      .select('id')
      .eq('template_id', templateId)
      .eq('link_type', linkType)
      .eq('partner_id', partnerId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error(`检查关联失败: ${existingError.message}`);
    }

    if (existing) {
      return NextResponse.json({ success: true, message: '关联已存在', data: existing });
    }

    // 创建新关联
    const { data, error } = await client
      .from('template_links')
      .insert({
        template_id: templateId,
        link_type: linkType,
        partner_id: partnerId,
        partner_name: partnerName || null,
      })
      .select()
      .single();

    if (error) throw new Error(`创建关联失败: ${error.message}`);

    return NextResponse.json({ success: true, message: '关联成功', data });
  } catch (error) {
    console.error('关联模板失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 取消关联
export async function DELETE(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const linkType = searchParams.get('linkType');
    const partnerId = searchParams.get('partnerId');

    if (!templateId || !linkType || !partnerId) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const { error } = await client
      .from('template_links')
      .delete()
      .eq('template_id', templateId)
      .eq('link_type', linkType)
      .eq('partner_id', partnerId);

    if (error) throw new Error(`删除关联失败: ${error.message}`);

    return NextResponse.json({ success: true, message: '取消关联成功' });
  } catch (error) {
    console.error('取消关联失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 获取模板的关联列表
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('templateId');
  const linkType = searchParams.get('linkType');

  try {
    if (!templateId) {
      return NextResponse.json({ success: false, error: '缺少templateId参数' }, { status: 400 });
    }

    let query = client
      .from('template_links')
      .select('*')
      .eq('template_id', templateId);

    if (linkType) {
      query = query.eq('link_type', linkType);
    }

    const { data, error } = await query;

    if (error) throw new Error(`查询关联失败: ${error.message}`);

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('查询模板关联失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
