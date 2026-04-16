// 订单状态枚举
export type OrderStatus = 
  | 'pending'      // 待派发
  | 'assigned'     // 已派发
  | 'partial_returned'  // 部分回单
  | 'returned'     // 已回单
  | 'completed'    // 已完成
  | 'cancelled';  // 已取消

// 订单来源
export type OrderSource = 'wechat' | 'excel' | 'form' | 'jushuitan';

// 快递公司
export type ExpressCompany = 
  | '顺丰速运' | '中通快递' | '圆通速递' | '韵达快递' 
  | '申通快递' | '极兔速递' | '京东物流' | '德邦快递'
  | 'EMS' | '邮政包裹' | '菜鸟裹裹' | '其他';

// 匹配类型
export type MatchType = 'spec' | 'name' | 'mapping' | 'none';

// 订单商品（包含客户原始信息和系统匹配信息）
export interface OrderItem {
  // 系统商品档案信息（匹配成功后填充）
  productId?: string | null;      // 系统商品ID
  productName: string;             // 系统商品名称
  productSpec?: string;            // 系统商品规格型号
  productCode?: string;            // 系统商品编码
  unitPrice?: number | null;       // 系统商品单价
  
  // 客户原始商品信息（始终保留）
  cuProductName?: string;          // 客户原始商品名称
  cuProductCode?: string;          // 客户原始商品编码
  cuProductSpec?: string;          // 客户原始规格型号
  
  // 订单商品信息
  quantity: number;                // 数量
  price?: number;                  // 客户订单单价（可能与系统单价不同）
  remark?: string;                 // 备注
  
  // 匹配信息
  matchType?: MatchType;           // 匹配方式
  matchHint?: string;              // 匹配说明
}

// 订单收货信息
export interface ReceiverInfo {
  name: string;         // 收货人
  phone: string;        // 收货电话
  address: string;      // 收货地址
  province?: string;    // 省份（用于运费计算）
  city?: string;        // 城市
  district?: string;    // 区/县
}

// 订单主体
export interface Order {
  id: string;           // 内部唯一ID
  sysOrderNo?: string;  // 系统订单号（自动生成，全局唯一）
  orderNo: string;      // 客户订单号（客户侧，可能重复）
  supplierOrderNo?: string; // 供应商侧单据号
  status: OrderStatus;  // 订单状态
  
  // 商品信息
  items: OrderItem[];
  
  // 收货信息
  receiver: ReceiverInfo;
  
  // 客户信息
  customerCode: string;  // 客户代码
  customerName: string;  // 客户名称
  salesperson: string;   // 业务员（旧字段，兼容）
  salespersonName?: string; // 业务员名称（来自客户档案）
  operatorName?: string;    // 跟单员名称（来自客户档案）
  
  // 快递信息
  expressCompany?: ExpressCompany;
  trackingNo?: string;
  
  // 供应商分配
  supplierId?: string;
  supplierName?: string;
  
  // 元数据
  source: OrderSource;
  importBatch?: string;  // 导入批次号
  assignedBatch?: string; // 派发批次号
  
  // 唯一匹配码
  matchCode?: string;    // MD5(客户代码 + 收件人 + 型号 + 数量) 前8位
  
  // 备用字段（客户订单的额外信息）
  extFields?: Record<string, string | null>;
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  assignedAt?: string;
  completedAt?: string;
  
  // 其他
  remark?: string;
  expressRequirement?: string; // 快递要求，如"不发极兔"
}

// 供应商
export interface Supplier {
  id: string;
  name: string;
  shortName: string;    // 简称
  type: 'warehouse' | 'supplier';  // 仓库或供应商
  contact?: string;     // 联系方式
  sendType: 'wechat' | 'system' | 'jushuitan' | 'download'; // 发货方式
  province?: string;    // 所在省份
  canJd: boolean;       // 能否发京东
  expressRestrictions?: string[]; // 快递限制
  costFactor?: number;  // 成本系数
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 客户
export interface Customer {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  contact?: string;
  phone?: string;
  address?: string;
  salesperson?: string;
  salespersonName?: string;
  operator?: string;
  operatorName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 商品
export interface Product {
  id: string;
  code: string;
  name: string;
  spec?: string;
  brand?: string;
  category?: string;
  unitPrice?: number;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

// SKU映射
export interface ProductMapping {
  id: string;
  customerCode?: string;
  customerProductName: string;
  systemProductId?: string;
  systemProductCode?: string;
  systemProductName?: string;  // 用于mock数据
  createdAt: string;
  updatedAt: string;
}

// 供应商库存
export interface SupplierStock {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  productCode: string;
  productSpec?: string;
  quantity: number;
  price: number;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

// 发货记录
export interface DispatchRecord {
  id: string;
  orderId: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  expressCompany?: string;
  trackingNo?: string;
  status: 'pending' | 'shipped' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

// 回单记录
export interface ReturnRecord {
  id: string;
  orderId: string;
  orderNo: string;
  expressCompany: string;
  trackingNo: string;
  receivedAt: string;
  note?: string;
  createdAt: string;
}
