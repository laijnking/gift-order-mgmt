export type AiTestMode = 'mock';

export interface AiTestMockResult {
  mode: AiTestMode;
  output: string;
  duration: number;
  message: string;
  agentTestStatus: 'mock';
  logStatus: 'mock';
}

export function buildAiTestMockResult(input: string, duration: number): AiTestMockResult {
  return {
    mode: 'mock',
    output: `当前处于模拟测试模式，尚未接入真实大模型调用。\n\n输入: ${input}\n\n如需真实测试结果，需要先配置并接入实际 LLM API。`,
    duration,
    message: '测试执行完成（模拟模式）',
    agentTestStatus: 'mock',
    logStatus: 'mock',
  };
}
