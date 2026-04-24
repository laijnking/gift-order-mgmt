-- =====================================================
-- Fix product_mappings table to match API expectations
-- The API batch route inserts with these fields:
-- product_id, product_code, product_name, customer_id,
-- customer_code, customer_name, supplier_id, supplier_name,
-- customer_sku, customer_barcode, customer_product_name,
-- price, is_active, remark, mapping_type
--
-- The original 001_schema.sql created a table with completely
-- different columns (system_product_*, customer_product_*).
-- This migration replaces it with the correct schema.
-- =====================================================

BEGIN;

-- Drop and recreate product_mappings with the correct schema
DROP TABLE IF EXISTS product_mappings CASCADE;

CREATE TABLE product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    customer_id UUID,
    customer_code VARCHAR(50),
    customer_name VARCHAR(100),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    customer_sku VARCHAR(50),
    customer_barcode VARCHAR(50),
    customer_product_name VARCHAR(200) NOT NULL,
    price NUMERIC(12,2),
    is_active BOOLEAN DEFAULT true,
    remark TEXT,
    mapping_type VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pm_product_id ON product_mappings(product_id);
CREATE INDEX idx_pm_customer_id ON product_mappings(customer_id);
CREATE INDEX idx_pm_supplier_id ON product_mappings(supplier_id);
CREATE INDEX idx_pm_customer_code ON product_mappings(customer_code);
CREATE INDEX idx_pm_product_code ON product_mappings(product_code);

-- RLS
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for product_mappings" ON product_mappings FOR ALL USING (true) WITH CHECK (true);

COMMIT;
