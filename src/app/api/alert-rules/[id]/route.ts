import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

// 获取单个预警规则详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { data, error } = await client
      .from('alert_rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          error: '预警规则不存在'
        }, { status: 404 });
      }
      throw new Error(`查询预警规则失败: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        code: data.code,
        type: data.type,
        config: data.config,
        priority: data.priority,
        isEnabled: data.is_enabled,
        notificationChannels: data.notification_channels,
        description: data.description,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    });
  } catch (error) {
    console.error('获取预警规则详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 更新预警规则
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, type, config, priority, isEnabled, notificationChannels, description } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = config;
    if (priority !== undefined) updateData.priority = priority;
    if (isEnabled !== undefined) updateData.is_enabled = isEnabled;
    if (notificationChannels !== undefined) updateData.notification_channels = notificationChannels;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await client
      .from('alert_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`更新预警规则失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data,
      message: '预警规则更新成功'
    });
  } catch (error) {
    console.error('更新预警规则失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 删除预警规则
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { error } = await client
      .from('alert_rules')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`删除预警规则失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除预警规则失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
