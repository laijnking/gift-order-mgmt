/**
 * Shared column auto-detection patterns for Excel order parsing.
 * Used by both the frontend (page.tsx) and the backend (api/order-parse/excel/route.ts).
 */

// Column options for UI dropdown
export const COLUMN_OPTIONS = [
  { value: 'bill_date', label: '单据日期', group: '基础信息' },
  { value: 'customer_order_no', label: '客户单据编号', group: '基础信息' },
  { value: 'supplier_order_no', label: '供应商单据号', group: '基础信息' },
  { value: 'customer_code', label: '客户代码', group: '基础信息' },
  { value: 'customer_name', label: '客户名称', group: '基础信息' },
  { value: 'supplier_name', label: '发货供应商', group: '基础信息' },
  { value: 'salesperson', label: '业务员', group: '人员信息' },
  { value: 'operator', label: '跟单员', group: '人员信息' },
  { value: 'customer_product_name', label: '客户商品名称', group: '商品信息' },
  { value: 'customer_product_code', label: '客户商品编码', group: '商品信息' },
  { value: 'customer_product_spec', label: '客户商品型号', group: '商品信息' },
  { value: 'quantity', label: '数量', group: '商品信息' },
  { value: 'price', label: '单价', group: '商品信息' },
  { value: 'amount', label: '价税合计', group: '商品信息' },
  { value: 'discount', label: '单台折让', group: '商品信息' },
  { value: 'tax_rate', label: '增值税税率', group: '商品信息' },
  { value: 'warehouse', label: '仓库', group: '商品信息' },
  { value: 'remark', label: '备注', group: '商品信息' },
  { value: 'receiver_name', label: '收货人', group: '收货信息' },
  { value: 'receiver_phone', label: '收货电话', group: '收货信息' },
  { value: 'receiver_address', label: '收货地址', group: '收货信息' },
  { value: 'express_company', label: '快递公司', group: '快递信息' },
  { value: 'tracking_no', label: '物流单号', group: '快递信息' },
  { value: 'invoice_required', label: '需要开票', group: '发票信息' },
  { value: 'income_name', label: '收入名称', group: '发票信息' },
  { value: 'income_amount', label: '应收金额', group: '发票信息' },
  ...Array.from({ length: 20 }, (_, i) => ({
    value: `ext_field_${i + 1}`,
    label: `备用字段${i + 1}`,
    group: '扩展字段',
  })),
];

export const GROUPED_OPTIONS = COLUMN_OPTIONS.reduce((acc, opt) => {
  const group = opt.group || '其他';
  if (!acc[group]) acc[group] = [];
  acc[group].push(opt);
  return acc;
}, {} as Record<string, typeof COLUMN_OPTIONS>);

export const COMMON_FIELDS = [
  'customer_order_no',
  'customer_product_name',
  'customer_product_spec',
  'customer_product_code',
  'quantity',
  'price',
  'receiver_name',
  'receiver_phone',
  'receiver_address',
  'express_company',
  'tracking_no',
];

// Patterns for auto-detection
const PATTERNS: Record<string, Array<{ regex: RegExp; exact?: boolean; priority: number }>> = {
  bill_date: [
    { regex: /^单据日期$/, exact: true, priority: 10 },
    { regex: /^订单日期$/, exact: true, priority: 9 },
    { regex: /^订单创建日期$/, exact: true, priority: 9 },
    { regex: /^创建日期$/, exact: true, priority: 8 },
    { regex: /^下单时间$/, exact: true, priority: 8 },
  ],
  order_no: [
    { regex: /^客户订单号$/, exact: true, priority: 10 },
    { regex: /^商户订单号$/, exact: true, priority: 10 },
    { regex: /^来源订单$/, exact: true, priority: 10 },
    { regex: /^订单编号$/, exact: true, priority: 9 },
    { regex: /^订单号$/, exact: true, priority: 9 },
  ],
  customer_order_no: [
    { regex: /^客户单据编号$/, exact: true, priority: 10 },
    { regex: /^序号$/, exact: true, priority: 10 },
    { regex: /^客户订单号$/, exact: true, priority: 9 },
    { regex: /^订单号$/, exact: true, priority: 8 },
  ],
  supplier_order_no: [
    { regex: /^供应商单据号$/, exact: true, priority: 10 },
    { regex: /^供应商订单号$/, exact: true, priority: 9 },
  ],
  customer_code: [
    { regex: /^客户代码$/, exact: true, priority: 10 },
    { regex: /^客户编码$/, exact: true, priority: 9 },
  ],
  customer_name: [
    { regex: /^客户名称$/, exact: true, priority: 10 },
    { regex: /^客户姓名$/, exact: true, priority: 9 },
  ],
  salesperson: [
    { regex: /^业务员$/, exact: true, priority: 10 },
    { regex: /^销售员$/, exact: true, priority: 8 },
  ],
  operator: [
    { regex: /^跟单员$/, exact: true, priority: 10 },
  ],
  customer_product_name: [
    { regex: /^商品$/, exact: true, priority: 10 },
    { regex: /^商品名称$/, exact: true, priority: 10 },
    { regex: /^商品名$/, exact: true, priority: 10 },
    { regex: /^货品名称$/, exact: true, priority: 9 },
    { regex: /^品名$/, exact: true, priority: 9 },
    { regex: /^客户商品名称$/, exact: true, priority: 10 },
    { regex: /^客户商品名$/, exact: true, priority: 10 },
    { regex: /^客户货品名称$/, exact: true, priority: 9 },
  ],
  customer_product_code: [
    { regex: /^商品编码$/, exact: true, priority: 10 },
    { regex: /^商品代码$/, exact: true, priority: 9 },
    { regex: /^货号$/, exact: true, priority: 8 },
    { regex: /^客户商品编码$/, exact: true, priority: 10 },
    { regex: /^客户商品代码$/, exact: true, priority: 9 },
    { regex: /^客户货号$/, exact: true, priority: 8 },
  ],
  customer_product_spec: [
    { regex: /^商品规格$/, exact: true, priority: 10 },
    { regex: /^规格型号$/, exact: true, priority: 10 },
    { regex: /^型号规格$/, exact: true, priority: 9 },
    { regex: /^规格$/, exact: true, priority: 7 },
    { regex: /^型号$/, exact: true, priority: 7 },
    { regex: /^商品型号$/, exact: true, priority: 10 },
    { regex: /^客户商品规格$/, exact: true, priority: 10 },
    { regex: /^客户规格型号$/, exact: true, priority: 10 },
    { regex: /^客户型号规格$/, exact: true, priority: 9 },
  ],
  quantity: [
    { regex: /^商品数量$/, exact: true, priority: 10 },
    { regex: /^下单数量$/, exact: true, priority: 10 },
    { regex: /^数量$/, exact: true, priority: 9 },
    { regex: /^件数$/, exact: true, priority: 9 },
    { regex: /^台数$/, exact: true, priority: 9 },
  ],
  price: [
    { regex: /^单价$/, exact: true, priority: 10 },
    { regex: /^售价$/, exact: true, priority: 9 },
  ],
  amount: [
    { regex: /^价税合计$/, exact: true, priority: 10 },
    { regex: /^含税金额$/, exact: true, priority: 9 },
    { regex: /^金额$/, priority: 4 },
  ],
  discount: [
    { regex: /^单台折让$/, exact: true, priority: 10 },
    { regex: /^每台折让$/, exact: true, priority: 9 },
  ],
  tax_rate: [
    { regex: /^增值税税率$/, exact: true, priority: 10 },
  ],
  warehouse: [
    { regex: /^仓库$/, exact: true, priority: 10 },
    { regex: /^仓库名称$/, exact: true, priority: 9 },
  ],
  remark: [
    { regex: /^备注$/, exact: true, priority: 10 },
    { regex: /^商品行备注$/, exact: true, priority: 9 },
  ],
  receiver_name: [
    { regex: /^收件人姓名$/, exact: true, priority: 10 },
    { regex: /^收货人姓名$/, exact: true, priority: 10 },
    { regex: /^收货人$/, exact: true, priority: 9 },
    { regex: /^收件人$/, exact: true, priority: 9 },
    { regex: /^会员昵称$/, exact: true, priority: 8 },
  ],
  receiver_phone: [
    { regex: /^电话$/, exact: true, priority: 10 },
    { regex: /^收件人手机$/, exact: true, priority: 10 },
    { regex: /^收货人手机号$/, exact: true, priority: 10 },
    { regex: /^收货人电话$/, exact: true, priority: 9 },
    { regex: /^收件人电话$/, exact: true, priority: 9 },
    { regex: /^收货电话$/, exact: true, priority: 8 },
    { regex: /^收件电话$/, exact: true, priority: 8 },
    { regex: /^手机号码$/, priority: 5 },
    { regex: /^联系电话$/, priority: 4 },
  ],
  receiver_address: [
    { regex: /^收件人地址$/, exact: true, priority: 10 },
    { regex: /^收货详细地址$/, exact: true, priority: 10 },
    { regex: /^收货人地址$/, exact: true, priority: 9 },
    { regex: /^收货地址$/, exact: true, priority: 9 },
    { regex: /^收件地址$/, exact: true, priority: 8 },
    { regex: /^详细地址$/, exact: true, priority: 7 },
  ],
  express_company: [
    { regex: /^物流公司$/, exact: true, priority: 10 },
    { regex: /^快递公司$/, exact: true, priority: 10 },
    { regex: /^承运商$/, exact: true, priority: 8 },
  ],
  tracking_no: [
    { regex: /^物流单号$/, exact: true, priority: 10 },
    { regex: /^快递单号$/, exact: true, priority: 10 },
    { regex: /^运单号$/, exact: true, priority: 9 },
    { regex: /^快递号$/, exact: true, priority: 8 },
  ],
  invoice_required: [
    { regex: /^需要开票$/, exact: true, priority: 10 },
  ],
  income_name: [
    { regex: /^收入名称$/, exact: true, priority: 10 },
  ],
  income_amount: [
    { regex: /^应收金额$/, exact: true, priority: 10 },
    { regex: /^收入金额$/, exact: true, priority: 8 },
  ],
};

const IGNORE_PATTERNS = [
  /^#$/,
  /^NO\.?$/i,
  /^index$/i,
  /^id$/i,
  /^idx$/i,
  /^no$/i,
  /^选择$/,
  /^操作$/,
  /^勾选$/,
  /^checkbox$/i,
];

/**
 * Auto-detect column mapping from Excel headers.
 * Returns a mapping from column index string to field name.
 */
export function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedFields = new Set<string>();

  headers.forEach((header, idx) => {
    const key = String(idx);
    const h = header.trim();

    if (IGNORE_PATTERNS.some((p) => p.test(h))) {
      mapping[key] = 'ignore';
      return;
    }

    let bestMatch: { field: string; priority: number } | null = null;

    for (const [field, regexList] of Object.entries(PATTERNS)) {
      for (const { regex, exact, priority } of regexList) {
        if (regex.test(h)) {
          const effectivePriority = exact ? priority : priority * 0.5;
          if (!bestMatch || effectivePriority > bestMatch.priority) {
            bestMatch = { field, priority: effectivePriority };
          }
        }
      }
    }

    if (bestMatch && !usedFields.has(bestMatch.field)) {
      mapping[key] = bestMatch.field;
      usedFields.add(bestMatch.field);
    }
  });

  // Auto-assign unmatched columns to ext_fields
  headers.forEach((_header, idx) => {
    const key = String(idx);
    if (!mapping[key]) {
      for (let i = 1; i <= 20; i++) {
        const extKey = `ext_field_${i}`;
        if (!usedFields.has(extKey)) {
          usedFields.add(extKey);
          mapping[key] = extKey;
          break;
        }
      }
    }
  });

  return mapping;
}

/**
 * Get the field value from a row using column mapping.
 */
export function getFieldValue(
  row: (string | number | null)[],
  columnMapping: Record<string, string>,
  field: string
): string {
  for (const [colIdx, mappedField] of Object.entries(columnMapping)) {
    if (mappedField === field) {
      const value = row[parseInt(colIdx)];
      return value === null || value === undefined ? '' : String(value).trim();
    }
  }
  return '';
}

/**
 * Extract province/city/district from a Chinese address string.
 */
export function extractAddressParts(address: string): {
  province: string;
  city: string;
  district: string;
} {
  const result = { province: '', city: '', district: '' };
  if (!address) return result;

  const match = address.match(/^([^省市区]+省)?([^省市区]+市)?([^省市区]+区)?/);
  if (match) {
    result.province = match[1]?.replace('省', '') || '';
    result.city = match[2]?.replace('市', '') || '';
    result.district = match[3]?.replace('区', '') || '';
  }

  return result;
}

/**
 * Normalize headers for comparison (trim + filter empty).
 */
export function normalizeHeadersForCompare(headers: string[]): string[] {
  return headers.map((h) => String(h || '').trim()).filter(Boolean);
}

/**
 * Compute a fingerprint from headers for history matching.
 */
export function computeHeaderFingerprint(headers: string[]): string {
  return normalizeHeadersForCompare(headers).join('|');
}
