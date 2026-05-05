/**
 * 回单导出共享模块
 *
 * 从 src/app/api/export-feedback/batch/route.ts 提取，
 * 供 API route 和 WeCom Worker 共用。
 */

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

export function buildFeedbackRows(
  orders: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
  feedbackExportHeaders?: Record<string, string>
): Record<string, unknown>[] {
  const normalizedMappings = Object.keys(fieldMappings).length > 0
    ? fieldMappings
    : DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS;

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
        const allHeaders = [...Object.keys(feedbackExportHeaders), ...logisticsHeaders];

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
