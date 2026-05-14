export interface FieldMapping {
  systemField: string;
  excelColumn: string;
  width?: number;
}

export interface ExportConfig {
  kingdeeFieldMappings: FieldMapping[];
  shippingFieldMappings: FieldMapping[];
}

export const DEFAULT_KINGDEE_FIELD_MAPPINGS: FieldMapping[] = [
  { systemField: 'orderNo', excelColumn: '订单号' },
  { systemField: 'sysOrderNo', excelColumn: '系统单号' },
  { systemField: 'receiverName', excelColumn: '收货人' },
  { systemField: 'receiverPhone', excelColumn: '联系电话' },
  { systemField: 'receiverAddress', excelColumn: '收货地址' },
  { systemField: 'productName', excelColumn: '商品名称' },
  { systemField: 'productCode', excelColumn: '商品编码' },
  { systemField: 'productSpec', excelColumn: '规格型号' },
  { systemField: 'quantity', excelColumn: '数量' },
  { systemField: 'price', excelColumn: '单价' },
  { systemField: 'totalPrice', excelColumn: '金额' },
  { systemField: 'customerName', excelColumn: '客户名称' },
  { systemField: 'expressCompany', excelColumn: '快递公司' },
  { systemField: 'trackingNo', excelColumn: '快递单号' },
];

export const DEFAULT_SHIPPING_FIELD_MAPPINGS: FieldMapping[] = [
  { systemField: 'orderNo', excelColumn: '订单号' },
  { systemField: 'sysOrderNo', excelColumn: '系统单号' },
  { systemField: 'receiverName', excelColumn: '收货人' },
  { systemField: 'receiverPhone', excelColumn: '联系电话' },
  { systemField: 'receiverAddress', excelColumn: '收货地址' },
  { systemField: 'productName', excelColumn: '商品名称' },
  { systemField: 'productCode', excelColumn: '商品编码' },
  { systemField: 'productSpec', excelColumn: '规格型号' },
  { systemField: 'quantity', excelColumn: '数量' },
  { systemField: 'remark', excelColumn: '备注' },
];

export const EXPORT_CONFIG: ExportConfig = {
  kingdeeFieldMappings: DEFAULT_KINGDEE_FIELD_MAPPINGS,
  shippingFieldMappings: DEFAULT_SHIPPING_FIELD_MAPPINGS,
};

export function buildKingdeeFileName(today: string): string {
  return `订单导出_${today}.xlsx`;
}

export function buildShippingFileName(supplierName: string, today: string): string {
  const safe = supplierName.replace(/[/\\?%*:|"<>]/g, '-');
  return `${safe}+发货通知单+${today}.xlsx`;
}

export function buildBatchZipFileName(today: string): string {
  return `发货通知单_批量_${today}.zip`;
}
