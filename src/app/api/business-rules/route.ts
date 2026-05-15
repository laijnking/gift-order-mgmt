import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { PERMISSIONS } from '@/lib/permissions';
import { createRule, getRulesByTenant } from '@/lib/rules/storage';
import type { ConditionGroup, Action } from '@/lib/rules/engine';

export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);

  try {
    const rules = await getRulesByTenant(tenant.tenantId);

    return NextResponse.json({
      success: true,
      data: rules,
      total: rules.length,
    });
  } catch (error) {
    console.error('查询业务规则失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);

  try {
    const body = await request.json();
    const { name, description, enabled, priority, triggerType, conditions, actions } = body;

    if (!name || !triggerType || !conditions || !actions) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const rule = await createRule(
      tenant.tenantId,
      name,
      description || '',
      enabled ?? true,
      priority || 100,
      triggerType as 'event' | 'schedule' | 'manual',
      conditions as ConditionGroup,
      actions as Action[]
    );

    return NextResponse.json({
      success: true,
      data: rule,
      message: '业务规则创建成功',
    });
  } catch (error) {
    console.error('创建业务规则失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}