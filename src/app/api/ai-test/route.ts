import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';
import { buildAiTestMockResult } from '@/lib/ai-test-mock';

// 执行AI测试
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.AGENT_CONFIGS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { agentId, input, prompt } = body;
    
    if (!input && !prompt) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供输入内容' 
      }, { status: 400 });
    }

    let agent = null;

    // 如果提供了agentId，获取Agent配置
    if (agentId) {
      const { data, error } = await client
        .from('agent_configs')
        .select('*')
        .eq('id', agentId)
        .single();
      
      if (error) throw new Error(`查询Agent配置失败: ${error.message}`);
      if (!data) throw new Error('Agent配置不存在');
      
      agent = data;
    }

    // 替换模板变量
    // 调用LLM API
    // 注意：这里需要使用LLM技能，实际实现时调用LLM API
    const startTime = Date.now();
    
    // 模拟调用（实际实现时需要调用真实的LLM API）
    // const llmResponse = await callLLM({
    //   prompt: finalPrompt,
    //   model: agent?.model || 'doubao-seed',
    //   temperature: agent?.temperature || 0.7,
    // });
    
    // 模拟响应
    const mockResponse = buildAiTestMockResult(input || prompt || '', Date.now() - startTime);

    // 更新Agent统计
    if (agent) {
      const newRunCount = (agent.run_count || 0) + 1;
      const newSuccessCount = (agent.success_count || 0) + 1;
      const avgDuration = Math.round(((agent.avg_duration_ms || 0) * agent.run_count + mockResponse.duration) / newRunCount);
      
      await client
        .from('agent_configs')
        .update({
          test_input: input,
          test_output: mockResponse.output,
          test_status: mockResponse.agentTestStatus,
          last_run_at: new Date().toISOString(),
          run_count: newRunCount,
          success_count: newSuccessCount,
          avg_duration_ms: avgDuration,
        })
        .eq('id', agentId);
      
      // 记录日志
      await client
        .from('ai_logs')
        .insert({
          agent_id: agentId,
          agent_code: agent.code,
          agent_name: agent.name,
          input: input,
          output: mockResponse.output,
          status: mockResponse.logStatus,
          duration_ms: mockResponse.duration,
          model: agent.model,
          config: agent.config,
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        output: mockResponse.output,
        duration: mockResponse.duration,
        mode: mockResponse.mode,
      },
      message: '测试执行完成（模拟模式）'
    });
  } catch (error) {
    console.error('AI测试失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
