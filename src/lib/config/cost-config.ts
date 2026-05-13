/** 成本分摊配置 */
export interface CostConfig {
  /** 分摊方式：by_amount=按金额占比, by_quantity=按数量均摊, by_weight=按重量均摊 */
  allocationMethod: 'by_amount' | 'by_quantity' | 'by_weight';
  /** 运费分摊 */
  allocateFreight: boolean;
  /** 杂费分摊 */
  allocateMiscFees: boolean;
}

export const COST_CONFIG_DEFAULTS: CostConfig = {
  allocationMethod: 'by_amount',
  allocateFreight: true,
  allocateMiscFees: true,
};
