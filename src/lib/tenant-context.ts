import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export interface TenantContext {
  tenantId: string;
  tenantCode?: string;
}

/**
 * 从请求头中提取租户上下文（x-tenant-id / x-tenant-code）
 */
export async function getTenantFromRequest(request: NextRequest): Promise<TenantContext> {
  const tenantId = request.headers.get('x-tenant-id') || '';
  const tenantCode = request.headers.get('x-tenant-code') || undefined;

  return { tenantId, tenantCode };
}

/**
 * 验证指定资源是否属于当前租户
 */
export async function verifyTenantOwnership(
  client: ReturnType<typeof getSupabaseClient>,
  table: string,
  resourceId: string,
  tenantId: string,
): Promise<boolean> {
  if (!tenantId || !resourceId) return false;

  const { data, error } = await client
    .from(table)
    .select('tenant_id')
    .eq('id', resourceId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  return !error && data !== null;
}
