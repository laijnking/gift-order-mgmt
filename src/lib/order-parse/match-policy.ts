/**
 * SSOT - 商品匹配策略配置
 * 
 * 本文件是商品匹配逻辑的唯一事实来源，所有匹配逻辑必须引用此配置。
 * 
 * 更新历史：
 * - v1.0 (2026-05-01): 初始版本，整合 excel/route.ts 的匹配规则
 */

/**
 * 商品匹配优先级（SSOT）
 * 优先级从高到低：编码 > 条码 > 规格 > 名称
 *
 * 注意：MATCH_PRIORITY 声明了优先级顺序，PRODUCT_MATCH_SCORES 和 excel/route.ts 的
 * if/else 链必须与此顺序保持一致，否则会出现声明与实现不符的 bug。
 */
export const MATCH_PRIORITY = ['code', 'barcode', 'spec', 'name'] as const;
export type MatchPriorityType = typeof MATCH_PRIORITY[number];

/**
 * SKU映射匹配时的字段映射
 */
export const SKU_MAPPING_FIELDS: Record<MatchPriorityType, string> = {
  code: 'customer_sku',
  barcode: 'customer_barcode',
  spec: 'customer_product_spec',
  name: 'customer_product_name',
};

/**
 * 商品档案匹配时的评分权重
 */
export const PRODUCT_MATCH_SCORES = {
  CODE_EXACT: 100,
  BARCODE_EXACT: 95,
  SPEC_EXACT: 90,
  NAME_EXACT: 85,
  NAME_CONTAINS: 75,
  SPEC_CONTAINS: 65,
  CODE_CONTAINS: 60,
  KEYWORD: 40,
  MIN_THRESHOLD: 40,
} as const;

/**
 * SKU映射匹配优先级（用于 excel/route.ts）
 */
export const SKU_MATCH_ORDER: Array<{ type: MatchPriorityType; field: string }> = [
  { type: 'code', field: 'customer_sku' },
  { type: 'barcode', field: 'customer_barcode' },
  { type: 'spec', field: 'customer_product_spec' },
  { type: 'name', field: 'customer_product_name' },
];

/**
 * 获取匹配类型的显示名称
 */
export const MATCH_TYPE_LABELS: Record<string, string> = {
  mapping: 'SKU映射匹配',
  barcode: '条码匹配',
  code: '编码匹配',
  spec: '规格匹配',
  name: '名称匹配',
  keyword: '关键词匹配',
  fuzzy: '模糊匹配',
};

/**
 * 验证是否为有效的匹配类型
 */
export function isValidMatchType(type: string | null): type is MatchPriorityType {
  return MATCH_PRIORITY.includes(type as MatchPriorityType);
}
