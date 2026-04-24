// 订单状态枚举
export type OrderStatus =
  | 'pending'       // 待派发
  | 'assigned'      // 已派发
  | 'partial_returned'  // 部分回单
  | 'returned'      // 已回单
  | 'feedbacked'    // 已反馈客户
  | 'completed'     // 已完成/已归档
  | 'cancelled';   // 已取消

// 订单来源
export type OrderSource = 'wechat' | 'excel' | 'form' | 'jushuitan' | 'ai_parse';

// 快递公司
export type ExpressCompany =
  | '顺丰速运' | '中通快递' | '圆通速递' | '韵达快递'
  | '申通快递' | '极兔速递' | '京东物流' | '德邦快递'
  | 'EMS' | '邮政包裹' | '菜鸟裹裹' | '其他';

// 匹配类型
export type MatchType = 'spec' | 'name' | 'mapping' | 'none' | 'product_id' | 'code';

// 订单商品（包含客户原始信息和系统匹配信息）
export interface OrderItem {
  // 系统商品档案信息（匹配成功后填充）
  productId?: string | null;
  productName: string;
  productSpec?: string;
  productCode?: string;
  productBrand?: string;
  unitPrice?: number | null;

  // 客户原始商品信息（始终保留）
  cuProductName?: string;
  cuProductCode?: string;
  cuProductSpec?: string;

  // 订单商品信息
  quantity: number;
  price?: number;
  amount?: number;
  discount?: number;
  taxRate?: number;
  remark?: string;

  // 匹配信息
  matchType?: string;
  matchHint?: string;
}

// 订单收货信息
export interface ReceiverInfo {
  name: string;
  phone: string;
  address: string;
  province?: string;
  city?: string;
  district?: string;
}

// 订单主体 — 与 API transformOrder 输出完全对齐
export interface Order {
  id: string;
  sysOrderNo?: string;
  orderNo: string;
  supplierOrderNo?: string;
  status: OrderStatus;
  items: OrderItem[];
  receiver: ReceiverInfo;

  // 关联档案ID
  customerId?: string;
  customerCode: string;
  customerName: string;
  salespersonId?: string;
  salesperson?: string;
  salespersonName?: string;
  operatorId?: string;
  operatorName?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  warehouse?: string;

  // 财务字段
  amount?: number;
  discount?: number;
  taxRate?: number;
  incomeName?: string;
  incomeAmount?: number;
  invoiceRequired?: boolean;

  // 快递信息
  expressCompany?: string;
  trackingNo?: string;
  expressRequirement?: string;

  // 元数据
  source: OrderSource;
  importBatch?: string;
  assignedBatch?: string;
  matchCode?: string;

  // 单据信息
  billNo?: string;
  billDate?: string;

  // 备用字段
  extFields?: Record<string, string | null>;

  // 时间戳
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  completedAt?: string;
  returnedAt?: string;

  // 其他
  remark?: string;
}

// 供应商 — 对齐 suppliers 表 + API transformSupplier
export interface Supplier {
  id: string;
  code?: string;
  name: string;
  shortName?: string;
  type: string;
  contactPerson?: string;
  contactPhone?: string;
  sendType: string;
  province?: string;
  city?: string;
  canJd?: boolean;
  expressRestrictions?: string[];
  costFactor?: number;
  settlementType?: string;
  isActive?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 发货方 — 对齐 shippers 表 + API transformShipper
export interface Shipper {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  type: string;
  contactPerson?: string;
  contactPhone?: string;
  province?: string;
  city?: string;
  address?: string;
  sendType: string;
  jdChannelId?: string;
  pddShopId?: string;
  canJd?: boolean;
  canPdd?: boolean;
  expressRestrictions?: string[];
  settlementType?: string;
  costFactor?: number;
  isActive?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 客户 — 对齐 customers 表 + API transformCustomer
export interface Customer {
  id: string;
  code: string;
  name: string;
  type?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  region?: string;
  salesUserId?: string;
  salesUserName?: string;
  operatorUserId?: string;
  operatorUserName?: string;
  creditLimit?: number;
  paymentDays?: number;
  paymentStatus?: string;
  settlementCycle?: string;
  isActive?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 商品 — 对齐 products 表 + API transformProduct
export interface Product {
  id: string;
  sku?: string;
  code?: string;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  spec?: string;
  unit?: string;
  size?: string;
  weight?: number;
  costPrice?: number;
  retailPrice?: number;
  lifecycleStatus?: string;
  isActive?: boolean;
  // 尺寸和重量字段（用于运费计算）
  length?: number;
  width?: number;
  height?: number;
  volume?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  volumeFactor?: number;
  volumeWeight?: number;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 仓库 — 对齐 warehouses 表 + API transformWarehouse
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  type: string;
  contactPerson?: string;
  contactPhone?: string;
  address?: string;
  province?: string;
  city?: string;
  isActive?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 供应商库存 — 对齐 stocks 表 + API enhanceStock
export interface SupplierStock {
  id: string;
  productId: string;
  productCode?: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  warehouseId?: string;
  warehouseName?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  minStock?: number;
  maxStock?: number;
  status?: string;
  isLowStock?: boolean;
  stockLevel?: 'out' | 'low' | 'normal';
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 发货记录 — 对齐 dispatch_records 表
export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNo?: string;
  supplierId: string;
  supplierName: string;
  warehouseId?: string;
  batchNo: string;
  dispatchAt?: string;
  status: string;
  expressCompany?: string;
  trackingNo?: string;
  items: Array<{
    productCode?: string;
    productName?: string;
    quantity: number;
    unitCost?: number;
    warehouseName?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// 回单记录 — 对齐 return_records 表
export interface ReturnRecord {
  id: string;
  orderId?: string;
  orderNo?: string;
  expressCompany: string;
  trackingNo: string;
  returnedAt?: string;
  receivedAt?: string;
  matchedBy?: string;
  matchConfidence?: number;
  supplierId?: string;
  supplierName?: string;
  operator?: string;
  status: string;
  remark?: string;
  createdAt?: string;
}

// SKU映射 — 对齐 product_mappings 表（实际运行时的列）
export interface ProductMapping {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  customerSku?: string;
  customerBarcode?: string;
  customerProductName: string;
  price?: number;
  isActive?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 预警规则 — 对齐 alert_rules 表
export interface AlertRule {
  id: string;
  name: string;
  code: string;
  type: string;
  config?: Record<string, unknown>;
  priority?: number;
  isEnabled?: boolean;
  notificationChannels?: string[];
  description?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 预警记录 — 对齐 alert_records 表
export interface AlertRecord {
  id: string;
  ruleId?: string;
  ruleCode?: string;
  ruleName?: string;
  orderId?: string;
  orderNo?: string;
  stockId?: string;
  alertType: string;
  alertLevel: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  isRead?: boolean;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  customerCode?: string;
  productCode?: string;
  supplierId?: string;
  supplierName?: string;
  createdAt?: string;
}

// 历史成本记录 — 对齐 order_cost_history 表
export interface OrderCostRecord {
  id: string;
  orderId: string;
  orderNo?: string;
  matchCode?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  warehouseName?: string;
  productCode?: string;
  productName?: string;
  quantity?: number;
  unitCost?: number;
  totalCost?: number;
  expressFee?: number;
  otherFee?: number;
  totalAmount?: number;
  expressCompany?: string;
  trackingNo?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  customerCode?: string;
  customerName?: string;
  salesperson?: string;
  operatorName?: string;
  orderDate?: string;
  shippedDate?: string;
  returnedDate?: string;
  dispatchBatch?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 库存版本记录 — 对齐 stock_versions 表
export interface StockVersion {
  id: string;
  stockId?: string;
  productCode?: string;
  productName?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  warehouseName?: string;
  beforeQuantity?: number;
  afterQuantity?: number;
  changeQuantity?: number;
  beforePrice?: number;
  afterPrice?: number;
  changePrice?: number;
  changeType: string;
  changeReason?: string;
  operator?: string;
  createdAt?: string;
}

// 价格历史记录 — 对齐 price_history 表
export interface PriceHistoryRecord {
  id: string;
  productCode?: string;
  productName?: string;
  supplierId?: string;
  supplierName?: string;
  beforePrice?: number;
  afterPrice?: number;
  changePrice?: number;
  changeType: string;
  changeReason?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  operator?: string;
  createdAt?: string;
}

// 用户 — 对齐 users 表
export interface User {
  id: string;
  username: string;
  realName?: string;
  role?: string;
  department?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  remark?: string;
  dataScope?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 角色 — 对齐 roles 表
export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  dataScope?: string;
  isSystem?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 模板 — 对齐 templates 表
export interface Template {
  id: string;
  code?: string;
  name: string;
  description?: string;
  type: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  fieldMappings?: Record<string, string>;
  config?: Record<string, unknown>;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
