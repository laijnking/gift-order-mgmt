import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { PERMISSIONS } from '@/lib/permissions';
import { getRuleById } from '@/lib/rules/storage';
import { RuleEngine } from '@/lib/rules/engine';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);
  const { id } = await params;

  try {
    const body = await request.json();
    const { testData } = body;

    if (!testData || typeof testData !== 'object') {
      return NextResponse.json(
        { success: false, error: '测试数据无效' },
        { status: 400 }
      );
    }

    const rule = await getRuleById(tenant.tenantId, id);

    if (!rule) {
      return NextResponse.json(
        { success: false, error: '规则不存在' },
        { status: 404 }
      );
    }

    const engine = new RuleEngine();
    const result = await engine.test(rule, testData);

    return NextResponse.json({
      success: true,
      matched: result.matched,
      actions: result.matched ? rule.actions : [],
      evaluationTime: result.executionTime,
    });
  } catch (error) {
    console.error('测试业务规则失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}