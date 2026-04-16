// Drizzle ORM Schema Definition
// This file defines the expected schema for the application.
// Note: Tables are managed manually in Supabase, this file is for type safety only.

import { pgTable, varchar, uuid, boolean, text, timestamp, jsonb, numeric } from 'drizzle-orm/pg-core';

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
