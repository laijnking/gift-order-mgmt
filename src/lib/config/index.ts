import { TENANT_DEFAULTS, type TenantConfig } from './tenant-defaults';
export { TENANT_DEFAULTS, type TenantConfig };

export { MATCH_CONFIG, type MatchConfig, getProvinceScore, extractProvince, getProvinceMatchText } from './match-config';
export { IMPORT_CONFIG, type ImportConfig, resolveSupplierType, resolveSendType, resolveSettlementType, SUPPLIER_TYPE_OPTIONS, SEND_TYPE_OPTIONS, SETTLEMENT_TYPE_OPTIONS } from './import-config';
export { EXPORT_CONFIG, type ExportConfig, type FieldMapping, DEFAULT_KINGDEE_FIELD_MAPPINGS, DEFAULT_SHIPPING_FIELD_MAPPINGS, buildKingdeeFileName, buildShippingFileName, buildBatchZipFileName } from './export-config';

// 内存缓存（60 秒）
const configCache = new Map<string, { config: TenantConfig; timestamp: number }>();
const CACHE_TTL = 60 * 1000;

/**
 * 获取租户配置。
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

/**
 * 获取租户配置（同步版本，始终返回默认值）。
 * 用于服务端渲染和非 Hook 场景。
 */
export function getTenantConfig(_tenantId?: string): TenantConfig {
  return TENANT_DEFAULTS;
}

/** 清除配置缓存 */
export function clearTenantConfigCache(tenantId?: string): void {
  if (tenantId) configCache.delete(tenantId);
  else configCache.clear();
}
