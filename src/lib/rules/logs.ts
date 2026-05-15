import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface ExecutionLog {
  id: string;
  ruleId: string;
  tenantId: string;
  triggerType: string;
  matched: boolean;
  executionResult: Record<string, unknown>;
  executionTime: number;
  errorMessage?: string;
  createdAt: Date;
}

export async function createExecutionLog(
  ruleId: string,
  tenantId: string,
  triggerType: string,
  matched: boolean,
  executionResult: Record<string, unknown>,
  executionTime: number,
  errorMessage?: string
): Promise<void> {
  const client = getSupabaseClient();
  
  await client.from('rule_execution_logs').insert({
    rule_id: ruleId,
    tenant_id: tenantId,
    trigger_type: triggerType,
    matched,
    execution_result: executionResult,
    execution_time: executionTime,
    error_message: errorMessage,
    created_at: new Date().toISOString(),
  });
}

export async function getExecutionLogs(
  tenantId: string,
  ruleId?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ logs: ExecutionLog[]; total: number }> {
  const client = getSupabaseClient();
  
  let query = client
    .from('rule_execution_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (ruleId) {
    query = query.eq('rule_id', ruleId);
  }

  const { data, error, count } = await query
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    throw new Error(`查询执行日志失败: ${error.message}`);
  }

  const logs = (data || []).map(mapToExecutionLog);

  return {
    logs,
    total: count || 0,
  };
}

export async function getExecutionLogById(tenantId: string, logId: string): Promise<ExecutionLog | null> {
  const client = getSupabaseClient();
  
  const { data, error } = await client
    .from('rule_execution_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', logId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapToExecutionLog(data);
}

export async function deleteExecutionLogsByRule(tenantId: string, ruleId: string): Promise<void> {
  const client = getSupabaseClient();
  
  await client
    .from('rule_execution_logs')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('rule_id', ruleId);
}

function mapToExecutionLog(data: Record<string, unknown>): ExecutionLog {
  return {
    id: String(data.id),
    ruleId: String(data.rule_id),
    tenantId: String(data.tenant_id),
    triggerType: String(data.trigger_type || ''),
    matched: Boolean(data.matched),
    executionResult: data.execution_result as Record<string, unknown> || {},
    executionTime: Number(data.execution_time) || 0,
    errorMessage: data.error_message ? String(data.error_message) : undefined,
    createdAt: new Date(String(data.created_at)),
  };
}