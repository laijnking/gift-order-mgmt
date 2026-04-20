export interface SupplierMatchOption {
  supplierId: string;
  supplierName: string;
  stockQuantity: number;
  stockPrice: number;
  warehouseName: string;
  matchType: string;
}

export interface ParsedOrderDraftItem {
  id: string;
  customerProductName: string;
  customerProductSpec: string;
  customerProductCode: string;
  customerBarcode: string;
  systemProductId: string | null;
  systemProductName: string | null;
  systemProductSpec: string | null;
  systemProductCode: string | null;
  systemProductBrand: string | null;
  systemProductPrice: number | null;
  matchType: string | null;
  matchHint: string | null;
  supplierMatches: SupplierMatchOption[];
  quantity: number;
  price: number | null;
  remark: string;
}

export interface ParsedOrderDraft {
  id?: string;
  orderNo?: string;
  billNo?: string;
  billDate?: string;
  customerOrderNo?: string;
  supplierOrderNo?: string;
  customer_code?: string;
  customer_name?: string;
  product_name: string;
  product_code?: string;
  product_spec?: string;
  quantity: number;
  price?: number;
  amount?: number;
  discount?: number;
  taxRate?: number;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  express_company?: string;
  tracking_no?: string;
  warehouse?: string;
  remark?: string;
  invoice_required?: boolean;
  income_name?: string;
  income_amount?: number;
  salesperson?: string;
  salespersonId?: string;
  operator?: string;
  operatorId?: string;
  mappedProductCode?: string;
  mappedProductName?: string;
  mappedProductSpec?: string;
  mappedProductBrand?: string;
  systemProductId?: string;
  customerSku?: string;
  customerPrice?: number;
  supplierId?: string;
  supplierName?: string;
  supplierMatches?: SupplierMatchOption[];
  matchType?: string | null;
  matchHint?: string | null;
  extFields?: Record<string, string>;
}

export interface ParsedOrderBundleDraft {
  id: string;
  orderNo: string;
  billDate: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  province: string;
  city: string;
  district: string;
  items: ParsedOrderDraftItem[];
  expressCompany: string;
  trackingNo: string;
  remark: string;
}
