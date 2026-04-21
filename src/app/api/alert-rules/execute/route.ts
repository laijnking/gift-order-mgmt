import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { executeAlertRules } from '@/lib/alert-executor';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const result = await executeAlertRules({
      ruleId: body.ruleId,
      ruleCode: body.ruleCode,
      type: body.type,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `已执行 ${result.executedRules} 条规则，新增 ${result.totals.triggered} 条预警，复用 ${result.totals.reused} 条未处理预警，自动关闭 ${result.totals.resolved} 条预警`,
    });
  } catch (error) {
    console.error('执行预警规则失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
