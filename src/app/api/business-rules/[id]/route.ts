import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { PERMISSIONS } from '@/lib/permissions';
import { getRuleById, updateRule, deleteRule } from '@/lib/rules/storage';
import type { ConditionGroup, Action } from '@/lib/rules/engine';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);

  try {
    const rule = await getRuleById(tenant.tenantId, params.id);

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '规则不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('查询业务规则失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);

  try {
    const body = await request.json();
    const { name, description, enabled, priority, triggerType, conditions, actions } = body;

    const updates: Partial<{
      name: string;
      description: string;
      enabled: boolean;
      priority: number;
      triggerType: 'event' | 'schedule' | 'manual';
      conditions: ConditionGroup;
      actions: Action[];
    }> = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (enabled !== undefined) updates.enabled = enabled;
    if (priority !== undefined) updates.priority = priority;
    if (triggerType !== undefined) updates.triggerType = triggerType as 'event' | 'schedule' | 'manual';
    if (conditions !== undefined) updates.conditions = conditions as ConditionGroup;
    if (actions !== undefined) updates.actions = actions as Action[];

    const rule = await updateRule(tenant.tenantId, params.id, updates);

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '更新规则失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rule,
      message: '业务规则更新成功',
    });
  } catch (error) {
    console.error('更新业务规则失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);

  try {
    const success = await deleteRule(tenant.tenantId, params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: '删除规则失败' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '业务规则删除成功',
    });
  } catch (error) {
    console.error('删除业务规则失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}