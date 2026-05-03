/**
 * WeCom Plugin - Customer Matcher
 * 群名 → 客户多级匹配（得分制）
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { CustomerMatchResult } from './types';

// 群名后缀列表（用于去除后缀后再匹配）
const GROUP_NAME_SUFFIXES = [
  '订单群',
  '对接群',
  '工作群',
  '业务群',
  '沟通群',
  '交流群',
  '合作群',
  '客户群',
  '专属群',
  'VIP群',
  '专属对接群',
];

/**
 * 清理群名：去除后缀
 */
function cleanGroupName(groupName: string): string {
  let cleaned = groupName.trim();

  for (const suffix of GROUP_NAME_SUFFIXES) {
    if (cleaned.endsWith(suffix)) {
      cleaned = cleaned.slice(0, -suffix.length).trim();
    }
    if (cleaned.startsWith(suffix)) {
      cleaned = cleaned.slice(suffix.length).trim();
    }
  }

  return cleaned;
}

/**
 * 匹配客户
 * @param groupId 群ID
 * @param groupName 群名称
 * @returns 匹配结果
 */
export async function matchCustomerForGroup(
  groupId: string,
  groupName: string
): Promise<CustomerMatchResult> {
  const client = getSupabaseClient();

  // 1. 先检查是否已有绑定映射
  const { data: existingMapping } = await client
    .from('wecom_group_mappings')
    .select('*, customers(id, code, name)')
    .eq('group_id', groupId)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingMapping && existingMapping.customer_id) {
    const customer = (existingMapping as Record<string, unknown>).customers as { id: string; code: string; name: string } | undefined;
    return {
      customerId: customer?.id || existingMapping.customer_id,
      mappingId: existingMapping.id,
      customerCode: customer?.code || null,
      customerName: customer?.name || null,
      score: existingMapping.match_score || 100,
      isUnmapped: false,
      matchSource: existingMapping.match_source as 'auto' | 'manual',
    };
  }

  // 2. 多级匹配
  const scores: Array<{ customerId: string; customerCode: string; customerName: string; score: number }> = [];

  // 原始群名和清理后的群名都尝试匹配
  const namesToTry = [groupName, cleanGroupName(groupName)].filter((n, i, arr) => n && arr.indexOf(n) === i);

  for (const nameToMatch of namesToTry) {
    // 精确匹配 customers.name
    const { data: byName } = await client
      .from('customers')
      .select('id, code, name')
      .eq('name', nameToMatch)
      .eq('is_active', true)
      .maybeSingle();

    if (byName) {
      scores.push({
        customerId: byName.id,
        customerCode: byName.code,
        customerName: byName.name,
        score: 100,
      });
    }

    // 精确匹配 customers.code
    if (nameToMatch !== groupName) {
      const { data: byCode } = await client
        .from('customers')
        .select('id, code, name')
        .eq('code', nameToMatch)
        .eq('is_active', true)
        .maybeSingle();

      if (byCode) {
        scores.push({
          customerId: byCode.id,
          customerCode: byCode.code,
          customerName: byCode.name,
          score: 100,
        });
      }
    }

    // 包含匹配 customers.name ILIKE '%name%'
    const { data: byNameContains } = await client
      .from('customers')
      .select('id, code, name')
      .ilike('name', `%${nameToMatch}%`)
      .eq('is_active', true);

    for (const c of byNameContains || []) {
      scores.push({
        customerId: c.id,
        customerCode: c.code,
        customerName: c.name,
        score: 80,
      });
    }

    // 包含匹配 name ILIKE '%customers.name%'
    const { data: byNameReverse } = await client
      .from('customers')
      .select('id, code, name')
      .ilike('name', nameToMatch)
      .eq('is_active', true);

    for (const c of byNameReverse || []) {
      scores.push({
        customerId: c.id,
        customerCode: c.code,
        customerName: c.name,
        score: 70,
      });
    }
  }

  // 3. 选择得分最高的匹配
  if (scores.length === 0) {
    return {
      customerId: null,
      mappingId: null,
      customerCode: null,
      customerName: null,
      score: 0,
      isUnmapped: true,
      matchSource: null,
    };
  }

  // 去重，取最高分
  const bestMatch = scores.reduce((best, current) => {
    if (current.score > best.score) return current;
    if (current.score === best.score && current.customerId !== best.customerId) {
      // 同分时优先选精确匹配
      return current;
    }
    return best;
  });

  return {
    customerId: bestMatch.customerId,
    mappingId: null,
    customerCode: bestMatch.customerCode,
    customerName: bestMatch.customerName,
    score: bestMatch.score,
    isUnmapped: bestMatch.score < 80,
    matchSource: bestMatch.score >= 80 ? 'auto' : null,
  };
}

/**
 * 创建或更新群映射记录
 */
export async function upsertGroupMapping(
  appId: string,
  groupId: string,
  groupName: string,
  matchResult: CustomerMatchResult
): Promise<string> {
  const client = getSupabaseClient();

  const mappingData = {
    app_id: appId,
    group_id: groupId,
    group_name: groupName,
    customer_id: matchResult.customerId,
    match_source: matchResult.matchSource || 'auto',
    match_score: matchResult.score,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('wecom_group_mappings')
    .upsert(mappingData, {
      onConflict: 'app_id,group_id',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[WeComCustomerMatcher] Failed to upsert mapping:', error);
    throw error;
  }

  return data.id;
}

/**
 * 手动绑定群到客户
 */
export async function bindGroupToCustomer(
  groupId: string,
  customerId: string,
  appId: string
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('wecom_group_mappings')
    .update({
      customer_id: customerId,
      match_source: 'manual',
      match_score: 100,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)
    .eq('app_id', appId);

  if (error) {
    console.error('[WeComCustomerMatcher] Failed to bind group:', error);
    throw error;
  }
}

/**
 * 解绑群映射
 */
export async function unbindGroup(groupId: string, appId: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('wecom_group_mappings')
    .update({
      customer_id: null,
      match_score: 0,
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)
    .eq('app_id', appId);

  if (error) {
    console.error('[WeComCustomerMatcher] Failed to unbind group:', error);
    throw error;
  }
}
