import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { BusinessRule, ConditionGroup, Action } from './engine';

export async function createRule(
  tenantId: string,
  name: string,
  description: string,
  enabled: boolean,
  priority: number,
  triggerType: 'event' | 'schedule' | 'manual',
  conditions: ConditionGroup,
  actions: Action[]
): Promise<BusinessRule> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('business_rules')
    .insert({
      tenant_id: tenantId,
      name,
      description,
      enabled,
      priority,
      trigger_type: triggerType,
      conditions,
      actions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`创建规则失败: ${error.message}`);
  }

  return mapToBusinessRule(data);
}

export async function getRuleById(tenantId: string, ruleId: string): Promise<BusinessRule | null> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('business_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', ruleId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToBusinessRule(data);
}

export async function getRulesByTenant(tenantId: string): Promise<BusinessRule[]> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('business_rules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority', { ascending: true });

  if (error) {
    throw new Error(`查询规则失败: ${error.message}`);
  }

  return (data || []).map(mapToBusinessRule);
}

export async function updateRule(
  tenantId: string,
  ruleId: string,
  updates: Partial<{
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    triggerType: 'event' | 'schedule' | 'manual';
    conditions: ConditionGroup;
    actions: Action[];
  }>
): Promise<BusinessRule | null> {
  const client = getSupabaseClient();
  
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.triggerType !== undefined) updateData.trigger_type = updates.triggerType;
  if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
  if (updates.actions !== undefined) updateData.actions = updates.actions;

  const { data, error } = await client
    .from('business_rules')
    .update(updateData)
    .eq('tenant_id', tenantId)
    .eq('id', ruleId)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return mapToBusinessRule(data);
}

export async function deleteRule(tenantId: string, ruleId: string): Promise<boolean> {
  const client = getSupabaseClient();
  
  const { error } = await client
    .from('business_rules')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', ruleId);

  if (error) {
    throw new Error(`删除规则失败: ${error.message}`);
  }

  return true;
}

export async function toggleRuleStatus(tenantId: string, ruleId: string): Promise<boolean> {
  const rule = await getRuleById(tenantId, ruleId);
  if (!rule) return false;

  await updateRule(tenantId, ruleId, { enabled: !rule.enabled });
  return true;
}

function mapToBusinessRule(data: Record<string, unknown>): BusinessRule {
  return {
    id: String(data.id),
    name: String(data.name),
    description: String(data.description || ''),
    enabled: Boolean(data.enabled),
    priority: Number(data.priority) || 100,
    triggerType: data.trigger_type as 'event' | 'schedule' | 'manual',
    conditions: data.conditions as ConditionGroup,
    actions: data.actions as Action[],
    createdAt: new Date(String(data.created_at)),
    updatedAt: new Date(String(data.updated_at)),
  };
}