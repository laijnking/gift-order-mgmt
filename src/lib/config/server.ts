import 'server-only';
import { TENANT_DEFAULTS, type TenantConfig } from './tenant-defaults';

const configCache = new Map<string, { config: TenantConfig; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

/** 清除配置缓存 */
export function clearTenantConfigCache(tenantId?: string): void {
  if (tenantId) configCache.delete(tenantId);
  else configCache.clear();
}

/**
 * 获取租户配置（异步，服务端专用）。
 * 优先从 DB tenant_configs 表读取（带 60s 缓存），无配置时 fallback 到 TENANT_DEFAULTS。
 */
export async function getTenantConfigAsync(tenantId?: string): Promise<TenantConfig> {
  if (!tenantId) return TENANT_DEFAULTS;

  const now = Date.now();
  const cached = configCache.get(tenantId);
  if (cached && now - cached.timestamp < CACHE_TTL) return cached.config;

  try {
    const { getSupabaseClient } = await import('@/storage/database/supabase-client');
    const client = getSupabaseClient();
    const { data: configs, error } = await client
      .from('tenant_configs')
      .select('category, config_key, config_value')
      .eq('tenant_id', tenantId);

    if (error || !configs || configs.length === 0) {
      configCache.set(tenantId, { config: TENANT_DEFAULTS, timestamp: now });
      return TENANT_DEFAULTS;
    }

    const config: TenantConfig = {
      ...TENANT_DEFAULTS,
      statusLabels: { ...TENANT_DEFAULTS.statusLabels },
      actionLabels: { ...TENANT_DEFAULTS.actionLabels },
      exportPrefixes: { ...TENANT_DEFAULTS.exportPrefixes },
    };

    for (const item of configs) {
      const key = item.config_key as string;
      const value = item.config_value;
      if (item.category === 'basic') {
        if (key === 'name') config.name = value as string;
        else if (key === 'shortCode') config.shortCode = value as string;
        else if (key === 'financialSystem') config.financialSystem = value as string;
      } else if (item.category === 'statusLabels') {
        config.statusLabels[key] = value as string;
      } else if (item.category === 'actionLabels') {
        config.actionLabels[key] = value as string;
      } else if (item.category === 'exportPrefixes') {
        config.exportPrefixes[key] = value as string;
      }
    }

    configCache.set(tenantId, { config, timestamp: now });
    return config;
  } catch {
    return TENANT_DEFAULTS;
  }
}
