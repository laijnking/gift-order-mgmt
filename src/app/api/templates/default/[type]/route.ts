import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { resolvePreferredTemplate, transformTemplateRecord } from '@/lib/template-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 获取指定类型的默认模板
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const { type } = await params;
  const partnerId = searchParams.get('partnerId');
  const partnerType = searchParams.get('partnerType'); // 'customer' | 'supplier'

  try {
    if (!type) {
      return NextResponse.json({ success: false, error: '缺少type参数' }, { status: 400 });
    }

    const { template, source } = await resolvePreferredTemplate(client, {
      type,
      targetType: partnerType,
      targetId: partnerId,
    });

    return NextResponse.json({
      success: true,
      data: template ? transformTemplateRecord(template) : null,
      source,
    });
  } catch (error) {
    console.error('获取默认模板失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
