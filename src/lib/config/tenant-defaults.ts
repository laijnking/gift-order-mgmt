import { MATCH_CONFIG, type MatchWeights } from './match-config';

export interface TenantConfig {
  name: string;
  shortCode: string;
  financialSystem: string;
  statusLabels: Record<string, string>;
  actionLabels: Record<string, string>;
  exportPrefixes: Record<string, string>;
  matchWeights: MatchWeights;
}

export const TENANT_DEFAULTS: TenantConfig = {
  name: '',
  shortCode: '',
  financialSystem: '财务管理',
  statusLabels: {
    pending: '待派发',
    assigned: '已派发',
    notified: '通知发货',
    partial_returned: '部分回单',
    returned: '已回单',
    feedbacked: '已反馈',
    completed: '已完成',
    cancelled: '已取消',
  },
  actionLabels: {
    complete: '完成',
    exportKingdee: '导出',
    completeAction: '已完成',
    shipping: '发货通知单',
    exportShipping: '导出发货通知单',
  },
  exportPrefixes: {
    kingdee: '导出',
    shipping: '发货通知单',
  },
  matchWeights: {
    sameProvince: MATCH_CONFIG.weights.sameProvince,
    adjacentProvince: MATCH_CONFIG.weights.adjacentProvince,
    distantProvince: MATCH_CONFIG.weights.distantProvince,
    unknownProvince: MATCH_CONFIG.weights.unknownProvince,
    stockBonus: MATCH_CONFIG.weights.stockBonus,
    priceScoreMax: MATCH_CONFIG.weights.priceScoreMax,
    selfBonus: MATCH_CONFIG.weights.selfBonus,
  },
};
