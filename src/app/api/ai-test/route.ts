import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 执行AI测试
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'agent_configs:edit');
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
    let promptTemplate = prompt;

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
      promptTemplate = promptTemplate || data.prompt_template;
    }

    // 替换模板变量
    const finalPrompt = promptTemplate.replace('{input}', input || '');

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
    const mockResponse = {
      success: true,
      output: `已处理输入内容，正在返回结果...\n\n输入: ${input || prompt}\n\n(这是模拟响应，实际使用时需要配置LLM API)`,
      duration: Date.now() - startTime,
    };

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
          test_status: 'success',
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
          status: 'success',
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
      },
      message: '测试执行成功'
    });
  } catch (error) {
    console.error('AI测试失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
