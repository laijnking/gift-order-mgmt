export interface ImportConfig {
  supplierTypes: Record<string, string>;
  sendTypes: Record<string, string>;
  settlementTypes: Record<string, string>;
}

export const IMPORT_CONFIG: ImportConfig = {
  supplierTypes: { self: '自有仓', third_party: '第三方仓', platform: '平台' },
  sendTypes: { download: '下载发货', jd: '京东', pdd: '拼多多', self: '自有物流' },
  settlementTypes: { prepaid: '月结预付', monthly: '月结', per_order: '单结' },
};

export const SUPPLIER_TYPE_OPTIONS = [
  { value: 'self', label: '自有仓' },
  { value: 'third_party', label: '第三方仓' },
  { value: 'platform', label: '平台' },
];

export const SEND_TYPE_OPTIONS = [
  { value: 'download', label: '下载发货' },
  { value: 'jd', label: '京东' },
  { value: 'pdd', label: '拼多多' },
  { value: 'self', label: '自有物流' },
];

export const SETTLEMENT_TYPE_OPTIONS = [
  { value: 'prepaid', label: '月结预付' },
  { value: 'monthly', label: '月结' },
  { value: 'per_order', label: '单结' },
];

const TYPE_REVERSE_MAP: Record<string, Record<string, string>> = {
  supplierTypes: {},
  sendTypes: {},
  settlementTypes: {},
};
for (const key of Object.keys(IMPORT_CONFIG.supplierTypes)) {
  TYPE_REVERSE_MAP.supplierTypes[IMPORT_CONFIG.supplierTypes[key]] = key;
}
for (const key of Object.keys(IMPORT_CONFIG.sendTypes)) {
  TYPE_REVERSE_MAP.sendTypes[IMPORT_CONFIG.sendTypes[key]] = key;
}
for (const key of Object.keys(IMPORT_CONFIG.settlementTypes)) {
  TYPE_REVERSE_MAP.settlementTypes[IMPORT_CONFIG.settlementTypes[key]] = key;
}

export function resolveSupplierType(input: string): string {
  if (IMPORT_CONFIG.supplierTypes[input]) return input;
  return TYPE_REVERSE_MAP.supplierTypes[input] || 'third_party';
}

export function resolveSendType(input: string): string {
  if (IMPORT_CONFIG.sendTypes[input]) return input;
  return TYPE_REVERSE_MAP.sendTypes[input] || 'download';
}

export function resolveSettlementType(input: string): string {
  if (IMPORT_CONFIG.settlementTypes[input]) return input;
  return TYPE_REVERSE_MAP.settlementTypes[input] || 'monthly';
}
