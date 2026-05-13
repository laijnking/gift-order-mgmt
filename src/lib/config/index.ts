import { TENANT_DEFAULTS, type TenantConfig } from './tenant-defaults';
export { TENANT_DEFAULTS, type TenantConfig };

export { MATCH_CONFIG, type MatchConfig, getProvinceScore, extractProvince, getProvinceMatchText } from './match-config';
export { IMPORT_CONFIG, type ImportConfig, resolveSupplierType, resolveSendType, resolveSettlementType, SUPPLIER_TYPE_OPTIONS, SEND_TYPE_OPTIONS, SETTLEMENT_TYPE_OPTIONS } from './import-config';
export { EXPORT_CONFIG, type ExportConfig, type FieldMapping, DEFAULT_KINGDEE_FIELD_MAPPINGS, DEFAULT_SHIPPING_FIELD_MAPPINGS, buildKingdeeFileName, buildShippingFileName, buildBatchZipFileName } from './export-config';
export { COST_CONFIG_DEFAULTS, type CostConfig } from './cost-config';
export { RECEIPT_MATCH_DEFAULTS, type ReceiptMatchConfig } from './receipt-match-config';

/**
 * 获取租户配置（同步版本，始终返回默认值）。
 * 用于客户端组件和非 Hook 场景。
 * 服务端需从 DB 读取配置请使用 getTenantConfigAsync（从 './server' 导入）。
 */
export function getTenantConfig(_tenantId?: string): TenantConfig {
  return TENANT_DEFAULTS;
}
