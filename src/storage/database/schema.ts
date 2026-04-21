// Drizzle ORM Schema Definition
// This file defines the expected schema for the application.
// Note: Tables are managed manually in Supabase, this file is for type safety only.

import { pgTable, varchar, uuid, boolean, text, timestamp, jsonb, numeric, integer, index, unique } from 'drizzle-orm/pg-core';

// Note: product_mappings uses varchar for id to avoid uuid casting issues
export const productMappings = pgTable('product_mappings', {
  id: varchar('id').primaryKey(),
  productId: uuid('product_id'),
  productCode: varchar('product_code'),
  productName: varchar('product_name'),
  customerId: uuid('customer_id'),
  customerCode: varchar('customer_code'),
  customerName: varchar('customer_name'),
  supplierId: uuid('supplier_id'),
  supplierName: varchar('supplier_name'),
  customerSku: varchar('customer_sku'),
  customerBarcode: varchar('customer_barcode'),
  customerProductName: varchar('customer_product_name').notNull(),
  price: numeric('price'),
  isActive: boolean('is_active').default(true),
  remark: text('remark'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey(),
  name: varchar('name').notNull(),
  type: varchar('type').notNull(),
  config: jsonb('config').notNull().default({}),
  isDefault: boolean('is_default'),
  isActive: boolean('is_active'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  // 非标准列（templates 表实际存在但 schema.ts 未声明）
  code: varchar('code'),
  description: text('description'),
  targetType: varchar('target_type'),
  targetId: uuid('target_id'),
  targetName: varchar('target_name'),
  fieldMappings: jsonb('field_mappings'),
}, (table) => ({
  typeIdx: index('templates_type_idx').on(table.type),
  isDefaultIdx: index('templates_is_default_idx').on(table.isDefault),
}));

export const templateFields = pgTable('template_fields', {
  id: uuid('id').primaryKey(),
  templateId: uuid('template_id').notNull(),
  fieldId: varchar('field_id').notNull(),
  fieldName: varchar('field_name').notNull(),
  sourceTable: varchar('source_table'),
  sourceField: varchar('source_field'),
  isRequired: boolean('is_required'),
  orderNum: integer('order_num'),
  width: integer('width'),
  format: varchar('format'),
  createdAt: timestamp('created_at', { withTimezone: true }),
}, (table) => ({
  templateIdx: index('template_fields_template_idx').on(table.templateId),
}));

export const templateLinks = pgTable('template_links', {
  id: uuid('id').primaryKey(),
  templateId: uuid('template_id').notNull(),
  linkType: varchar('link_type').notNull(),
  partnerId: uuid('partner_id').notNull(),
  partnerName: varchar('partner_name'),
  createdAt: timestamp('created_at', { withTimezone: true }),
}, (table) => ({
  templateIdx: index('template_links_template_idx').on(table.templateId),
  partnerIdx: index('template_links_partner_idx').on(table.partnerId),
}));
