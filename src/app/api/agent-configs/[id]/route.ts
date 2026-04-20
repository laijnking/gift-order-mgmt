import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformAgent(dbAgent: Record<string, unknown>) {
  return {
    id: dbAgent.id,
    name: dbAgent.name,
    code: dbAgent.code,
    type: dbAgent.type,
    description: dbAgent.description,
    promptTemplate: dbAgent.prompt_template,
    config: dbAgent.config,
    model: dbAgent.model,
    temperature: dbAgent.temperature,
    maxTokens: dbAgent.max_tokens,
    isActive: dbAgent.is_active,
    isDefault: dbAgent.is_default,
    testInput: dbAgent.test_input,
    testOutput: dbAgent.test_output,
    testStatus: dbAgent.test_status,
    lastRunAt: dbAgent.last_run_at,
    runCount: dbAgent.run_count,
    successCount: dbAgent.success_count,
    errorCount: dbAgent.error_count,
    avgDurationMs: dbAgent.avg_duration_ms,
    remark: dbAgent.remark,
    createdAt: dbAgent.created_at,
    updatedAt: dbAgent.updated_at,
  };
}

// 获取单个Agent配置
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'agent_configs:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    const { data, error } = await client
      .from('agent_configs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询Agent配置失败: ${error.message}`);
    if (!data) throw new Error('Agent配置不存在');

    return NextResponse.json({
      success: true,
      data: transformAgent(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('获取Agent配置失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新Agent配置
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'agent_configs:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    // 如果设置为默认，先取消其他默认
    if (body.isDefault) {
      await client
        .from('agent_configs')
        .update({ is_default: false })
        .eq('type', body.type)
        .eq('is_default', true)
        .neq('id', id);
    }
    
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.promptTemplate !== undefined) updateData.prompt_template = body.promptTemplate;
    if (body.config !== undefined) updateData.config = body.config;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.maxTokens !== undefined) updateData.max_tokens = body.maxTokens;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault;
    if (body.remark !== undefined) updateData.remark = body.remark;

    const { data, error } = await client
      .from('agent_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新Agent配置失败: ${error.message}`);
    if (!data) throw new Error('Agent配置不存在');

    return NextResponse.json({
      success: true,
      data: transformAgent(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('更新Agent配置失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除Agent配置
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'agent_configs:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 检查是否为默认配置
    const { data: agent } = await client
      .from('agent_configs')
      .select('is_default')
      .eq('id', id)
      .single();
    
    if (agent?.is_default) {
      return NextResponse.json({ 
        success: false, 
        error: '不能删除默认配置' 
      }, { status: 400 });
    }

    const { error } = await client
      .from('agent_configs')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`删除Agent配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除Agent配置失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
