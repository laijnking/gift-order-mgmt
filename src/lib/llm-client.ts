import OpenAI from 'openai';

const MODEL_TO_API: Record<string, { apiKey: string; baseURL: string }> = {
  'deepseek-chat': {
    apiKey: process.env.LLM_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.LLM_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  },
  'doubao-seed': {
    apiKey: process.env.LLM_DOUBAO_API_KEY || '',
    baseURL: process.env.LLM_DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  },
  'doubao-pro': {
    apiKey: process.env.LLM_DOUBAO_API_KEY || '',
    baseURL: process.env.LLM_DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  },
  'kimi-chat': {
    apiKey: process.env.LLM_KIMI_API_KEY || '',
    baseURL: process.env.LLM_KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
  },
};

export interface CallLLMOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface CallLLMResult {
  text: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * 统一的 LLM API 调用客户端。
 * 支持 DeepSeek、豆包、Kimi 等 OpenAI 兼容 API。
 */
export async function callLLM(
  prompt: string,
  options: CallLLMOptions,
): Promise<CallLLMResult> {
  const { model, temperature, maxTokens, systemPrompt } = options;

  const config = MODEL_TO_API[model];
  if (!config) {
    throw new Error(`不支持的模型: ${model}`);
  }

  const apiKey = config.apiKey;
  if (!apiKey) {
    throw new Error(
      `模型 ${model} 的 API Key 未配置，请在环境变量中设置对应的 API Key`,
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: config.baseURL,
    timeout: 30000,
    maxRetries: 2,
  });

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: model === 'deepseek-chat' ? undefined : undefined,
  });

  const choice = response.choices[0];
  if (!choice?.message?.content) {
    throw new Error('LLM 返回空响应');
  }

  return {
    text: choice.message.content,
    model: response.model,
    usage: response.usage
      ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        }
      : undefined,
  };
}
