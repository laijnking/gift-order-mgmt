/** 回单匹配配置 */
export interface ReceiptMatchConfig {
  /** 匹配优先级（从高到低） */
  priority: ('tracking_no' | 'order_no_phone' | 'order_no_name' | 'phone_product')[];
  /** 是否启用跨租户全局匹配 */
  globalMatch: boolean;
  /** 冲突处理策略 */
  conflictStrategy: 'manual_review' | 'auto_latest' | 'auto_first';
}

export const RECEIPT_MATCH_DEFAULTS: ReceiptMatchConfig = {
  priority: ['tracking_no', 'order_no_phone', 'order_no_name', 'phone_product'],
  globalMatch: false,
  conflictStrategy: 'manual_review',
};
