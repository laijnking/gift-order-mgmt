import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { PERMISSIONS } from '@/lib/permissions';
import { toggleRuleStatus } from '@/lib/rules/storage';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);
  const { id } = await params;

  try {
    const success = await toggleRuleStatus(tenant.tenantId, id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: '切换状态失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '状态切换成功',
    });
  } catch (error) {
    console.error('切换业务规则状态失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}