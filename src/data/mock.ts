import { Order, Supplier, SupplierStock, ProductMapping, DispatchRecord, ReturnRecord } from '@/types/order';

// 模拟数据存储（实际项目应使用数据库）
// 初始示例订单数据
export const mockOrders: Order[] = [
  {
    id: 'ORD-20260320-001',
    orderNo: '20260320223502253412999',
    status: 'pending',
    items: [
      {
        productName: '苏泊尔ZMD安心系列 升级搅菜杆双层四刃精钢刀锋绞肉机',
        productCode: 'JRD05-U',
        quantity: 1,
        remark: '规格:1.75L'
      }
    ],
    receiver: {
      name: '洪小燕',
      phone: '13636983408',
      address: '福建厦门市思明区嘉莲街道龙盛里7号楼401',
      province: '福建',
      city: '厦门',
      district: '思明区'
    },
    customerCode: 'C001',
    customerName: '某集团客户',
    salesperson: '张三',
    source: 'excel',
    importBatch: 'BATCH-20260320',
    createdAt: '2026-03-20T14:30:00Z',
    updatedAt: '2026-03-20T14:30:00Z'
  },
  {
    id: 'ORD-20260330-001',
    orderNo: 'XK2603300045',
    status: 'assigned',
    items: [
      {
        productName: '九阳电蒸锅',
        productCode: 'DZ100HG-GZ605',
        quantity: 1
      }
    ],
    receiver: {
      name: '徐小东',
      phone: '13599532355',
      address: '福建省厦门市湖里区吕岭路泰和花园187-1号202之1室',
      province: '福建',
      city: '厦门',
      district: '湖里区'
    },
    customerCode: 'C002',
    customerName: '厦门万翔',
    salesperson: '王锦彬',
    supplierId: 'SUP-001',
    supplierName: '首映礼省内仓',
    source: 'excel',
    importBatch: 'BATCH-20260330',
    assignedBatch: 'ASSIGN-20260330-001',
    assignedAt: '2026-03-30T16:00:00Z',
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T16:00:00Z'
  },
  {
    id: 'ORD-20260330-002',
    orderNo: 'GJ260330-001',
    status: 'partial_returned',
    items: [
      {
        productName: '苏泊尔果蔬清洗机',
        productCode: 'GS10',
        quantity: 2
      }
    ],
    receiver: {
      name: '郑泽琴',
      phone: '13929500473',
      address: '广东省广州市天河区车陂北街22号广氮新村4栋1楼106号',
      province: '广东',
      city: '广州',
      district: '天河区'
    },
    customerCode: 'C003',
    customerName: '广州峰汇',
    salesperson: '李俊伸',
    supplierId: 'SUP-007',
    supplierName: '成都拓普壹',
    source: 'excel',
    importBatch: 'BATCH-20260330',
    assignedBatch: 'ASSIGN-20260330-002',
    expressCompany: '圆通速递',
    trackingNo: 'YT7611882550408',
    assignedAt: '2026-03-30T17:00:00Z',
    createdAt: '2026-03-30T11:00:00Z',
    updatedAt: '2026-03-30T18:30:00Z',
    remark: '已沟通，今天先出单号，今天或者明天安排发货'
  }
];

// 供应商数据
export const mockSuppliers: Supplier[] = [
  {
    id: 'SUP-001',
    name: '首映礼省内仓',
    shortName: '首映礼',
    type: 'warehouse',
    sendType: 'wechat',
    province: '广东',
    canJd: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'SUP-002',
    name: '广东云海',
    shortName: '云海',
    type: 'warehouse',
    sendType: 'download',
    province: '广东',
    canJd: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'SUP-003',
    name: '成都拓普壹',
    shortName: '拓普壹',
    type: 'supplier',
    sendType: 'wechat',
    province: '四川',
    canJd: false,
    expressRestrictions: ['极兔速递'],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'SUP-004',
    name: '深圳苏泊尔正品仓',
    shortName: '苏泊尔正品仓',
    type: 'warehouse',
    sendType: 'system',
    province: '广东',
    canJd: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'SUP-005',
    name: '九阳工厂库存',
    shortName: '九阳工厂',
    type: 'supplier',
    sendType: 'system',
    province: '浙江',
    canJd: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'SUP-006',
    name: '飞通京东',
    shortName: '飞通京东',
    type: 'supplier',
    sendType: 'jushuitan',
    province: '上海',
    canJd: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

// 供应商库存
export const mockStocks: SupplierStock[] = [
  {
    id: 'STK-001',
    supplierId: 'SUP-001',
    supplierName: '首映礼省内仓',
    productId: 'PRD-001',
    productCode: 'DZ100HG-GZ605',
    productName: '九阳电蒸锅 DZ100HG-GZ605',
    quantity: 15,
    price: 145,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-30T08:00:00Z'
  },
  {
    id: 'STK-002',
    supplierId: 'SUP-001',
    supplierName: '首映礼省内仓',
    productId: 'PRD-002',
    productCode: 'GS10',
    productName: '苏泊尔果蔬清洗机 GS10',
    quantity: 3, // 尾货，<=2台需要预警
    price: 115,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-30T08:00:00Z'
  },
  {
    id: 'STK-003',
    supplierId: 'SUP-003',
    supplierName: '成都拓普壹',
    productId: 'PRD-002',
    productCode: 'GS10',
    productName: '苏泊尔果蔬清洗机 GS10',
    quantity: 50,
    price: 110,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-30T08:00:00Z'
  },
  {
    id: 'STK-004',
    supplierId: 'SUP-002',
    supplierName: '广东云海',
    productId: 'PRD-003',
    productCode: '40N5',
    productName: '九阳电饭煲 40N5',
    quantity: 20,
    price: 360,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-30T08:00:00Z'
  },
  {
    id: 'STK-005',
    supplierId: 'SUP-005',
    supplierName: '九阳工厂库存',
    productId: 'PRD-004',
    productCode: 'KL60-V169',
    productName: '九阳空气炸锅 6L KL60-V169',
    quantity: 100,
    price: 280,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-30T08:00:00Z'
  }
];

// 商品映射
export const mockMappings: ProductMapping[] = [
  {
    id: 'MAP-001',
    customerProductName: '苏泊尔ZMD安心系列绞肉机',
    systemProductName: '苏泊尔ZMD安心系列 升级搅菜杆双层四刃精钢刀锋绞肉机',
    systemProductCode: 'JRD05-U',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'MAP-002',
    customerProductName: '九阳电蒸锅',
    systemProductName: '九阳电蒸锅',
    systemProductCode: 'DZ100HG-GZ605',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'MAP-003',
    customerProductName: '苏泊尔果蔬清洗机',
    systemProductName: '苏泊尔果蔬清洗机',
    systemProductCode: 'GS10',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  }
];

// 派发记录
export const mockDispatches: DispatchRecord[] = [
  {
    id: 'DSP-001',
    orderId: 'ORD-20260330-001',
    orderNo: 'ORD-20260330-001',
    supplierId: 'SUP-001',
    supplierName: '首映礼省内仓',
    expressCompany: '中通快递',
    trackingNo: 'ZT1234567890',
    status: 'shipped',
    createdAt: '2026-03-30T16:00:00Z',
    updatedAt: '2026-03-30T16:00:00Z'
  },
  {
    id: 'DSP-002',
    orderId: 'ORD-20260330-002',
    orderNo: 'ORD-20260330-002',
    supplierId: 'SUP-003',
    supplierName: '成都拓普壹',
    expressCompany: '圆通速递',
    trackingNo: 'YT9876543210',
    status: 'shipped',
    createdAt: '2026-03-30T17:00:00Z',
    updatedAt: '2026-03-30T17:00:00Z'
  }
];

// 回单记录
export const mockReturns: ReturnRecord[] = [
  {
    id: 'RET-001',
    orderId: 'ORD-20260330-002',
    orderNo: 'ORD-20260330-002',
    expressCompany: '圆通速递',
    trackingNo: 'YT9876543210',
    receivedAt: '2026-04-02T10:00:00Z',
    createdAt: '2026-04-02T10:00:00Z'
  }
];
