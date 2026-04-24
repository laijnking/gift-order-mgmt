-- Gift Order Management System - Database Schema
-- PostgreSQL initialization script
-- This file defines the complete schema aligned with schema.ts
-- All tables are managed manually via SQL migrations in supabase/migrations/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(50) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    real_name varchar(100),
    role varchar(20) DEFAULT 'operator',
    department varchar(100),
    is_active boolean DEFAULT true,
    last_login_at timestamptz,
    phone varchar(20),
    email varchar(100),
    remark text,
    data_scope varchar(20) DEFAULT 'self',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. roles
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(50) NOT NULL,
    description text,
    data_scope varchar(20) DEFAULT 'self',
    is_system boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    category varchar(50),
    description text,
    parent_id uuid,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. role_permissions
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(role_id, permission_id)
);

-- ============================================================
-- 5. customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    type varchar(20) DEFAULT 'normal',
    contact varchar(100),
    phone varchar(20),
    mobile varchar(20),
    address varchar(500),
    region varchar(50),
    province varchar(50),
    city varchar(50),
    district varchar(50),
    contact_person varchar(100),
    contact_phone varchar(20),
    contact_email varchar(100),
    salesperson_id uuid,
    salesperson_name varchar(50),
    order_taker_id uuid,
    order_taker_name varchar(50),
    credit_limit numeric(12,2),
    payment_days integer DEFAULT 0,
    payment_status varchar(20) DEFAULT 'normal',
    settlement_cycle varchar(20),
    status varchar(20) DEFAULT 'active',
    remark text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    sku varchar(50),
    barcode varchar(50),
    brand varchar(100),
    category varchar(100),
    spec varchar(200),
    unit varchar(20),
    size varchar(50),
    weight numeric(8,3),
    cost_price numeric(12,2) DEFAULT 0,
    retail_price numeric(12,2) DEFAULT 0,
    lifecycle_status varchar(20) DEFAULT '在售',
    is_active boolean DEFAULT true,
    length numeric(8,2),
    width numeric(8,2),
    height numeric(8,2),
    volume numeric(10,4),
    length_cm numeric(8,2),
    width_cm numeric(8,2),
    height_cm numeric(8,2),
    weight_kg numeric(8,3),
    volume_factor integer DEFAULT 6000,
    image_url varchar(500),
    description text,
    remark text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50),
    name varchar(200) NOT NULL,
    short_name varchar(100),
    type varchar(20) NOT NULL,
    contact varchar(100),
    send_type varchar(20) NOT NULL,
    province varchar(50),
    city varchar(50),
    can_jd boolean DEFAULT false,
    express_restrictions jsonb DEFAULT '[]',
    cost_factor integer DEFAULT 100,
    remark text,
    contact_person varchar(100),
    contact_phone varchar(20),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz
);

-- ============================================================
-- 8. warehouses
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    short_name varchar(100),
    type varchar(20) NOT NULL,
    address varchar(500),
    contact varchar(100),
    phone varchar(20),
    province varchar(50),
    city varchar(50),
    contact_person varchar(100),
    contact_phone varchar(20),
    status varchar(20) DEFAULT 'active',
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 9. shippers
-- ============================================================
CREATE TABLE IF NOT EXISTS shippers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    short_name varchar(100),
    type varchar(20) NOT NULL,
    contact_person varchar(100),
    contact_phone varchar(20),
    province varchar(50),
    city varchar(50),
    address varchar(500),
    send_type varchar(20) NOT NULL,
    jd_channel_id varchar(50),
    pdd_shop_id varchar(50),
    can_jd boolean DEFAULT false,
    can_pdd boolean DEFAULT false,
    express_restrictions jsonb DEFAULT '[]',
    settlement_type varchar(20),
    cost_factor numeric(5,4),
    contact varchar(100),
    phone varchar(20),
    region varchar(50),
    api_config jsonb,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    remark text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 10. sku_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS sku_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ============================================================
-- 11. product_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS product_mappings (
    id varchar PRIMARY KEY,
    product_id uuid,
    product_code varchar(50),
    product_name varchar(200),
    customer_id uuid,
    customer_code varchar(50),
    customer_name varchar(100),
    supplier_id uuid,
    supplier_name varchar(100),
    customer_sku varchar(50),
    customer_barcode varchar(50),
    customer_product_name varchar NOT NULL,
    price numeric,
    is_active boolean DEFAULT true,
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 12. customer_product_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_product_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL,
    customer_code varchar(50),
    customer_name varchar(100),
    customer_product_code varchar(50),
    customer_product_name varchar(200) NOT NULL,
    customer_product_model varchar(200),
    product_id uuid,
    product_code varchar(50),
    product_name varchar(100),
    product_model varchar(100),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 13. product_customer_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS product_customer_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid,
    customer_id uuid,
    customer_product_code varchar(50),
    customer_product_name varchar(100),
    supplier_product_code varchar(50),
    supplier_product_name varchar(100),
    price numeric(12,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 14. orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    order_no varchar(100) NOT NULL,
    supplier_order_no varchar(100),
    status varchar(30) NOT NULL DEFAULT 'pending',
    items jsonb NOT NULL DEFAULT '[]',
    receiver_name varchar(100) NOT NULL,
    receiver_phone varchar(20) NOT NULL,
    receiver_address text NOT NULL,
    province varchar(50),
    city varchar(50),
    district varchar(50),
    customer_code varchar(50),
    customer_name varchar(100),
    salesperson varchar(50),
    supplier_id varchar(36),
    supplier_name varchar(100),
    express_company varchar(50),
    tracking_no varchar(100),
    source varchar(20) NOT NULL DEFAULT 'excel',
    import_batch varchar(50),
    assigned_batch varchar(50),
    match_code varchar(20),
    remark text,
    express_requirement varchar(200),
    sys_order_no varchar(50),
    operator_name varchar(50) DEFAULT '',
    bill_no varchar(100),
    bill_date varchar(50),
    warehouse varchar(100),
    discount numeric(10,2),
    tax_rate numeric(5,2),
    amount numeric(12,2),
    income_name varchar(100),
    income_amount numeric(12,2),
    invoice_required boolean,
    salesperson_id uuid,
    operator_id uuid,
    customer_id uuid,
    warehouse_id varchar(100),
    express_fee numeric(12,2),
    other_fee numeric(12,2),
    returned_at timestamptz,
    ext_field_1 text,
    ext_field_2 text,
    ext_field_3 text,
    ext_field_4 text,
    ext_field_5 text,
    ext_field_6 text,
    ext_field_7 text,
    ext_field_8 text,
    ext_field_9 text,
    ext_field_10 text,
    ext_field_11 text,
    ext_field_12 text,
    ext_field_13 text,
    ext_field_14 text,
    ext_field_15 text,
    ext_field_16 text,
    ext_field_17 text,
    ext_field_18 text,
    ext_field_19 text,
    ext_field_20 text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz,
    assigned_at timestamptz,
    completed_at timestamptz
);

-- ============================================================
-- 15. stocks
-- ============================================================
CREATE TABLE IF NOT EXISTS stocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL,
    product_code varchar(50),
    product_name varchar(200),
    supplier_id uuid NOT NULL,
    supplier_name varchar(100),
    warehouse_id uuid,
    warehouse_name varchar(100),
    quantity integer DEFAULT 0,
    reserved_quantity integer DEFAULT 0,
    unit_price numeric(12,2),
    min_stock integer DEFAULT 0,
    max_stock integer,
    in_transit integer DEFAULT 0,
    status varchar(20) DEFAULT 'active',
    last_stock_in_at timestamptz,
    last_stock_out_at timestamptz,
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(product_id, supplier_id, warehouse_id)
);

-- ============================================================
-- 16. stock_versions
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id uuid,
    product_code varchar(50),
    product_name varchar(200),
    supplier_id uuid,
    supplier_name varchar(100),
    warehouse_id uuid,
    warehouse_name varchar(100),
    before_quantity integer,
    after_quantity integer,
    change_quantity integer,
    before_price numeric(12,2),
    after_price numeric(12,2),
    change_price numeric(12,2),
    change_type varchar(20) NOT NULL,
    change_reason text,
    reference_id varchar(50),
    operator varchar(50),
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 17. price_history
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code varchar(50),
    product_name varchar(200),
    supplier_id uuid,
    supplier_name varchar(100),
    before_price numeric(12,2),
    after_price numeric(12,2),
    change_price numeric(12,2),
    change_type varchar(20) NOT NULL,
    change_reason text,
    effective_from timestamptz DEFAULT now(),
    effective_to timestamptz,
    operator varchar(50),
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 18. order_cost_history
-- ============================================================
CREATE TABLE IF NOT EXISTS order_cost_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    order_no varchar(50),
    match_code varchar(50),
    supplier_id uuid,
    supplier_name varchar(100),
    warehouse_id uuid,
    warehouse_name varchar(100),
    product_code varchar(50),
    product_name varchar(200),
    quantity integer,
    unit_cost numeric(12,2),
    total_cost numeric(12,2),
    express_fee numeric(12,2),
    other_fee numeric(12,2),
    total_amount numeric(12,2),
    express_company varchar(50),
    tracking_no varchar(100),
    receiver_name varchar(50),
    receiver_phone varchar(20),
    receiver_address varchar(500),
    customer_code varchar(50),
    customer_name varchar(100),
    salesperson varchar(50),
    operator_name varchar(50),
    order_date date,
    shipped_date date,
    returned_date date,
    dispatch_batch varchar(50),
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 19. return_records
-- ============================================================
CREATE TABLE IF NOT EXISTS return_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid,
    order_no varchar(50),
    express_company varchar(50) NOT NULL,
    tracking_no varchar(100) NOT NULL,
    returned_at timestamptz,
    matched_by varchar(20),
    match_confidence numeric(5,2),
    supplier_id uuid,
    supplier_name varchar(100),
    operator varchar(50),
    status varchar(20) NOT NULL DEFAULT 'pending',
    remark text,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 20. return_receipts
-- ============================================================
CREATE TABLE IF NOT EXISTS return_receipts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no varchar(50),
    record_id varchar(36) NOT NULL,
    customer_id varchar(36),
    order_id varchar(36),
    supplier_id varchar(36) NOT NULL,
    supplier_name varchar(100),
    customer_order_no varchar(50),
    express_company varchar(50),
    tracking_no varchar(100),
    ship_date date,
    quantity integer,
    price numeric(12,2),
    remark text,
    match_status varchar(20) DEFAULT 'pending',
    matched_at timestamptz,
    supplier_order_no varchar(50),
    warehouse varchar(100),
    order_id_key uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 21. return_receipt_records
-- ============================================================
CREATE TABLE IF NOT EXISTS return_receipt_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id varchar(36) NOT NULL,
    supplier_name varchar(100),
    product_id uuid,
    quantity integer,
    price numeric(12,2),
    file_url text NOT NULL,
    file_name varchar(100),
    total_count integer DEFAULT 0,
    matched_count integer DEFAULT 0,
    unmatched_count integer DEFAULT 0,
    imported_by varchar(50),
    imported_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    supplier_order_no varchar(50),
    warehouse varchar(100)
);

-- ============================================================
-- 22. dispatch_records
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatch_records (
    id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
    order_id varchar(36) NOT NULL,
    supplier_id varchar(36) NOT NULL,
    supplier_name varchar(200) NOT NULL,
    warehouse_id varchar(36),
    batch_no varchar(50) NOT NULL,
    dispatch_at timestamptz NOT NULL DEFAULT now(),
    status varchar(20) NOT NULL DEFAULT 'sent',
    items jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 23. export_records
-- ============================================================
CREATE TABLE IF NOT EXISTS export_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type varchar(20) NOT NULL,
    business_type varchar(20),
    supplier_id uuid,
    customer_id uuid,
    order_ids jsonb,
    template_id uuid,
    template_name varchar(100),
    file_url text,
    file_name varchar(255),
    zip_file_url text,
    zip_file_name varchar(255),
    total_count integer DEFAULT 0,
    exported_by varchar(50),
    exported_at timestamptz,
    filter_conditions jsonb,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 24. batch_export_details
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_export_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid NOT NULL,
    order_id uuid,
    supplier_id uuid,
    supplier_name varchar(100),
    file_url text,
    file_name varchar(255),
    status varchar(20) DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 25. column_mappings
-- ============================================================
CREATE TABLE IF NOT EXISTS column_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code varchar(50) NOT NULL,
    mapping_config jsonb NOT NULL DEFAULT '{}',
    header_row integer DEFAULT 0,
    version integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_by varchar(50),
    remark text,
    source_headers jsonb DEFAULT '[]',
    header_fingerprint varchar(64),
    template_signature varchar(64),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 26. alert_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    code varchar(50) NOT NULL UNIQUE,
    type varchar(20) NOT NULL,
    config jsonb NOT NULL DEFAULT '{}',
    priority integer DEFAULT 5,
    is_enabled boolean DEFAULT true,
    notification_channels jsonb,
    description text,
    remark text,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 27. alert_records
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id uuid,
    rule_code varchar(50),
    order_id uuid,
    order_no varchar(50),
    stock_id uuid,
    alert_type varchar(20) NOT NULL,
    alert_level varchar(20) NOT NULL,
    title varchar(200) NOT NULL,
    content text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    is_resolved boolean DEFAULT false,
    resolved_at timestamptz,
    resolved_by varchar(50),
    resolution text,
    customer_code varchar(50),
    product_code varchar(50),
    supplier_id uuid,
    supplier_name varchar(100),
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 28. templates
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(100),
    name varchar(100) NOT NULL,
    description text,
    type varchar(20) NOT NULL,
    target_type varchar(20),
    target_id uuid,
    target_name varchar(100),
    field_mappings jsonb NOT NULL DEFAULT '{}',
    config jsonb NOT NULL DEFAULT '{}',
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 29. template_fields
-- ============================================================
CREATE TABLE IF NOT EXISTS template_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    field_id varchar(50) NOT NULL,
    field_name varchar(50) NOT NULL,
    source_table varchar(50),
    source_field varchar(50),
    is_required boolean DEFAULT false,
    order_num integer DEFAULT 0,
    width integer DEFAULT 100,
    format varchar(50),
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 30. template_links
-- ============================================================
CREATE TABLE IF NOT EXISTS template_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    link_type varchar(20) NOT NULL,
    partner_id uuid NOT NULL,
    partner_name varchar(100),
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 31. agent_configs
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE,
    name varchar(100) NOT NULL,
    type varchar(20) DEFAULT 'custom',
    description text,
    prompt_template text NOT NULL,
    model varchar(50) DEFAULT 'doubao-seed',
    temperature numeric(3,2) DEFAULT 0.7,
    max_tokens integer DEFAULT 2000,
    config jsonb,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    test_input text,
    test_output text,
    test_status varchar(20),
    run_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    fail_count integer DEFAULT 0,
    avg_duration_ms integer DEFAULT 0,
    last_run_at timestamptz,
    remark text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 32. ai_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid,
    agent_code varchar(50),
    agent_name varchar(100),
    input text NOT NULL,
    output text,
    status varchar(20) DEFAULT 'success',
    duration_ms integer,
    model varchar(50),
    config jsonb,
    metadata jsonb,
    error_message text,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 33. health_check
-- ============================================================
CREATE TABLE IF NOT EXISTS health_check (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    status varchar(20) DEFAULT 'ok',
    message text,
    checked_at timestamptz DEFAULT now()
);

-- ============================================================
-- Insert Default Data
-- ============================================================

-- Default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, data_scope, phone, email) VALUES
('admin', 'admin123', 'admin', 'all', '', ''),
('salesperson', 'sales123', 'salesperson', 'self', '', ''),
('operator', 'operator123', 'operator', 'self', '', '')
ON CONFLICT (username) DO NOTHING;

-- Default roles
INSERT INTO roles (code, name, description, data_scope, is_system) VALUES
('admin', '管理员', '系统管理员', 'all', true),
('salesperson', '业务员', '普通业务员', 'self', true),
('operator', '跟单员', '普通跟单员', 'self', true)
ON CONFLICT (code) DO NOTHING;

-- Default shipping template
INSERT INTO templates (code, name, type, config, is_default) VALUES
('shipping_default', '发货通知单', 'shipping', '{"columns": ["客户订单号", "收货人", "电话", "地址", "商品", "数量", "备注"]}', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Indexes (aligned with 008_api-schema-align.sql)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_sys_order_no ON orders(sys_order_no);
CREATE INDEX IF NOT EXISTS idx_orders_customer_code ON orders(customer_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_stocks_product_code ON stocks(product_code);
CREATE INDEX IF NOT EXISTS idx_stocks_supplier_id ON stocks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stocks_warehouse_id ON stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stocks_product_id ON stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON stocks(status);
CREATE INDEX IF NOT EXISTS idx_alert_records_order_id ON alert_records(order_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_stock_id ON alert_records(stock_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_created_at ON alert_records(created_at);
CREATE INDEX IF NOT EXISTS idx_return_records_order_id ON return_records(order_id);
CREATE INDEX IF NOT EXISTS idx_return_records_tracking_no ON return_records(tracking_no);
CREATE INDEX IF NOT EXISTS idx_order_cost_history_order_id ON order_cost_history(order_id);

-- Schema lock table (for Supabase platform compatibility)
CREATE TABLE IF NOT EXISTS _schema_lock (
    id varchar PRIMARY KEY DEFAULT 'locked',
    locked_at timestamptz DEFAULT now(),
    version varchar DEFAULT '1.0'
);
