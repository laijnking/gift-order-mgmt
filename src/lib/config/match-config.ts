/**
 * 发货方匹配配置
 *
 * 包含：省份邻近关系、评分权重、偏远地区定义。
 * 从 match/route.ts 硬编码提取为配置。
 */

export interface MatchConfig {
  /** 省份邻近关系 Map（收货省份 → 可邻近的发货省份列表） */
  adjacentProvinces: Record<string, string[]>;
  /** 评分权重 */
  weights: {
    /** 省份匹配得分（同省） */
    sameProvince: number;
    /** 省份匹配得分（邻近省） */
    adjacentProvince: number;
    /** 省份匹配得分（较远省） */
    distantProvince: number;
    /** 无省份信息得分 */
    unknownProvince: number;
  };
  /** 偏远地区关键词 */
  remoteRegions: string[];
  /** 直辖市列表（同省匹配） */
  directCities: string[];
  /** 所有省份列表（用于正则匹配） */
  allProvinces: string[];
}

export const MATCH_CONFIG: MatchConfig = {
  adjacentProvinces: {
    广东: ['广西', '海南', '湖南', '江西', '福建'],
    北京: ['天津', '河北'],
    上海: ['江苏', '浙江'],
    天津: ['北京', '河北'],
    重庆: ['四川', '贵州', '湖北', '陕西'],
    浙江: ['上海', '江苏', '安徽', '江西', '福建'],
    江苏: ['上海', '浙江', '安徽', '山东'],
    山东: ['江苏', '河北', '河南', '安徽'],
    河南: ['山东', '河北', '湖北', '安徽', '山西', '陕西'],
    河北: ['北京', '天津', '山东', '河南', '山西', '辽宁', '内蒙古'],
    湖北: ['河南', '湖南', '江西', '安徽', '重庆', '陕西'],
    湖南: ['湖北', '江西', '广东', '广西', '贵州', '重庆'],
    四川: ['重庆', '云南', '贵州', '陕西', '甘肃', '青海', '西藏'],
    福建: ['浙江', '江西', '广东'],
    江西: ['广东', '福建', '浙江', '安徽', '湖北', '湖南'],
    安徽: ['江苏', '山东', '河南', '湖北', '江西', '浙江'],
    陕西: ['山西', '河南', '湖北', '重庆', '四川', '甘肃', '宁夏', '内蒙古'],
    山西: ['河北', '河南', '陕西', '内蒙古'],
    辽宁: ['河北', '吉林', '内蒙古'],
    吉林: ['辽宁', '黑龙江', '内蒙古'],
    黑龙江: ['吉林', '内蒙古'],
    贵州: ['湖南', '重庆', '四川', '云南', '广西'],
    云南: ['四川', '贵州', '广西', '西藏'],
    广西: ['广东', '湖南', '贵州', '云南', '海南'],
    海南: ['广东', '广西'],
    甘肃: ['陕西', '四川', '青海', '宁夏', '新疆', '内蒙古'],
    青海: ['甘肃', '四川', '新疆', '西藏'],
    宁夏: ['陕西', '甘肃', '内蒙古'],
    新疆: ['甘肃', '青海', '西藏'],
    西藏: ['新疆', '青海', '四川', '云南'],
    内蒙古: ['黑龙江', '吉林', '辽宁', '河北', '山西', '陕西', '宁夏', '甘肃'],
    台湾: ['福建'],
    香港: ['广东'],
    澳门: ['广东'],
  },

  weights: {
    sameProvince: 100,
    adjacentProvince: 60,
    distantProvince: 20,
    unknownProvince: 30,
  },

  remoteRegions: ['新疆', '西藏'],

  directCities: ['北京', '天津', '上海', '重庆'],

  allProvinces: [
    '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建',
    '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州',
    '云南', '陕西', '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏',
    '新疆', '香港', '澳门',
  ],
};

/**
 * 根据收货省份计算发货省份得分
 */
export function getProvinceScore(
  supplierProvince: string | undefined,
  receiverProvince: string | null
): number {
  const { weights, adjacentProvinces, directCities } = MATCH_CONFIG;

  if (!receiverProvince) return weights.unknownProvince;
  if (!supplierProvince) return weights.distantProvince;

  // 检查直辖市
  for (const city of directCities) {
    if (receiverProvince.includes(city)) {
      if (supplierProvince.includes(city)) return weights.sameProvince;
      if (MATCH_CONFIG.adjacentProvinces[city]?.includes(supplierProvince)) {
        return weights.adjacentProvince;
      }
      return weights.distantProvince;
    }
  }

  // 同省匹配
  if (supplierProvince.includes(receiverProvince) || receiverProvince.includes(supplierProvince)) {
    return weights.sameProvince;
  }

  // 邻近省匹配
  if (adjacentProvinces[receiverProvince]?.includes(supplierProvince)) {
    return weights.adjacentProvince;
  }

  return weights.distantProvince;
}

/**
 * 提取地址中的省份
 */
export function extractProvince(address: string): string | null {
  if (!address) return null;

  const { directCities, allProvinces } = MATCH_CONFIG;

  // 先检查直辖市
  for (const city of directCities) {
    if (address.includes(city)) return city;
  }

  // 检查省份
  for (const province of allProvinces) {
    if (address.includes(province)) return province;
  }

  return null;
}

/**
 * 省份匹配文本描述
 */
export function getProvinceMatchText(
  supplierProvince: string | undefined,
  receiverProvince: string | null
): string {
  if (!receiverProvince) return '';
  if (!supplierProvince) return '省份未知';

  const score = getProvinceScore(supplierProvince, receiverProvince);
  if (score >= MATCH_CONFIG.weights.sameProvince) return '同省';
  if (score >= MATCH_CONFIG.weights.adjacentProvince) return '邻近';
  return '较远';
}
