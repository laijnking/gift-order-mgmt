import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { buildBundleDraftsFromFlatOrders } from '@/lib/order-parse-bundles';
import { SupabaseClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/server-auth';
import type { ParsedOrderDraft } from '@/types/order-parse';
import { PERMISSIONS } from '@/lib/permissions';

// 解析订单文本
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_CREATE);
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

    const promptTemplate = agent?.prompt_template || 
      `你是一个订单信息提取助手。请从以下文本中提取订单信息，返回JSON格式。\n\n输入文本：\n{input}\n\n请提取以下信息并返回JSON格式数组，每项包含：\n- product_name: 商品名称（必填）\n- product_spec: 规格型号（如果有）\n- quantity: 数量（默认为1）\n- receiver_name: 收货人姓名\n- receiver_phone: 收货人电话\n- receiver_address: 收货人地址\n\n如果没有找到订单，返回空数组[]。`;

    // 调用LLM API
    const startTime = Date.now();
    
    // 使用规则解析作为主要方式
    // 实际实现时可以接入真实的LLM API
    const orders = parseOrdersByRules(text);

    const duration = Date.now() - startTime;

    // 如果提供了客户编码，进行SKU映射
    let mappedOrders = orders;
    if (customerCode && orders.length > 0) {
      mappedOrders = await applySkuMappings(client, orders, customerCode);
    }

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
          status: 'success',
          duration_ms: duration,
          model: agent.model,
          metadata: { customerCode },
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: bundleOrders,
        rawOutput: JSON.stringify(bundleOrders),
        duration,
      },
      message: `成功解析出 ${bundleOrders.length} 条订单`
    });
  } catch (error) {
    console.error('订单解析失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 使用规则解析订单
function parseOrdersByRules(text: string): ParsedOrderDraft[] {
  const orders: ParsedOrderDraft[] = [];
  
  // 清理文本
  const lines = text.split(/\n/).filter(line => line.trim());
  
  // 收货人信息
  let receiverName = '';
  let receiverPhone = '';
  let receiverAddress = '';
  
  // 商品信息
  let currentProduct = '';
  let currentQuantity = 1;
  let currentSpec = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 匹配收货人姓名
    const nameMatch = trimmed.match(/收货人[人姓名:：]*(.+)/i);
    if (nameMatch) {
      receiverName = nameMatch[1].trim();
      continue;
    }
    
    // 匹配电话
    const phoneMatch = trimmed.match(/(?:电话|手机|收货电话)[：:]*(1[3-9]\d{9})/);
    if (phoneMatch) {
      receiverPhone = phoneMatch[1];
      continue;
    }
    
    // 匹配收货地址
    const addressMatch = trimmed.match(/地址[：:]*(.+)/i);
    if (addressMatch) {
      receiverAddress = addressMatch[1].trim();
      continue;
    }
    
    // 匹配数量
    const quantityMatch = trimmed.match(/(\d+)[×xX台个件套]/);
    if (quantityMatch) {
      currentQuantity = parseInt(quantityMatch[1]);
    }
    
    // 匹配商品（假设商品名为2个以上汉字或包含特定关键词）
    const productMatch = trimmed.match(/^(.+?)(?:规格|型号|单价|数量|$)/);
    if (productMatch && /[\u4e00-\u9fa5]/.test(productMatch[1]) && productMatch[1].length > 2) {
      if (currentProduct) {
        // 保存上一个商品
        orders.push({
          id: `text_${Date.now()}_${orders.length}`,
          product_name: currentProduct,
          product_spec: currentSpec,
          quantity: currentQuantity,
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          receiver_address: receiverAddress,
        });
      }
      currentProduct = productMatch[1].trim();
      currentQuantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      currentSpec = '';
      
      // 提取规格
      const specMatch = trimmed.match(/规格[：:]*(.+?)(?:单价|数量|$)/i);
      if (specMatch) {
        currentSpec = specMatch[1].trim();
      }
    }
  }
  
  // 保存最后一个商品
  if (currentProduct) {
    orders.push({
      id: `text_${Date.now()}_${orders.length}`,
      product_name: currentProduct,
      product_spec: currentSpec,
      quantity: currentQuantity,
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      receiver_address: receiverAddress,
    });
  }
  
  // 如果没有找到商品，尝试整个文本作为商品
  if (orders.length === 0 && text.length > 0) {
    orders.push({
      id: `text_${Date.now()}_${orders.length}`,
      product_name: text.substring(0, 100),
      product_spec: '',
      quantity: 1,
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      receiver_address: receiverAddress,
    });
  }
  
  return orders;
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
