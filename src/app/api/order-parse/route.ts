import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { buildBundleDraftsFromFlatOrders } from '@/lib/order-parse-bundles';
import { ensurePendingMatchProduct } from '@/lib/order-parser';
import { SupabaseClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/server-auth';
import type { ParsedOrderDraft } from '@/types/order-parse';
import { PERMISSIONS } from '@/lib/permissions';
import { callLLM } from '@/lib/llm-client';

// 解析订单文本
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { text, customerCode } = body;

    if (!text) {
      return NextResponse.json({
        success: false,
        error: '请提供订单文本内容'
      }, { status: 400 });
    }

    // 获取订单解析Agent配置
    const { data: agent, error: agentError } = await client
      .from('agent_configs')
      .select('*')
      .eq('type', 'order_parser')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (agentError && agentError.code !== 'PGRST116') {
      console.error('查询Agent配置失败:', agentError);
    }

    const defaultPromptTemplate =
      `你是一个订单信息提取助手。请从以下文本中提取订单信息，返回JSON格式。\n\n输入文本：\n{input}\n\n请提取以下信息并返回JSON格式数组，每项包含：\n- product_name: 商品名称（必填）\n- product_spec: 规格型号（如果有）\n- quantity: 数量（默认为1）\n- receiver_name: 收货人姓名\n- receiver_phone: 收货人电话\n- receiver_address: 收货人地址\n\n如果没有找到订单，返回空数组[]。`;

    const promptTemplate = agent?.prompt_template || defaultPromptTemplate;

    const startTime = Date.now();
    let orders: ParsedOrderDraft[] = [];
    let parseMode: 'llm' | 'rules' = 'rules';
    let llmError: string | null = null;

    // 1. 尝试 LLM 解析
    if (agent) {
      try {
        const finalPrompt = promptTemplate.replace('{input}', text).replace('{customer_code}', customerCode || '');
        const llmResult = await callLLM(finalPrompt, {
          model: (agent.model as string) || 'deepseek-chat',
          temperature: (agent.temperature as number) ?? 0.3,
          maxTokens: (agent.max_tokens as number) || 2000,
          systemPrompt: '你是专业的订单信息提取助手，只返回合法的JSON，不要包含任何额外说明。',
        });

        // 尝试从 LLM 响应中提取 JSON
        const jsonStr = extractJsonFromText(llmResult.text);
        const parsed = JSON.parse(jsonStr);

        if (Array.isArray(parsed) && parsed.length > 0) {
          orders = normalizeLLMOrders(parsed);
          parseMode = 'llm';
        } else {
          llmError = 'LLM 返回空结果，回退到规则解析';
        }
      } catch (err) {
        llmError = err instanceof Error ? err.message : 'LLM 调用失败';
        console.warn('LLM 解析失败，回退到规则解析:', llmError);
      }
    }

    // 2. 回退到规则解析
    if (orders.length === 0) {
      orders = parseOrdersByRules(text);
      parseMode = 'rules';
    }

    const duration = Date.now() - startTime;

    // 如果提供了客户编码，进行SKU映射
    let mappedOrders = orders;
    if (customerCode && orders.length > 0) {
      mappedOrders = await applySkuMappings(client, orders, customerCode);
    }

    // 对未匹配到系统商品的订单，回退到默认「商品待匹配」档案
    const pendingProduct = await ensurePendingMatchProduct(client).catch(() => null);
    mappedOrders = mappedOrders.map(order => {
      if (order.systemProductId || order.mappedProductName) return order;
      return {
        ...order,
        systemProductId: pendingProduct?.id as string || undefined,
        mappedProductName: pendingProduct?.name as string || '商品待匹配',
        mappedProductSpec: pendingProduct?.spec as string || undefined,
        mappedProductCode: pendingProduct?.code as string || undefined,
        mappedProductBrand: pendingProduct?.brand as string || undefined,
      };
    });

    const bundleOrders = buildBundleDraftsFromFlatOrders(mappedOrders);

    // 记录日志
    if (agent) {
      await client
        .from('ai_logs')
        .insert({
          agent_id: agent.id,
          agent_code: agent.code,
          agent_name: agent.name,
          input: text,
          output: JSON.stringify(bundleOrders),
          status: parseMode === 'llm' ? 'success' : 'fallback',
          duration_ms: duration,
          model: agent.model,
          metadata: {
            customerCode,
            parseMode,
            llmError,
            orderCount: bundleOrders.length,
          },
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: bundleOrders,
        rawOutput: JSON.stringify(bundleOrders),
        duration,
        parseMode,
      },
      message: parseMode === 'llm'
        ? `AI 解析成功，提取出 ${bundleOrders.length} 条订单`
        : `成功解析出 ${bundleOrders.length} 条订单` + (llmError ? `（注：AI 解析未成功，使用规则解析）` : ''),
    });
  } catch (error) {
    console.error('订单解析失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

/** 从 LLM 响应文本中提取 JSON 部分 */
function extractJsonFromText(text: string): string {
  // 尝试匹配 ```json ... ``` 包裹的代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // 尝试匹配 [ ... ] 数组
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  // 直接返回原文
  return text;
}

/** 将 LLM 返回的原始 JSON 规范化为 ParsedOrderDraft[] */
function normalizeLLMOrders(raw: unknown[]): ParsedOrderDraft[] {
  return raw.map((item: unknown, index: number) => {
    const it = item as Record<string, unknown>;
    return {
    id: `llm_${Date.now()}_${index}`,
    product_name: String(it.product_name || it['商品名称'] || it['商品名'] || it['名称'] || ''),
    product_spec: String(it.product_spec || it['规格型号'] || it['规格'] || it['型号'] || ''),
    quantity: Number(it.quantity || it['数量'] || 1),
    receiver_name: String(it.receiver_name || it['收货人'] || it['收件人'] || it['收货人姓名'] || ''),
    receiver_phone: String(it.receiver_phone || it['收货人电话'] || it['电话'] || it['手机'] || ''),
    receiver_address: String(it.receiver_address || it['收货地址'] || it['地址'] || ''),
    customerSku: typeof it.customer_sku === 'string' ? it.customer_sku : undefined,
    customerPrice: typeof it.price === 'number' ? it.price : undefined,
  };
  });
}

// ========== 规则解析器（回退方案）==========

/** 已知的 meta 标签关键词，用于跳过非商品行 */
const META_KEYWORDS = [
  /收货人[：:]/i, /收件人[：:]/i, /客户[：:]/i,
  /电话[：:]/i, /手机[号]?[：:]/i, /收货电话[：:]/i, /联系[方式]?[：:]/i, /订单号[：:]/i, /渠道单号[：:]/i, /JD/i,
  /地址[：:]/i, /收货地址[：:]/i, /省[市份]/,
  /备注[：:]/i, /急单/,
  /商品明细[：:]?/i, /要看?的货[：:]?/i,
  /^规格[：:]/i, /^型号[：:]/i, /^单价[：:]/i,
];

/** 使用规则解析订单 */
function parseOrdersByRules(text: string): ParsedOrderDraft[] {
  const raw = text.trim();
  if (!raw) return [];

  // 按订单分隔符拆分为多个订单块
  const blocks = splitOrderBlocks(raw);

  return blocks.flatMap((block) => {
    const orders = parseSingleBlock(block);
    return orders;
  });
}

/** 按分隔符将文本拆分为多个订单块 */
function splitOrderBlocks(text: string): string[] {
  // 按显式分隔符拆分
  const parts = text.split(/[-–—]{3,}|\n{2,}|(?=订单[号]?[:：])/);
  // 过滤空块
  const nonEmpty = parts.filter(p => p.trim());
  if (nonEmpty.length > 1) return nonEmpty;
  return [text];
}

/** 解析单个订单块 */
function parseSingleBlock(block: string): ParsedOrderDraft[] {
  const lines = block.split(/\n/).filter(l => l.trim());
  const products: ParsedOrderDraft[] = [];

  let receiverName = '';
  let receiverPhone = '';
  let receiverAddress = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // 跳过备注/急单等纯 meta 行
    if (/^(备注|急单|客户|订单号|渠道单号|商品明细|要看?的货)/.test(line)) continue;

    // 提取收货人
    const nameM = line.match(/(?:收货人|收件人|联系人)[：:]\s*(.+)/i);
    if (nameM) { receiverName = nameM[1].trim(); continue; }

    // 提取电话
    const phoneM = line.match(/(?:电话|手机号?|收货电话|联系方式)[：:]*\s*(1[3-9]\d{9})/i);
    if (phoneM) { receiverPhone = phoneM[1]; continue; }
    // 行内独立手机号
    const standalonePhone = line.match(/^(1[3-9]\d{9})$/);
    if (standalonePhone) { receiverPhone = standalonePhone[1]; continue; }

    // 提取地址
    const addrM = line.match(/(?:地址|收货地址|联系地址)[：:]\s*(.+)/i);
    if (addrM) { receiverAddress = addrM[1].trim(); continue; }

    // 提取规格/型号（关联到上一个商品）
    const specLineM = line.match(/^(?:规格|型号)[：:]\s*(.+)/i);
    if (specLineM && products.length > 0) {
      products[products.length - 1].product_spec = specLineM[1].trim();
      continue;
    }

    // 提取单价（关联到上一个商品）
    const priceLineM = line.match(/^单价[：:]\s*([\d.]+)/i);
    if (priceLineM && products.length > 0) {
      products[products.length - 1].customerPrice = parseFloat(priceLineM[1]);
      continue;
    }

    // 尝试匹配 "姓名 手机号 地址+商品" 格式（无标签）
    const compactM = line.match(/^(\S{2,4})\s+(1[3-9]\d{9})\s+(.+)$/);
    if (compactM) {
      receiverName = compactM[1];
      receiverPhone = compactM[2];
      const rest = compactM[3].trim();
      // 尝试按地址结尾词分割出商品部分
      const addrSplitM = rest.match(/^(.+?[号楼市栋单元弄街路巷村])\s+(.+)$/);
      if (addrSplitM) {
        receiverAddress = addrSplitM[1];
        const p = parseProductLine(addrSplitM[2]);
        if (p) {
          products.push({ ...p, receiver_name: receiverName, receiver_phone: receiverPhone, receiver_address: receiverAddress, id: `text_${Date.now()}_${products.length}` });
          continue;
        }
      }
      receiverAddress = rest;
      continue;
    }

    // 尝试匹配列表格式 "- 商品名 数量"
    const listItemM = line.match(/^[-•*]\s*(.+?)(?:(\d+)\s*[×xX台个件套瓶只盒条包])\s*$/);
    if (listItemM) {
      const p = parseProductLine(listItemM[1].trim());
      if (p) {
        products.push({ ...p, receiver_name: receiverName, receiver_phone: receiverPhone, receiver_address: receiverAddress, id: `text_${Date.now()}_${products.length}` });
        continue;
      }
    }

    // 尝试匹配普通商品行 "商品名 X数量"
    const p = parseProductLine(line);
    if (p) {
      products.push({ ...p, receiver_name: receiverName, receiver_phone: receiverPhone, receiver_address: receiverAddress, id: `text_${Date.now()}_${products.length}` });
      continue;
    }

    // 尝试匹配末尾有手机号的短行（可能是收货人信息行）
    const nameWithPhone = line.match(/^(\S{2,4})\s*(1[3-9]\d{9})$/);
    if (nameWithPhone) {
      receiverName = nameWithPhone[1];
      receiverPhone = nameWithPhone[2];
      continue;
    }
  }

  // 没有提取到商品时，尝试整块作为商品
  if (products.length === 0 && block.length > 0) {
    const cleaned = block.replace(/收货人|收件人|电话|手机|地址|订单号|备注/g, ' ').trim();
    if (cleaned.length > 0) {
      products.push({
        id: `text_${Date.now()}_0`,
        product_name: cleaned.substring(0, 100),
        product_spec: '',
        quantity: 1,
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
      });
    }
  }

  return products;
}

/** 从文本行中提取商品名、规格、数量 */
function parseProductLine(line: string): { product_name: string; product_spec: string; quantity: number } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 检查是否是 meta 行
  for (const kw of META_KEYWORDS) {
    if (kw.test(trimmed)) return null;
  }

  // 提取数量：结尾匹配 " X数+单位" 或 "数+ X单位"
  let quantity = 1;
  let namePart = trimmed;

  const qtyPatterns = [
    /\s*(\d+)\s*[×xX台个件套瓶只盒条包]\s*$/,
    /\s*[×xX]\s*(\d+)\s*$/,
  ];

  for (const pat of qtyPatterns) {
    const m = namePart.match(pat);
    if (m) {
      quantity = parseInt(m[1]);
      namePart = namePart.substring(0, m.index).trim();
      break;
    }
  }

  // 分离规格（如果包含规格关键词）
  let spec = '';
  const specM = namePart.match(/^(.+?)[（(]([^)）]+)[)）]$/);
  if (specM) {
    namePart = specM[1].trim();
    spec = specM[2].trim();
  }

  // 规格关键词
  const specKwM = namePart.match(/^(.+?)(?:规格[：:]*|[（(]([^)）]+)[)）])/);
  if (specKwM) {
    namePart = specKwM[1].trim();
    if (specKwM[2]) spec = specKwM[2].trim();
  }

  // 检查是否包含中文（商品名至少要有中文）
  if (!/[一-龥]/.test(namePart)) return null;
  // 要包含字母数字中文
  if (namePart.length < 2) return null;

  return {
    product_name: namePart.substring(0, 100),
    product_spec: spec,
    quantity,
  };
}

// 应用SKU映射
async function applySkuMappings(
  client: SupabaseClient,
  orders: ParsedOrderDraft[],
  customerCode: string
): Promise<ParsedOrderDraft[]> {
  // 获取该客户的所有SKU映射
  const { data: mappings } = await client
    .from('product_mappings')
    .select('*')
    .eq('customer_code', customerCode)
    .eq('is_active', true);

  if (!mappings || mappings.length === 0) {
    return orders;
  }

  // 创建映射表
  const mappingDict: Record<string, Record<string, unknown>> = {};
  for (const m of mappings) {
    const key = (m.customer_product_name || '').toLowerCase();
    if (key) {
      mappingDict[key] = m;
    }
  }

  // 应用映射
  return orders.map(order => {
    const productName = (String(order.product_name || '')).toLowerCase();

    // 查找匹配的映射
    for (const [key, mapping] of Object.entries(mappingDict)) {
      if (productName.includes(key) || key.includes(productName)) {
        return {
          ...order,
          mappedProductCode: typeof mapping.product_code === 'string' ? mapping.product_code : undefined,
          mappedProductName: typeof mapping.product_name === 'string' ? mapping.product_name : undefined,
          customerSku: typeof mapping.customer_sku === 'string' ? mapping.customer_sku : undefined,
          customerPrice: typeof mapping.price === 'number' ? mapping.price : undefined,
        };
      }
    }

    return order;
  });
}
