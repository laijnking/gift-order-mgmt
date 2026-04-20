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

// 获取Agent配置列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'agent_configs:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');

  try {
    let query = client.from('agent_configs').select('*');

    if (type) {
      query = query.eq('type', type);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('is_default', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询Agent配置失败: ${error.message}`);

    const transformedData = (data || []).map((agent) => transformAgent(agent as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取Agent配置失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增Agent配置
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'agent_configs:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    // 如果设置为默认，先取消其他默认
    if (body.isDefault) {
      await client
        .from('agent_configs')
        .update({ is_default: false })
        .eq('type', body.type)
        .eq('is_default', true);
    }
    
    const agentData = {
      name: body.name,
      code: body.code || `agent_${Date.now()}`,
      type: body.type,
      description: body.description || '',
      prompt_template: body.promptTemplate || '',
      config: body.config || {},
      model: body.model || 'doubao-seed',
      temperature: body.temperature || 0.7,
      max_tokens: body.maxTokens || 2000,
      is_active: body.isActive !== false,
      is_default: body.isDefault || false,
      test_input: body.testInput || null,
      test_output: body.testOutput || null,
      test_status: body.testStatus || null,
      remark: body.remark || '',
    };

    const { data, error } = await client
      .from('agent_configs')
      .insert(agentData)
      .select()
      .single();
    
    if (error) throw new Error(`添加Agent配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformAgent(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('添加Agent配置失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
