-- Gift Order Management System - Database Schema
-- PostgreSQL initialization script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users & Auth
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar NOT NULL,
    username varchar UNIQUE NOT NULL,
    password varchar NOT NULL,
    role varchar NOT NULL DEFAULT 'operator',
    phone varchar,
    email varchar,
    status varchar DEFAULT 'active',
    data_scope varchar DEFAULT 'self',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Roles & Permissions
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar UNIQUE NOT NULL,
    name varchar NOT NULL,
    description text,
    data_scope varchar DEFAULT 'self',
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar UNIQUE NOT NULL,
    name varchar NOT NULL,
    category varchar,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- ============================================
-- Archive: Customers, Products, Shippers
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar UNIQUE NOT NULL,
    name varchar NOT NULL,
    salesperson_id uuid REFERENCES users(id),
    salesperson_name varchar,
    order_taker_id uuid REFERENCES users(id),
    order_taker_name varchar,
    status varchar DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar UNIQUE NOT NULL,
    name varchar NOT NULL,
    sku varchar,
    brand varchar,
    category varchar,
    unit_price numeric(10,2),
    weight decimal(8,2),
    length decimal(8,2),
    width decimal(8,2),
    height decimal(8,2),
    status varchar DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shippers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar UNIQUE NOT NULL,
    name varchar NOT NULL,
    type varchar NOT NULL DEFAULT 'supplier',
    send_type varchar,
    jd_channel_id varchar,
    pdd_shop_id varchar,
    can_jd boolean DEFAULT false,
    can_pdd boolean DEFAULT false,
    express_restrictions jsonb,
    settlement_type varchar,
    cost_factor numeric(5,2),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warehouses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code varchar UNIQUE NOT NULL,
    name varchar NOT NULL,
    type varchar,
    address varchar,
    contact varchar,
    phone varchar,
    status varchar DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- SKU Mappings
-- ============================================
CREATE TABLE IF NOT EXISTS sku_mappings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id uuid REFERENCES customers(id),
    customer_code varchar,
    product_id uuid REFERENCES products(id),
    product_code varchar,
    customer_sku varchar,
    customer_barcode varchar,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_mappings (
    id varchar PRIMARY KEY,
    product_id uuid,
    product_code varchar,
    product_name varchar,
    customer_id uuid,
    customer_code varchar,
    customer_name varchar,
    supplier_id uuid,
    supplier_name varchar,
    customer_sku varchar,
    customer_barcode varchar,
    customer_product_name varchar NOT NULL,
    price numeric,
    is_active boolean DEFAULT true,
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sys_order_no varchar UNIQUE NOT NULL,
    order_no varchar,
    status varchar DEFAULT 'pending',
    customer_id uuid REFERENCES customers(id),
    customer_code varchar,
    customer_name varchar,
    salesperson_name varchar,
    operator_name varchar,
    receiver_name varchar,
    receiver_phone varchar,
    receiver_address varchar,
    province varchar,
    city varchar,
    supplier_id uuid,
    supplier_name varchar,
    express_company varchar,
    tracking_no varchar,
    match_code varchar,
    items jsonb,
    ext_fields jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Stocks
-- ============================================
CREATE TABLE IF NOT EXISTS stocks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id uuid REFERENCES products(id),
    product_code varchar NOT NULL,
    product_name varchar NOT NULL,
    supplier_id uuid REFERENCES shippers(id),
    supplier_name varchar,
    warehouse_id uuid REFERENCES warehouses(id),
    warehouse_name varchar,
    quantity integer DEFAULT 0,
    price numeric(10,2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product_code, supplier_id)
);

CREATE TABLE IF NOT EXISTS stock_versions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_id uuid,
    product_code varchar,
    product_name varchar,
    supplier_id uuid,
    supplier_name varchar,
    before_quantity integer,
    after_quantity integer,
    change_quantity integer,
    before_price numeric,
    after_price numeric,
    change_price numeric,
    change_type varchar,
    change_reason text,
    operator varchar,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS price_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code varchar,
    product_name varchar,
    supplier_id uuid,
    supplier_name varchar,
    before_price numeric,
    after_price numeric,
    change_price numeric,
    change_type varchar,
    change_reason text,
    operator varchar,
    effective_from timestamptz,
    effective_to timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- Order Cost History
-- ============================================
CREATE TABLE IF NOT EXISTS order_cost_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid,
    order_no varchar,
    match_code varchar,
    supplier_id uuid,
    supplier_name varchar,
    warehouse_id uuid,
    warehouse_name varchar,
    product_code varchar,
    product_name varchar,
    quantity integer,
    unit_cost numeric(10,2),
    total_cost numeric(10,2),
    express_fee numeric(10,2),
    other_fee numeric(10,2),
    total_amount numeric(10,2),
    express_company varchar,
    tracking_no varchar,
    receiver_name varchar,
    receiver_phone varchar,
    receiver_address varchar,
    customer_code varchar,
    customer_name varchar,
    salesperson varchar,
    operator_name varchar,
    order_date date,
    shipped_date date,
    returned_date date,
    dispatch_batch varchar,
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================
-- Templates
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar NOT NULL,
    type varchar NOT NULL,
    config jsonb,
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS column_mappings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id uuid REFERENCES templates(id),
    field_name varchar,
    column_index integer,
    column_name varchar,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- Alert Rules & Records
-- ============================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar NOT NULL,
    code varchar UNIQUE NOT NULL,
    type varchar NOT NULL,
    config jsonb,
    priority integer DEFAULT 0,
    is_enabled boolean DEFAULT true,
    notification_channels jsonb,
    description text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id uuid REFERENCES alert_rules(id),
    rule_code varchar,
    order_id uuid,
    order_no varchar,
    alert_type varchar,
    alert_level varchar,
    title varchar,
    content text,
    is_read boolean DEFAULT false,
    is_resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by varchar,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- Export Records
-- ============================================
CREATE TABLE IF NOT EXISTS export_records (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type varchar NOT NULL,
    filename varchar,
    file_path varchar,
    status varchar,
    record_count integer,
    error_message text,
    created_by varchar,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS return_receipts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid REFERENCES orders(id),
    express_company varchar,
    tracking_no varchar,
    status varchar DEFAULT 'pending',
    matched_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- Insert Default Data
-- ============================================

-- Default admin user (password: admin123)
INSERT INTO users (name, username, password, role, data_scope) VALUES
('管理员', 'admin', 'admin123', 'admin', 'all'),
('业务员', 'salesperson', 'sales123', 'salesperson', 'self'),
('跟单员', 'operator', 'operator123', 'operator', 'self')
ON CONFLICT (username) DO NOTHING;

-- Default roles
INSERT INTO roles (code, name, description, data_scope, is_system) VALUES
('admin', '管理员', '系统管理员', 'all', true),
('salesperson', '业务员', '普通业务员', 'self', true),
('operator', '跟单员', '普通跟单员', 'self', true)
ON CONFLICT (code) DO NOTHING;

-- Default shipping template
INSERT INTO templates (name, type, config, is_default) VALUES
('发货通知单', 'shipping', '{"columns": ["客户订单号", "收货人", "电话", "地址", "商品", "数量", "备注"]}', true)
ON CONFLICT DO NOTHING;

-- Schema lock table (for Supabase platform compatibility)
CREATE TABLE IF NOT EXISTS _schema_lock (
    id varchar PRIMARY KEY DEFAULT 'locked',
    locked_at timestamptz DEFAULT now(),
    version varchar DEFAULT '1.0'
);
