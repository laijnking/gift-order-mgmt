-- =====================================================
-- Schema 对齐迁移
-- 执行顺序: 000_init.sql → 001_schema.sql → 002 → 003 → 004
-- 本文件补全因两个 migration 文件字段定义不一致导致的列缺失
-- =====================================================
-- 注意：使用 IF NOT EXISTS 子句，可安全重复执行
-- =====================================================

-- =====================================================
-- 1. users 表
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS real_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
UPDATE users SET real_name = name WHERE real_name IS NULL AND name IS NOT NULL;

-- =====================================================
-- 2. customers 表
-- =====================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS settlement_cycle VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS remark TEXT;

-- =====================================================
-- 3. products 表
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS spec VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT '台';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(20) DEFAULT '在售';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_factor INTEGER DEFAULT 6000;
ALTER TABLE products ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume DECIMAL(10,4);

-- =====================================================
-- 4. shippers 表
-- =====================================================
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS api_config JSONB;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE shippers ADD COLUMN IF NOT EXISTS city VARCHAR(50);

-- =====================================================
-- 5. suppliers 表
-- =====================================================
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS send_type VARCHAR(20) NOT NULL DEFAULT 'download';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS can_jd BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS express_restrictions JSONB DEFAULT '[]'::JSONB;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cost_factor INTEGER DEFAULT 100;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS remark TEXT;

-- =====================================================
-- 6. stocks 表
-- =====================================================
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2);
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS max_stock INTEGER;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS last_stock_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS last_stock_out_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS remark TEXT;

-- =====================================================
-- 7. orders 表
-- =====================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sys_order_no VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS salesperson_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS operator_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_no VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_date VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS income_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS income_amount NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'excel';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS import_batch VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_batch VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS express_requirement VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;
-- ext_field_1-20
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_1 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_2 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_3 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_4 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_5 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_6 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_7 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_8 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_9 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_10 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_11 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_12 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_13 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_14 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_15 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_16 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_17 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_18 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_19 TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ext_field_20 TEXT;

-- =====================================================
-- 8. warehouses 表
-- =====================================================
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'warehouse';
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS province VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS remark TEXT;

-- =====================================================
-- 9. 索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customers_salesperson ON customers(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_customers_order_taker ON customers(order_taker_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_stocks_product ON stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_supplier ON stocks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_shippers_type ON shippers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
