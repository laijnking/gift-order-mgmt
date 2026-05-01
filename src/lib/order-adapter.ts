/**
 * SSOT - 订单数据适配器
 * 
 * 本文件集中处理：
 * 1. snake_case ↔ camelCase 转换
 * 2. 新旧字段兜底
 * 3. schema 迁移
 * 
 * 所有订单相关的数据转换必须经过此模块。
 * 
 * 更新历史：
 * - v1.0 (2026-05-01): 初始版本，整合 orders/route.ts 中的 transformOrder 逻辑
 */

import type { Order } from '@/types/order';

// ============================================================
// 字段名映射表
// ============================================================

/** API 返回字段（camelCase）到数据库字段（snake_case）的映射 */
export const API_TO_DB_FIELD_MAP: Record<string, string> = {
  orderNo: 'order_no',
  customerOrderNo: 'customer_order_no',
  billNo: 'bill_no',
  billDate: 'bill_date',
  supplierOrderNo: 'supplier_order_no',
  customerCode: 'customer_code',
  customerId: 'customer_id',
  customerName: 'customer_name',
  supplierId: 'supplier_id',
  supplierName: 'supplier_name',
  salesperson: 'salesperson',
  salespersonId: 'salesperson_id',
  operator: 'operator',
  operatorId: 'operator_id',
  productName: 'product_name',
  productCode: 'product_code',
  productSpec: 'product_spec',
  systemProductId: 'system_product_id',
  systemProductName: 'system_product_name',
  systemProductCode: 'system_product_code',
  systemProductSpec: 'system_product_spec',
  systemProductBrand: 'system_product_brand',
  systemProductPrice: 'system_product_price',
  receiverName: 'receiver_name',
  receiverPhone: 'receiver_phone',
  receiverAddress: 'receiver_address',
  expressCompany: 'express_company',
  trackingNo: 'tracking_no',
  invoiceRequired: 'invoice_required',
  incomeName: 'income_name',
  incomeAmount: 'income_amount',
  discount: 'discount',
  taxRate: 'tax_rate',
  warehouse: 'warehouse',
  isActive: 'is_active',
  completedAt: 'completed_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

/** 数据库字段（snake_case）到 API 返回字段（camelCase）的映射 */
export const DB_TO_API_FIELD_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(API_TO_DB_FIELD_MAP).map(([api, db]) => [db, api])
);

// ============================================================
// 数据转换函数
// ============================================================

/**
 * 将数据库记录（snake_case）转换为 API 返回格式（camelCase）
 */
export function dbToApi<T extends Record<string, unknown>>(dbRecord: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(dbRecord)) {
    const apiField = DB_TO_API_FIELD_MAP[key] || key;
    result[apiField] = value;
  }
  
  return result;
}

/**
 * 将 API 请求格式（camelCase）转换为数据库记录（snake_case）
 */
export function apiToDb<T extends Record<string, unknown>>(apiRecord: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(apiRecord)) {
    const dbField = API_TO_DB_FIELD_MAP[key] || key;
    result[dbField] = value;
  }
  
  return result;
}

/**
 * 兼容旧字段的订单转换
 * 处理新旧字段名的兜底逻辑
 */
export function transformOrder(order: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...order };
  
  // customer_code / customerId 兼容
  if (!result.customerCode && result.customer_id) {
    result.customerCode = result.customer_id;
  }
  if (!result.customerId && result.customer_code) {
    result.customerId = result.customer_code;
  }
  
  // supplier_code / supplierId 兼容
  if (!result.supplierCode && result.supplier_id) {
    result.supplierCode = result.supplier_id;
  }
  if (!result.supplierId && result.supplier_code) {
    result.supplierId = result.supplier_code;
  }
  
  // salesperson_id / salespersonId 兼容
  if (!result.salespersonId && result.salesperson_id) {
    result.salespersonId = result.salesperson_id;
  }
  if (!result.salesperson && result.salesperson_id) {
    result.salespersonId = result.salesperson_id;
  }
  
  // operator_id / operatorId 兼容
  if (!result.operatorId && result.operator_id) {
    result.operatorId = result.operator_id;
  }
  
  // system_product_* 兼容
  if (!result.systemProductId && result.system_product_id) {
    result.systemProductId = result.system_product_id;
  }
  if (!result.systemProductCode && result.system_product_code) {
    result.systemProductCode = result.system_product_code;
  }
  if (!result.systemProductName && result.system_product_name) {
    result.systemProductName = result.system_product_name;
  }
  if (!result.systemProductSpec && result.system_product_spec) {
    result.systemProductSpec = result.system_product_spec;
  }
  if (!result.systemProductBrand && result.system_product_brand) {
    result.systemProductBrand = result.system_product_brand;
  }
  if (!result.systemProductPrice && result.system_product_price !== undefined) {
    result.systemProductPrice = result.system_product_price;
  }
  
  // 收货信息兼容
  if (!result.receiverName && result.receiver_name) {
    result.receiverName = result.receiver_name;
  }
  if (!result.receiverPhone && result.receiver_phone) {
    result.receiverPhone = result.receiver_phone;
  }
  if (!result.receiverAddress && result.receiver_address) {
    result.receiverAddress = result.receiver_address;
  }
  
  // 快递信息兼容
  if (!result.expressCompany && result.express_company) {
    result.expressCompany = result.express_company;
  }
  if (!result.trackingNo && result.tracking_no) {
    result.trackingNo = result.tracking_no;
  }
  
  // 发票信息兼容
  if (!result.invoiceRequired && result.invoice_required !== undefined) {
    result.invoiceRequired = result.invoice_required;
  }
  if (!result.incomeName && result.income_name) {
    result.incomeName = result.income_name;
  }
  if (!result.incomeAmount && result.income_amount !== undefined) {
    result.incomeAmount = result.income_amount;
  }
  
  // 订单号兼容
  if (!result.orderNo && result.order_no) {
    result.orderNo = result.order_no;
  }
  if (!result.customerOrderNo && result.customer_order_no) {
    result.customerOrderNo = result.customer_order_no;
  }
  if (!result.supplierOrderNo && result.supplier_order_no) {
    result.supplierOrderNo = result.supplier_order_no;
  }
  
  // 日期时间兼容
  if (!result.billDate && result.bill_date) {
    result.billDate = result.bill_date;
  }
  if (!result.completedAt && result.completed_at) {
    result.completedAt = result.completed_at;
  }
  if (!result.createdAt && result.created_at) {
    result.createdAt = result.created_at;
  }
  if (!result.updatedAt && result.updated_at) {
    result.updatedAt = result.updated_at;
  }
  
  return result;
}

// ============================================================
// 模板相关适配
// ============================================================

/**
 * 旧格式模板映射（对象格式）示例：
 * { "0": "customer_order_no", "1": "customer_product_name", ... }
 * 
 * 新格式模板映射（数组格式）示例：
 * [
 *   { "column": "0", "field": "customer_order_no" },
 *   { "column": "1", "field": "customer_product_name" },
 *   ...
 * ]
 */

/** 列映射项类型 */
export interface ColumnMappingItem {
  column: string;
  field: string;
}

/**
 * 统一列映射格式为数组格式
 */
export function normalizeColumnMapping(
  mapping: Record<string, string> | ColumnMappingItem[]
): ColumnMappingItem[] {
  // 如果是数组格式，直接返回
  if (Array.isArray(mapping)) {
    return mapping;
  }
  
  // 如果是对象格式，转换为数组格式
  return Object.entries(mapping).map(([column, field]) => ({
    column,
    field,
  }));
}

/**
 * 将数组格式的列映射转换为对象格式（用于兼容旧代码）
 */
export function columnMappingToRecord(
  mapping: ColumnMappingItem[]
): Record<string, string> {
  return mapping.reduce((acc, item) => {
    acc[item.column] = item.field;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * 获取列映射的版本信息
 */
export function getColumnMappingVersion(
  mapping: Record<string, string> | ColumnMappingItem[]
): number {
  if (Array.isArray(mapping)) {
    return mapping.length;
  }
  return Object.keys(mapping).length;
}

// ============================================================
// 订单项兼容
// ============================================================

/**
 * 订单项字段兼容处理
 */
export function transformOrderItem(
  item: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...item };
  
  // 客户商品字段
  if (!result.customerProductName && result.cu_product_name) {
    result.customerProductName = result.cu_product_name;
  }
  if (!result.customerProductCode && result.cu_product_code) {
    result.customerProductCode = result.cu_product_code;
  }
  if (!result.customerProductSpec && result.cu_product_spec) {
    result.customerProductSpec = result.cu_product_spec;
  }
  
  // 系统商品字段
  if (!result.systemProductId && result.system_product_id) {
    result.systemProductId = result.system_product_id;
  }
  if (!result.systemProductCode && result.system_product_code) {
    result.systemProductCode = result.system_product_code;
  }
  if (!result.systemProductName && result.system_product_name) {
    result.systemProductName = result.system_product_name;
  }
  if (!result.systemProductSpec && result.system_product_spec) {
    result.systemProductSpec = result.system_product_spec;
  }
  
  return result;
}

// ============================================================
// 导出类型
// ============================================================

/** 批量动作结果 */
export interface BulkActionResult {
  successCount: number;
  skippedCount: number;
  failed: Array<{ id: string; reason: string }>;
}

/**
 * 创建空的批量动作结果
 */
export function createEmptyBulkResult(): BulkActionResult {
  return {
    successCount: 0,
    skippedCount: 0,
    failed: [],
  };
}

/**
 * 添加成功到批量动作结果
 */
export function addSuccessToBulkResult(
  result: BulkActionResult
): BulkActionResult {
  return {
    ...result,
    successCount: result.successCount + 1,
  };
}

/**
 * 添加失败到批量动作结果
 */
export function addFailureToBulkResult(
  result: BulkActionResult,
  id: string,
  reason: string
): BulkActionResult {
  return {
    ...result,
    failed: [...result.failed, { id, reason }],
  };
}

/**
 * 添加跳过到批量动作结果
 */
export function addSkippedToBulkResult(
  result: BulkActionResult
): BulkActionResult {
  return {
    ...result,
    skippedCount: result.skippedCount + 1,
  };
}
