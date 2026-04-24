// Drizzle ORM Schema Definition
// All tables are managed manually via SQL migrations in supabase/migrations/
// This file provides TypeScript type safety and column definitions.
// Note: Column names use snake_case to match the database schema exactly.
// Note: product_mappings uses VARCHAR for id (see 001_fix_product_mappings.sql)
// Note: Several tables use VARCHAR(36) for foreign key IDs for flexibility.

import {
  pgTable,
  varchar,
  uuid,
  boolean,
  text,
  timestamp,
  jsonb,
  numeric,
  integer,
  date,
  serial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// 1. users
// ============================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  realName: varchar('real_name', { length: 100 }),
  role: varchar('role', { length: 20 }).default('operator'),
  department: varchar('department', { length: 100 }),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  remark: text('remark'),
  dataScope: varchar('data_scope', { length: 20 }).default('self'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 2. orders
// ============================================================
export const orders = pgTable('orders', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  orderNo: varchar('order_no', { length: 100 }).notNull(),
  supplierOrderNo: varchar('supplier_order_no', { length: 100 }),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  items: jsonb('items').notNull().default([]),
  receiverName: varchar('receiver_name', { length: 100 }).notNull(),
  receiverPhone: varchar('receiver_phone', { length: 20 }).notNull(),
  receiverAddress: text('receiver_address').notNull(),
  province: varchar('province', { length: 50 }),
  city: varchar('city', { length: 50 }),
  district: varchar('district', { length: 50 }),
  customerCode: varchar('customer_code', { length: 50 }),
  customerName: varchar('customer_name', { length: 100 }),
  salesperson: varchar('salesperson', { length: 50 }),
  supplierId: varchar('supplier_id', { length: 36 }),
  supplierName: varchar('supplier_name', { length: 100 }),
  expressCompany: varchar('express_company', { length: 50 }),
  trackingNo: varchar('tracking_no', { length: 100 }),
  source: varchar('source', { length: 20 }).notNull().default('excel'),
  importBatch: varchar('import_batch', { length: 50 }),
  assignedBatch: varchar('assigned_batch', { length: 50 }),
  matchCode: varchar('match_code', { length: 20 }),
  remark: text('remark'),
  expressRequirement: varchar('express_requirement', { length: 200 }),
  sysOrderNo: varchar('sys_order_no', { length: 50 }),
  operatorName: varchar('operator_name', { length: 50 }).default(''),
  billNo: varchar('bill_no', { length: 100 }),
  billDate: varchar('bill_date', { length: 50 }),
  warehouse: varchar('warehouse', { length: 100 }),
  discount: numeric('discount', { precision: 10, scale: 2 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  incomeName: varchar('income_name', { length: 100 }),
  incomeAmount: numeric('income_amount', { precision: 12, scale: 2 }),
  invoiceRequired: boolean('invoice_required'),
  salespersonId: uuid('salesperson_id'),
  operatorId: uuid('operator_id'),
  customerId: uuid('customer_id'),
  warehouseId: varchar('warehouse_id', { length: 100 }),
  // 补充字段
  expressFee: numeric('express_fee', { precision: 12, scale: 2 }),
  otherFee: numeric('other_fee', { precision: 12, scale: 2 }),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  // 20个备用扩展字段
  extField1: text('ext_field_1'),
  extField2: text('ext_field_2'),
  extField3: text('ext_field_3'),
  extField4: text('ext_field_4'),
  extField5: text('ext_field_5'),
  extField6: text('ext_field_6'),
  extField7: text('ext_field_7'),
  extField8: text('ext_field_8'),
  extField9: text('ext_field_9'),
  extField10: text('ext_field_10'),
  extField11: text('ext_field_11'),
  extField12: text('ext_field_12'),
  extField13: text('ext_field_13'),
  extField14: text('ext_field_14'),
  extField15: text('ext_field_15'),
  extField16: text('ext_field_16'),
  extField17: text('ext_field_17'),
  extField18: text('ext_field_18'),
  extField19: text('ext_field_19'),
  extField20: text('ext_field_20'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ============================================================
// 3. shippers
// ============================================================
export const shippers = pgTable('shippers', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  shortName: varchar('short_name', { length: 100 }),
  type: varchar('type', { length: 20 }).notNull(),
  contactPerson: varchar('contact_person', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  province: varchar('province', { length: 50 }),
  city: varchar('city', { length: 50 }),
  address: varchar('address', { length: 500 }),
  sendType: varchar('send_type', { length: 20 }).notNull(),
  jdChannelId: varchar('jd_channel_id', { length: 50 }),
  pddShopId: varchar('pdd_shop_id', { length: 50 }),
  canJd: boolean('can_jd').default(false),
  canPdd: boolean('can_pdd').default(false),
  expressRestrictions: jsonb('express_restrictions').default([]),
  settlementType: varchar('settlement_type', { length: 20 }),
  costFactor: numeric('cost_factor', { precision: 5, scale: 4 }),
  contact: varchar('contact', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  region: varchar('region', { length: 50 }),
  apiConfig: jsonb('api_config'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(sql`0`),
  remark: text('remark'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 4. suppliers
// ============================================================
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }),
  name: varchar('name', { length: 200 }).notNull(),
  shortName: varchar('short_name', { length: 100 }),
  type: varchar('type', { length: 20 }).notNull(),
  contact: varchar('contact', { length: 100 }),
  sendType: varchar('send_type', { length: 20 }).notNull(),
  province: varchar('province', { length: 50 }),
  city: varchar('city', { length: 50 }),
  canJd: boolean('can_jd').default(false),
  expressRestrictions: jsonb('express_restrictions').default([]),
  costFactor: integer('cost_factor').default(100),
  remark: text('remark'),
  contactPerson: varchar('contact_person', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

// ============================================================
// 5. customers
// ============================================================
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  type: varchar('type', { length: 20 }).default('normal'),
  contact: varchar('contact', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  mobile: varchar('mobile', { length: 20 }),
  address: varchar('address', { length: 500 }),
  region: varchar('region', { length: 50 }),
  province: varchar('province', { length: 50 }),
  city: varchar('city', { length: 50 }),
  district: varchar('district', { length: 50 }),
  contactPerson: varchar('contact_person', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 100 }),
  salespersonId: uuid('salesperson_id'),
  salespersonName: varchar('salesperson_name', { length: 50 }),
  orderTakerId: uuid('order_taker_id'),
  orderTakerName: varchar('order_taker_name', { length: 50 }),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }),
  paymentDays: integer('payment_days').default(sql`0`),
  paymentStatus: varchar('payment_status', { length: 20 }).default('normal'),
  settlementCycle: varchar('settlement_cycle', { length: 20 }),
  status: varchar('status', { length: 20 }).default('active'),
  remark: text('remark'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 6. products
// ============================================================
export const products = pgTable('products', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  sku: varchar('sku', { length: 50 }),
  barcode: varchar('barcode', { length: 50 }),
  brand: varchar('brand', { length: 100 }),
  category: varchar('category', { length: 100 }),
  spec: varchar('spec', { length: 200 }),
  unit: varchar('unit', { length: 20 }),
  size: varchar('size', { length: 50 }),
  weight: numeric('weight', { precision: 8, scale: 3 }),
  costPrice: numeric('cost_price', { precision: 12, scale: 2 }).default(sql`0`),
  retailPrice: numeric('retail_price', { precision: 12, scale: 2 }).default(sql`0`),
  lifecycleStatus: varchar('lifecycle_status', { length: 20 }).default('在售'),
  isActive: boolean('is_active').default(true),
  // 尺寸/体积/重量字段（用于运费计算）
  length: numeric('length', { precision: 8, scale: 2 }),
  width: numeric('width', { precision: 8, scale: 2 }),
  height: numeric('height', { precision: 8, scale: 2 }),
  volume: numeric('volume', { precision: 10, scale: 4 }),
  lengthCm: numeric('length_cm', { precision: 8, scale: 2 }),
  widthCm: numeric('width_cm', { precision: 8, scale: 2 }),
  heightCm: numeric('height_cm', { precision: 8, scale: 2 }),
  weightKg: numeric('weight_kg', { precision: 8, scale: 3 }),
  volumeFactor: integer('volume_factor').default(6000),
  imageUrl: varchar('image_url', { length: 500 }),
  description: text('description'),
  remark: text('remark'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 7. warehouses
// ============================================================
export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  shortName: varchar('short_name', { length: 100 }),
  type: varchar('type', { length: 20 }).notNull(),
  address: varchar('address', { length: 500 }),
  contact: varchar('contact', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  province: varchar('province', { length: 50 }),
  city: varchar('city', { length: 50 }),
  contactPerson: varchar('contact_person', { length: 100 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  status: varchar('status', { length: 20 }).default('active'),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 8. stocks
// ============================================================
export const stocks = pgTable('stocks', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  productId: uuid('product_id').notNull(),
  productCode: varchar('product_code', { length: 50 }),
  productName: varchar('product_name', { length: 200 }),
  supplierId: uuid('supplier_id').notNull(),
  supplierName: varchar('supplier_name', { length: 100 }),
  warehouseId: uuid('warehouse_id'),
  warehouseName: varchar('warehouse_name', { length: 100 }),
  quantity: integer('quantity').default(sql`0`),
  reservedQuantity: integer('reserved_quantity').default(sql`0`),
  // available_quantity is a GENERATED column: quantity - reserved_quantity
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }),
  minStock: integer('min_stock').default(sql`0`),
  maxStock: integer('max_stock'),
  inTransit: integer('in_transit').default(sql`0`),
  status: varchar('status', { length: 20 }).default('active'),
  lastStockInAt: timestamp('last_stock_in_at', { withTimezone: true }),
  lastStockOutAt: timestamp('last_stock_out_at', { withTimezone: true }),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 9. stock_versions
// ============================================================
export const stockVersions = pgTable('stock_versions', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  stockId: uuid('stock_id'),
  productCode: varchar('product_code', { length: 50 }),
  productName: varchar('product_name', { length: 200 }),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  warehouseId: uuid('warehouse_id'),
  warehouseName: varchar('warehouse_name', { length: 100 }),
  beforeQuantity: integer('before_quantity'),
  afterQuantity: integer('after_quantity'),
  changeQuantity: integer('change_quantity'),
  beforePrice: numeric('before_price', { precision: 12, scale: 2 }),
  afterPrice: numeric('after_price', { precision: 12, scale: 2 }),
  changePrice: numeric('change_price', { precision: 12, scale: 2 }),
  changeType: varchar('change_type', { length: 20 }).notNull(),
  changeReason: text('change_reason'),
  referenceId: varchar('reference_id', { length: 50 }),
  operator: varchar('operator', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 10. price_history
// ============================================================
export const priceHistory = pgTable('price_history', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  productCode: varchar('product_code', { length: 50 }),
  productName: varchar('product_name', { length: 200 }),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  beforePrice: numeric('before_price', { precision: 12, scale: 2 }),
  afterPrice: numeric('after_price', { precision: 12, scale: 2 }),
  changePrice: numeric('change_price', { precision: 12, scale: 2 }),
  changeType: varchar('change_type', { length: 20 }).notNull(),
  changeReason: text('change_reason'),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  operator: varchar('operator', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 11. order_cost_history
// ============================================================
export const orderCostHistory = pgTable('order_cost_history', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  orderId: uuid('order_id').notNull(),
  orderNo: varchar('order_no', { length: 50 }),
  matchCode: varchar('match_code', { length: 50 }),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  warehouseId: uuid('warehouse_id'),
  warehouseName: varchar('warehouse_name', { length: 100 }),
  productCode: varchar('product_code', { length: 50 }),
  productName: varchar('product_name', { length: 200 }),
  quantity: integer('quantity'),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }),
  expressFee: numeric('express_fee', { precision: 12, scale: 2 }),
  otherFee: numeric('other_fee', { precision: 12, scale: 2 }),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  expressCompany: varchar('express_company', { length: 50 }),
  trackingNo: varchar('tracking_no', { length: 100 }),
  receiverName: varchar('receiver_name', { length: 50 }),
  receiverPhone: varchar('receiver_phone', { length: 20 }),
  receiverAddress: varchar('receiver_address', { length: 500 }),
  customerCode: varchar('customer_code', { length: 50 }),
  customerName: varchar('customer_name', { length: 100 }),
  salesperson: varchar('salesperson', { length: 50 }),
  operatorName: varchar('operator_name', { length: 50 }),
  orderDate: date('order_date'),
  shippedDate: date('shipped_date'),
  returnedDate: date('returned_date'),
  dispatchBatch: varchar('dispatch_batch', { length: 50 }),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 12. return_records
// ============================================================
export const returnRecords = pgTable('return_records', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  orderId: uuid('order_id'),
  orderNo: varchar('order_no', { length: 50 }),
  expressCompany: varchar('express_company', { length: 50 }).notNull(),
  trackingNo: varchar('tracking_no', { length: 100 }).notNull(),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  matchedBy: varchar('matched_by', { length: 20 }),
  matchConfidence: numeric('match_confidence', { precision: 5, scale: 2 }),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  operator: varchar('operator', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 13. return_receipts
// ============================================================
export const returnReceipts = pgTable('return_receipts', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  receiptNo: varchar('receipt_no', { length: 50 }),
  recordId: varchar('record_id', { length: 36 }).notNull(),
  customerId: varchar('customer_id', { length: 36 }),
  orderId: varchar('order_id', { length: 36 }),
  supplierId: varchar('supplier_id', { length: 36 }).notNull(),
  supplierName: varchar('supplier_name', { length: 100 }),
  customerOrderNo: varchar('customer_order_no', { length: 50 }),
  expressCompany: varchar('express_company', { length: 50 }),
  trackingNo: varchar('tracking_no', { length: 100 }),
  shipDate: date('ship_date'),
  quantity: integer('quantity'),
  price: numeric('price', { precision: 12, scale: 2 }),
  remark: text('remark'),
  matchStatus: varchar('match_status', { length: 20 }).default('pending'),
  matchedAt: timestamp('matched_at', { withTimezone: true }),
  supplierOrderNo: varchar('supplier_order_no', { length: 50 }),
  warehouse: varchar('warehouse', { length: 100 }),
  orderIdKey: uuid('order_id_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 14. return_receipt_records
// ============================================================
export const returnReceiptRecords = pgTable('return_receipt_records', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  supplierId: varchar('supplier_id', { length: 36 }).notNull(),
  supplierName: varchar('supplier_name', { length: 100 }),
  productId: uuid('product_id'),
  quantity: integer('quantity'),
  price: numeric('price', { precision: 12, scale: 2 }),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 100 }),
  totalCount: integer('total_count').default(sql`0`),
  matchedCount: integer('matched_count').default(sql`0`),
  unmatchedCount: integer('unmatched_count').default(sql`0`),
  importedBy: varchar('imported_by', { length: 50 }),
  importedAt: timestamp('imported_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  supplierOrderNo: varchar('supplier_order_no', { length: 50 }),
  warehouse: varchar('warehouse', { length: 100 }),
});

// ============================================================
// 15. export_records
// ============================================================
export const exportRecords = pgTable('export_records', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  exportType: varchar('export_type', { length: 20 }).notNull(),
  businessType: varchar('business_type', { length: 20 }),
  supplierId: uuid('supplier_id'),
  customerId: uuid('customer_id'),
  orderIds: jsonb('order_ids'),
  templateId: uuid('template_id'),
  templateName: varchar('template_name', { length: 100 }),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  zipFileUrl: text('zip_file_url'),
  zipFileName: varchar('zip_file_name', { length: 255 }),
  totalCount: integer('total_count').default(sql`0`),
  exportedBy: varchar('exported_by', { length: 50 }),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  filterConditions: jsonb('filter_conditions'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 16. batch_export_details
// ============================================================
export const batchExportDetails = pgTable('batch_export_details', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  batchId: uuid('batch_id').notNull(),
  orderId: uuid('order_id'),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 17. dispatch_records
// ============================================================
export const dispatchRecords = pgTable('dispatch_records', {
  id: varchar('id', { length: 36 }).primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  orderId: varchar('order_id', { length: 36 }).notNull(),
  supplierId: varchar('supplier_id', { length: 36 }).notNull(),
  supplierName: varchar('supplier_name', { length: 200 }).notNull(),
  warehouseId: varchar('warehouse_id', { length: 36 }),
  batchNo: varchar('batch_no', { length: 50 }).notNull(),
  dispatchAt: timestamp('dispatch_at', { withTimezone: true }).notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('sent'),
  items: jsonb('items').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 18. product_mappings
// ============================================================
export const productMappings = pgTable('product_mappings', {
  // VARCHAR for id (not UUID) — see 001_fix_product_mappings.sql
  id: varchar('id').primaryKey(),
  productId: uuid('product_id'),
  productCode: varchar('product_code', { length: 50 }),
  productName: varchar('product_name', { length: 200 }),
  customerId: uuid('customer_id'),
  customerCode: varchar('customer_code', { length: 50 }),
  customerName: varchar('customer_name', { length: 100 }),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  customerSku: varchar('customer_sku', { length: 50 }),
  customerBarcode: varchar('customer_barcode', { length: 50 }),
  customerProductName: varchar('customer_product_name').notNull(),
  price: numeric('price'),
  isActive: boolean('is_active').default(true),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 19. customer_product_mappings
// ============================================================
export const customerProductMappings = pgTable('customer_product_mappings', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  customerId: uuid('customer_id').notNull(),
  customerCode: varchar('customer_code', { length: 50 }),
  customerName: varchar('customer_name', { length: 100 }),
  customerProductCode: varchar('customer_product_code', { length: 50 }),
  customerProductName: varchar('customer_product_name', { length: 200 }).notNull(),
  customerProductModel: varchar('customer_product_model', { length: 200 }),
  productId: uuid('product_id'),
  productCode: varchar('product_code', { length: 50 }),
  productName: varchar('product_name', { length: 100 }),
  productModel: varchar('product_model', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 20. product_customer_mappings
// ============================================================
export const productCustomerMappings = pgTable('product_customer_mappings', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  productId: uuid('product_id'),
  customerId: uuid('customer_id'),
  customerProductCode: varchar('customer_product_code', { length: 50 }),
  customerProductName: varchar('customer_product_name', { length: 100 }),
  supplierProductCode: varchar('supplier_product_code', { length: 50 }),
  supplierProductName: varchar('supplier_product_name', { length: 100 }),
  price: numeric('price', { precision: 12, scale: 2 }).default(sql`0`),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 21. column_mappings
// ============================================================
export const columnMappings = pgTable('column_mappings', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  customerCode: varchar('customer_code', { length: 50 }).notNull(),
  mappingConfig: jsonb('mapping_config').notNull().default({}),
  headerRow: integer('header_row').default(sql`0`),
  version: integer('version').default(sql`1`),
  isActive: boolean('is_active').default(true),
  createdBy: varchar('created_by', { length: 50 }),
  remark: text('remark'),
  sourceHeaders: jsonb('source_headers').default([]),
  headerFingerprint: varchar('header_fingerprint', { length: 64 }),
  templateSignature: varchar('template_signature', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 22. alert_rules
// ============================================================
export const alertRules = pgTable('alert_rules', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(),
  config: jsonb('config').notNull().default({}),
  priority: integer('priority').default(5),
  isEnabled: boolean('is_enabled').default(true),
  notificationChannels: jsonb('notification_channels'),
  description: text('description'),
  remark: text('remark'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 23. alert_records
// ============================================================
export const alertRecords = pgTable('alert_records', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  ruleId: uuid('rule_id'),
  ruleCode: varchar('rule_code', { length: 50 }),
  orderId: uuid('order_id'),
  orderNo: varchar('order_no', { length: 50 }),
  stockId: uuid('stock_id'),
  alertType: varchar('alert_type', { length: 20 }).notNull(),
  alertLevel: varchar('alert_level', { length: 20 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  data: jsonb('data'),
  isRead: boolean('is_read').default(false),
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: varchar('resolved_by', { length: 50 }),
  resolution: text('resolution'),
  // API 额外使用的字段
  customerCode: varchar('customer_code', { length: 50 }),
  productCode: varchar('product_code', { length: 50 }),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 24. roles
// ============================================================
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  dataScope: varchar('data_scope', { length: 20 }).default('self'),
  isSystem: boolean('is_system').default(false),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(sql`0`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 25. permissions
// ============================================================
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').default(sql`0`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 26. role_permissions
// ============================================================
export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 27. templates
// ============================================================
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 100 }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(),
  targetType: varchar('target_type', { length: 20 }),
  targetId: uuid('target_id'),
  targetName: varchar('target_name', { length: 100 }),
  fieldMappings: jsonb('field_mappings').notNull().default({}),
  config: jsonb('config').notNull().default({}),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 28. template_fields
// ============================================================
export const templateFields = pgTable('template_fields', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  fieldId: varchar('field_id', { length: 50 }).notNull(),
  fieldName: varchar('field_name', { length: 50 }).notNull(),
  sourceTable: varchar('source_table', { length: 50 }),
  sourceField: varchar('source_field', { length: 50 }),
  isRequired: boolean('is_required').default(false),
  orderNum: integer('order_num').default(sql`0`),
  width: integer('width').default(100),
  format: varchar('format', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 29. template_links
// ============================================================
export const templateLinks = pgTable('template_links', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  templateId: uuid('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  linkType: varchar('link_type', { length: 20 }).notNull(),
  partnerId: uuid('partner_id').notNull(),
  partnerName: varchar('partner_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 30. agent_configs
// ============================================================
export const agentConfigs = pgTable('agent_configs', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).default('custom'),
  description: text('description'),
  promptTemplate: text('prompt_template').notNull(),
  model: varchar('model', { length: 50 }).default('doubao-seed'),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).default(sql`0.7`),
  maxTokens: integer('max_tokens').default(sql`2000`),
  config: jsonb('config'),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  testInput: text('test_input'),
  testOutput: text('test_output'),
  testStatus: varchar('test_status', { length: 20 }),
  runCount: integer('run_count').default(sql`0`),
  successCount: integer('success_count').default(sql`0`),
  failCount: integer('fail_count').default(sql`0`),
  avgDurationMs: integer('avg_duration_ms').default(sql`0`),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 31. ai_logs
// ============================================================
export const aiLogs = pgTable('ai_logs', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  agentId: uuid('agent_id'),
  agentCode: varchar('agent_code', { length: 50 }),
  agentName: varchar('agent_name', { length: 100 }),
  input: text('input').notNull(),
  output: text('output'),
  status: varchar('status', { length: 20 }).default('success'),
  durationMs: integer('duration_ms'),
  model: varchar('model', { length: 50 }),
  config: jsonb('config'),
  metadata: jsonb('metadata'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// 32. health_check
// ============================================================
export const healthCheck = pgTable('health_check', {
  id: uuid('id').primaryKey().default(sql`(gen_random_uuid()::varchar)`),
  status: varchar('status', { length: 20 }).default('ok'),
  message: text('message'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow(),
});
