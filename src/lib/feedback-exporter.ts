/**
 * 回单导出共享模块
 *
 * 从 src/app/api/export-feedback/batch/route.ts 提取，
 * 供 API route 和 WeCom Worker 共用。
 */

import * as XLSX from 'xlsx';

type OrderItem = Record<string, unknown>;

function parseItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value as OrderItem[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function itemText(item: OrderItem, ...keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

export function applyTextFormat(worksheet: XLSX.WorkSheet): void {
  if (!worksheet['!ref']) return;
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[addr];
      if (cell && cell.t === 's' && typeof cell.v === 'string' && /^\d{14,}$/.test(cell.v)) {
        cell.z = '@';
      }
    }
  }
}

export const DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS: Record<string, string> = {
  '客户订单号': 'orderNo',
  '单据编号': 'sysOrderNo',
  '收货人': 'receiverName',
  '收货电话': 'receiverPhone',
  '收货地址': 'receiverAddress',
  '商品名称': 'productName',
  '商品编码': 'productCode',
  '规格型号': 'productSpec',
  '数量': 'quantity',
  '单价': 'price',
  '价税合计': 'amount',
  '仓库': 'warehouse',
  '快递公司': 'expressCompany',
  '物流单号': 'trackingNo',
  '业务员': 'salesperson',
  '跟单员': 'operator',
  '备注': 'remark',
  '客户代码': 'customerCode',
  '客户名称': 'customerName',
  '发货方名称': 'supplierName',
  '发货方单据号': 'supplierOrderNo',
  '客户单据编号': 'customerOrderNo',
  '商品条码': 'barcode',
  '渠道备注': 'channelRemark',
  '建议发货方': 'suggestedShipper',
  '原订单状态': 'originalStatus',
};

export const SNAKE_TO_CAMEL: Record<string, string> = {
  'order_no': 'orderNo',
  'customer_order_no': 'customerOrderNo',
  'supplier_order_no': 'supplierOrderNo',
  'customer_code': 'customerCode',
  'customer_name': 'customerName',
  'supplier_name': 'supplierName',
  'product_name': 'productName',
  'product_code': 'productCode',
  'product_spec': 'productSpec',
  'customer_product_name': 'productName',
  'customer_product_code': 'productCode',
  'customer_product_spec': 'productSpec',
  'receiver_name': 'receiverName',
  'receiver_phone': 'receiverPhone',
  'receiver_address': 'receiverAddress',
  'express_company': 'expressCompany',
  'tracking_no': 'trackingNo',
  'salesperson': 'salesperson',
  'operator': 'operator',
  'remark': 'remark',
  'quantity': 'quantity',
  'price': 'price',
  'amount': 'amount',
  'warehouse': 'warehouse',
  'sys_order_no': 'sysOrderNo',
  'match_code': 'matchCode',
  'dispatch_batch': 'dispatchBatch',
  'unit_cost': 'unitCost',
  'warehouse_name': 'warehouseName',
};

export function buildFeedbackRows(
  orders: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
  feedbackExportHeaders?: Record<string, string>,
  columnOrder?: string[]
): Record<string, unknown>[] {
  const normalizedMappings = Object.keys(fieldMappings).length > 0
    ? fieldMappings
    : DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS;

  // 将 feedbackExportHeaders 的值从 snake_case 迁移到 camelCase
  // 以匹配 context 对象的 key（如 customer_product_name → productName）
  if (feedbackExportHeaders) {
    const migrated: Record<string, string> = {};
    for (const [k, v] of Object.entries(feedbackExportHeaders)) {
      migrated[k] = SNAKE_TO_CAMEL[String(v)] ?? String(v);
    }
    feedbackExportHeaders = migrated;
  }

  return orders.flatMap((order) => {
    const items = parseItems(order.items);
    const rowItems = items.length > 0
      ? items
      : [{ product_name: '', product_code: '', product_spec: '', quantity: 1, price: null }];

    return rowItems.map((item) => {
      const context: Record<string, unknown> = {
        sysOrderNo: order.sys_order_no || '',
        orderNo: order.order_no || '',
        customerOrderNo: order.customer_order_no || '',
        supplierOrderNo: order.supplier_order_no || '',
        customerCode: order.customer_code || '',
        customerName: order.customer_name || '',
        supplierName: order.supplier_name || '',
        salesperson: order.salesperson || '',
        operator: order.operator_name || '',
        productName: itemText(item, 'cu_product_name', 'cuProductName', 'product_name', 'productName'),
        productCode: itemText(item, 'cu_product_code', 'cuProductCode', 'product_code', 'productCode'),
        productSpec: itemText(item, 'cu_product_spec', 'cuProductSpec', 'product_spec', 'productSpec'),
        quantity: toNumber(item.quantity, 1),
        price: item.price ?? item.unit_price ?? '',
        amount: toNumber(item.quantity, 1) * toNumber(item.price ?? item.unit_price, 0),
        warehouse: itemText(item, 'warehouse', 'warehouseName'),
        remark: order.remark || itemText(item, 'remark'),
        channelRemark: order.channel_remark || '',
        suggestedShipper: order.suggested_shipper || '',
        originalStatus: order.original_status || '',
        barcode: itemText(item, 'cu_barcode', 'cuBarcode', 'barcode'),
        receiverName: order.receiver_name || '',
        receiverPhone: order.receiver_phone || '',
        receiverAddress: order.receiver_address || '',
        expressCompany: order.express_company || '',
        trackingNo: order.tracking_no || '',
      };

      if (feedbackExportHeaders && Object.keys(feedbackExportHeaders).length > 0) {
        const logisticsHeaders = ['快递公司', '运单号'];
        // 使用 columnOrder 保证导出列顺序与原始 Excel 导入顺序一致
        // JSONB 对象不保序，但 JSONB 数组保序
        const orderedHeaders = columnOrder && columnOrder.length > 0
          ? columnOrder.filter(h => h in feedbackExportHeaders)
          : Object.keys(feedbackExportHeaders);
        const allHeaders = [...orderedHeaders, ...logisticsHeaders];

        return Object.fromEntries(
          allHeaders.map((header) => {
            if (header === '快递公司') return [header, context.expressCompany ?? ''];
            if (header === '运单号') return [header, context.trackingNo ?? ''];
            const systemField = feedbackExportHeaders[header];
            return [header, systemField ? (context[systemField] ?? '') : ''];
          })
        );
      }

      return Object.fromEntries(
        Object.entries(normalizedMappings).map(([header, fieldKey]) => [header, context[fieldKey] ?? ''])
      );
    });
  });
}
