-- ============================================================
-- 礼品订单管理系统 - 合并初始化脚本（参考用）
--
-- 用途：全新环境的一键初始化（替代逐个执行 000~011）
--       或作为完整 schema 的文档参考。
--
-- 注意：
--   - 本脚本包含完整的建表和索引（不含数据同步）
--   - 如需在已有数据的环境中同步 suppliers 表，
--     请执行: 013_sync_shippers_to_suppliers.sql
--
-- 包含: 000_init.sql ~ 011_fix_shippers_province.sql 的所有建表和索引
-- 日期: 2026-04-24
-- ============================================================

-- 启用 UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users 表（用户表）
-- API 字段: id, username, password_hash, real_name, name, role, department, is_active, phone, email, remark, data_scope, last_login_at, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'operator',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    phone VARCHAR(20),
    email VARCHAR(100),
    remark TEXT,
    data_scope VARCHAR(20) DEFAULT 'self',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. roles 表（角色表）
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    data_scope VARCHAR(20) DEFAULT 'self',
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. permissions 表（权限表）
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    parent_id UUID,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. role_permissions 表（角色权限关联表）
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- ============================================================
-- 5. customers 表（客户档案表）
-- API 字段: id, code, name, type, salesperson_id, salesperson_name, order_taker_id, order_taker_name, contact, contact_person, contact_phone, phone, mobile, address, region, credit_limit, settlement_cycle, status, remark, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) DEFAULT 'normal',
    salesperson_id UUID,
    salesperson_name VARCHAR(50),
    order_taker_id UUID,
    order_taker_name VARCHAR(50),
    contact VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address VARCHAR(500),
    region VARCHAR(50),
    district VARCHAR(50),
    credit_limit NUMERIC(12,2) DEFAULT 0,
    settlement_cycle VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. products 表（商品档案表）
-- API 字段: id, code, barcode, name, brand, category, spec, unit, cost_price, retail_price, lifecycle_status, is_active, remark, length_cm, width_cm, height_cm, weight_kg, volume_factor, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    spec VARCHAR(200),
    unit VARCHAR(20) DEFAULT '台',
    cost_price NUMERIC(12,2) DEFAULT 0,
    retail_price NUMERIC(12,2) DEFAULT 0,
    lifecycle_status VARCHAR(20) DEFAULT '在售',
    is_active BOOLEAN DEFAULT true,
    remark TEXT,
    description TEXT,
    image_url VARCHAR(500),
    length_cm DECIMAL(8,2),
    width_cm DECIMAL(8,2),
    height_cm DECIMAL(8,2),
    weight_kg DECIMAL(8,3),
    volume_factor INTEGER DEFAULT 6000,
    size VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. suppliers 表（供应商档案表）
-- API 字段: id, code, name, short_name, type, contact, contact_person, contact_phone, send_type, province, city, can_jd, express_restrictions, cost_factor, is_active, remark, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    type VARCHAR(20) NOT NULL,
    contact VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    send_type VARCHAR(20) NOT NULL DEFAULT 'download',
    province VARCHAR(50),
    city VARCHAR(50),
    can_jd BOOLEAN DEFAULT false,
    express_restrictions JSONB DEFAULT '[]'::JSONB,
    cost_factor INTEGER DEFAULT 100,
    settlement_type VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- 8. warehouses 表（仓库档案表）
-- API 字段: id, code, name, type, address, contact, phone, province, city, status, remark, short_name, contact_person, contact_phone, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) DEFAULT 'warehouse',
    address VARCHAR(500),
    contact VARCHAR(100),
    phone VARCHAR(20),
    province VARCHAR(50),
    city VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    remark TEXT,
    short_name VARCHAR(100),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. shippers 表（发货方档案表）
-- API 字段: id, code, name, short_name, type, contact_person, contact_phone, province, city, address, send_type, jd_channel_id, pdd_shop_id, can_jd, can_pdd, express_restrictions, settlement_type, cost_factor, is_active, remark, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS shippers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    type VARCHAR(20) NOT NULL DEFAULT 'supplier',
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    province VARCHAR(50),
    city VARCHAR(50),
    address VARCHAR(500),
    region VARCHAR(50),
    contact VARCHAR(100),
    phone VARCHAR(20),
    send_type VARCHAR(20) NOT NULL DEFAULT 'download',
    jd_channel_id VARCHAR(50),
    pdd_shop_id VARCHAR(50),
    can_jd BOOLEAN DEFAULT false,
    can_pdd BOOLEAN DEFAULT false,
    express_restrictions JSONB DEFAULT '[]'::JSONB,
    settlement_type VARCHAR(20),
    cost_factor NUMERIC(5,4),
    api_config JSONB,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    remark TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 10. stocks 表（库存表）
-- API 字段: id, product_id, product_code, product_name, supplier_id, supplier_name, warehouse_id, warehouse_name, quantity, reserved_quantity, unit_price, min_stock, max_stock, status, in_transit, remark, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL,
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(100),
    warehouse_id UUID,
    warehouse_name VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    unit_price NUMERIC(12,2),
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    in_transit INTEGER DEFAULT 0,
    last_stock_in_at TIMESTAMP WITH TIME ZONE,
    last_stock_out_at TIMESTAMP WITH TIME ZONE,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, supplier_id, warehouse_id)
);

-- ============================================================
-- 11. orders 表（订单主表）
-- API 字段: 所有核心字段包括 ext_field_1~20
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sys_order_no VARCHAR(50),
    order_no VARCHAR(100) NOT NULL,
    supplier_order_no VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    receiver_name VARCHAR(100) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    receiver_address TEXT NOT NULL,
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    customer_id UUID,
    customer_code VARCHAR(50),
    customer_name VARCHAR(100),
    salesperson_id UUID,
    salesperson VARCHAR(50),
    operator_id UUID,
    operator_name VARCHAR(50),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    express_company VARCHAR(50),
    tracking_no VARCHAR(100),
    source VARCHAR(20) NOT NULL DEFAULT 'excel',
    import_batch VARCHAR(50),
    assigned_batch VARCHAR(50),
    match_code VARCHAR(20),
    remark TEXT,
    express_requirement VARCHAR(200),
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    warehouse_id VARCHAR(100),
    warehouse VARCHAR(100),
    bill_no VARCHAR(100),
    bill_date VARCHAR(50),
    discount NUMERIC(10,2),
    tax_rate NUMERIC(5,2),
    amount NUMERIC(12,2),
    income_name VARCHAR(100),
    income_amount NUMERIC(12,2),
    invoice_required BOOLEAN,
    express_fee NUMERIC(12,2),
    other_fee NUMERIC(12,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    -- 备用字段
    ext_field_1 TEXT,
    ext_field_2 TEXT,
    ext_field_3 TEXT,
    ext_field_4 TEXT,
    ext_field_5 TEXT,
    ext_field_6 TEXT,
    ext_field_7 TEXT,
    ext_field_8 TEXT,
    ext_field_9 TEXT,
    ext_field_10 TEXT,
    ext_field_11 TEXT,
    ext_field_12 TEXT,
    ext_field_13 TEXT,
    ext_field_14 TEXT,
    ext_field_15 TEXT,
    ext_field_16 TEXT,
    ext_field_17 TEXT,
    ext_field_18 TEXT,
    ext_field_19 TEXT,
    ext_field_20 TEXT
);

-- ============================================================
-- 12. product_mappings 表（商品映射表）
-- API 字段: id, product_id, product_code, product_name, customer_id, customer_code, customer_name, supplier_id, supplier_name, customer_sku, customer_barcode, customer_product_name, price, is_active, remark, mapping_type, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS product_mappings (
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

-- ============================================================
-- 13. templates 表（模板表）
-- API 字段: id, code, name, description, type, target_type, target_id, target_name, field_mappings, config, is_default, is_active, created_at, updated_at
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL,
    target_type VARCHAR(20),
    target_id UUID,
    target_name VARCHAR(100),
    field_mappings JSONB NOT NULL DEFAULT '{}'::JSONB,
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 14. alert_rules 表（预警规则表）
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    priority INTEGER DEFAULT 5,
    is_enabled BOOLEAN DEFAULT true,
    notification_channels JSONB,
    description TEXT,
    remark TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 15. alert_records 表（预警记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID,
    rule_code VARCHAR(50),
    order_id UUID,
    order_no VARCHAR(50),
    stock_id UUID,
    customer_code VARCHAR(50),
    product_code VARCHAR(50),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    alert_type VARCHAR(20) NOT NULL,
    alert_level VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(50),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 16. dispatch_records 表（派发记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatch_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    order_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    batch_no VARCHAR(50) NOT NULL,
    dispatch_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    warehouse_id VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 17. return_records 表（回单记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS return_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    order_no VARCHAR(50),
    express_company VARCHAR(50) NOT NULL,
    tracking_no VARCHAR(100) NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    matched_by VARCHAR(20),
    match_confidence NUMERIC(5,2),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    operator VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 18. return_receipts 表（回单回执表）
-- ============================================================
CREATE TABLE IF NOT EXISTS return_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    record_id VARCHAR(36),
    supplier_id VARCHAR(36) NOT NULL,
    supplier_name VARCHAR(100),
    customer_order_no VARCHAR(50) NOT NULL,
    express_company VARCHAR(50),
    tracking_no VARCHAR(100),
    ship_date DATE,
    quantity INTEGER,
    price NUMERIC(12,2),
    remark TEXT,
    match_status VARCHAR(20) DEFAULT 'pending',
    matched_at TIMESTAMP WITH TIME ZONE,
    receipt_no VARCHAR(50),
    customer_id VARCHAR(36),
    supplier_order_no VARCHAR(50),
    warehouse VARCHAR(100),
    order_id_key UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- 19. return_receipt_records 表（回单回执记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS return_receipt_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id VARCHAR(36) NOT NULL,
    supplier_name VARCHAR(100),
    file_url TEXT NOT NULL,
    file_name VARCHAR(100),
    total_count INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    unmatched_count INTEGER DEFAULT 0,
    imported_by VARCHAR(50),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supplier_order_no VARCHAR(50),
    warehouse VARCHAR(100),
    product_id UUID,
    quantity INTEGER,
    price NUMERIC(12,2)
);

-- ============================================================
-- 20. export_records 表（导出记录表）
-- ============================================================
CREATE TABLE IF NOT EXISTS export_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type VARCHAR(20) NOT NULL,
    business_type VARCHAR(20),
    supplier_id UUID,
    customer_id UUID,
    order_ids TEXT[],
    template_id UUID,
    template_name VARCHAR(100),
    file_url TEXT,
    file_name VARCHAR(255),
    zip_file_url TEXT,
    zip_file_name VARCHAR(255),
    total_count INTEGER DEFAULT 0,
    exported_by VARCHAR(50),
    exported_at TIMESTAMP WITH TIME ZONE,
    filter_conditions JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 21. batch_export_details 表（批量导出明细表）
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_export_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL,
    order_id UUID,
    supplier_id UUID,
    supplier_name VARCHAR(100),
    file_url TEXT,
    file_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 22. order_cost_history 表（历史成本库表）
-- ============================================================
CREATE TABLE IF NOT EXISTS order_cost_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    order_no VARCHAR(50),
    match_code VARCHAR(50),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    warehouse_id UUID,
    warehouse_name VARCHAR(100),
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    quantity INTEGER,
    unit_cost NUMERIC(12,2),
    total_cost NUMERIC(12,2),
    express_fee NUMERIC(12,2),
    other_fee NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    express_company VARCHAR(50),
    tracking_no VARCHAR(100),
    receiver_name VARCHAR(50),
    receiver_phone VARCHAR(20),
    receiver_address VARCHAR(500),
    customer_code VARCHAR(50),
    customer_name VARCHAR(100),
    salesperson VARCHAR(50),
    operator_name VARCHAR(50),
    order_date DATE,
    shipped_date DATE,
    returned_date DATE,
    dispatch_batch VARCHAR(50),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id, supplier_id, product_code)
);

-- ============================================================
-- 23. stock_versions 表（库存版本历史表）
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID,
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    warehouse_id UUID,
    warehouse_name VARCHAR(100),
    before_quantity INTEGER,
    after_quantity INTEGER,
    change_quantity INTEGER,
    before_price NUMERIC(12,2),
    after_price NUMERIC(12,2),
    change_price NUMERIC(12,2),
    change_type VARCHAR(20) NOT NULL,
    change_reason TEXT,
    reference_id VARCHAR(50),
    operator VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 24. price_history 表（价格历史表）
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(50),
    product_name VARCHAR(200),
    supplier_id UUID,
    supplier_name VARCHAR(100),
    before_price NUMERIC(12,2),
    after_price NUMERIC(12,2),
    change_price NUMERIC(12,2),
    change_type VARCHAR(20) NOT NULL,
    change_reason TEXT,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    operator VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 25. column_mappings 表（列映射表）
-- ============================================================
CREATE TABLE IF NOT EXISTS column_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) NOT NULL,
    mapping_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    header_row INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(50),
    remark TEXT,
    source_headers JSONB DEFAULT '[]'::JSONB,
    header_fingerprint VARCHAR(64),
    template_signature VARCHAR(64),
    feedback_export_headers JSONB DEFAULT '{}'::JSONB
);

-- ============================================================
-- 26. password_reset_codes 表（密码重置验证码表）
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(100) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 27. sku_mappings 表（SKU映射表，兼容旧系统）
-- ============================================================
CREATE TABLE IF NOT EXISTS sku_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    customer_code VARCHAR,
    product_id UUID,
    product_code VARCHAR,
    customer_sku VARCHAR,
    customer_barcode VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 28. template_fields 表（模板字段表）
-- ============================================================
CREATE TABLE IF NOT EXISTS template_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    field_id VARCHAR(50) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    source_table VARCHAR(50),
    source_field VARCHAR(50),
    is_required BOOLEAN DEFAULT false,
    order_num INTEGER DEFAULT 0,
    width INTEGER DEFAULT 100,
    format VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 29. template_links 表（模板关联表）
-- ============================================================
CREATE TABLE IF NOT EXISTS template_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    link_type VARCHAR(20) NOT NULL,
    partner_id UUID NOT NULL,
    partner_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 30. agent_configs 表（AI Agent配置表）
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'custom',
    description TEXT,
    prompt_template TEXT NOT NULL,
    model VARCHAR(50) DEFAULT 'doubao-seed',
    temperature NUMERIC(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    config JSONB,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    test_input TEXT,
    test_output TEXT,
    test_status VARCHAR(20),
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,
    last_run_at TIMESTAMP WITHOUT TIME ZONE,
    remark TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 31. ai_logs 表（AI调用日志表）
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID,
    agent_code VARCHAR(50),
    agent_name VARCHAR(100),
    input TEXT NOT NULL,
    output TEXT,
    status VARCHAR(20) DEFAULT 'success',
    duration_ms INTEGER,
    model VARCHAR(50),
    config JSONB,
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 32. health_check 表（健康检查表）
-- ============================================================
CREATE TABLE IF NOT EXISTS health_check (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) DEFAULT 'ok',
    message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 33. customer_product_mappings 表（客户商品映射表）
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    customer_code VARCHAR(50),
    customer_name VARCHAR(100),
    customer_product_code VARCHAR(50),
    customer_product_name VARCHAR(200) NOT NULL,
    customer_product_model VARCHAR(200),
    product_id UUID,
    product_code VARCHAR(50),
    product_name VARCHAR(100),
    product_model VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 34. product_customer_mappings 表（商品客户映射表）
-- ============================================================
CREATE TABLE IF NOT EXISTS product_customer_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID,
    customer_id UUID,
    customer_product_code VARCHAR(50),
    customer_product_name VARCHAR(100),
    supplier_product_code VARCHAR(50),
    supplier_product_name VARCHAR(100),
    price NUMERIC(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- Schema 锁定表（Supabase 平台兼容性）
-- ============================================================
CREATE TABLE IF NOT EXISTS _schema_lock (
    id varchar PRIMARY KEY DEFAULT 'locked',
    locked_at timestamptz DEFAULT now(),
    version varchar DEFAULT '1.0'
);

-- ============================================================
-- 索 引
-- ============================================================

-- customers 索引
CREATE INDEX IF NOT EXISTS idx_customers_salesperson ON customers(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_customers_order_taker ON customers(order_taker_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- products 索引
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- suppliers 索引
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_type ON suppliers(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- warehouses 索引
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);

-- shippers 索引
CREATE INDEX IF NOT EXISTS idx_shippers_code ON shippers(code);
CREATE INDEX IF NOT EXISTS idx_shippers_type ON shippers(type);
CREATE INDEX IF NOT EXISTS idx_shippers_active ON shippers(is_active);

-- stocks 索引
CREATE INDEX IF NOT EXISTS idx_stocks_product ON stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_supplier ON stocks(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stocks_warehouse ON stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stocks_status ON stocks(status);

-- orders 索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_code ON orders(customer_code);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_import_batch ON orders(import_batch);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_batch ON orders(assigned_batch);
CREATE INDEX IF NOT EXISTS idx_orders_match_code ON orders(match_code);
CREATE INDEX IF NOT EXISTS idx_orders_sys_order_no ON orders(sys_order_no);

-- product_mappings 索引
CREATE INDEX IF NOT EXISTS idx_pm_product_id ON product_mappings(product_id);
CREATE INDEX IF NOT EXISTS idx_pm_customer_id ON product_mappings(customer_id);
CREATE INDEX IF NOT EXISTS idx_pm_supplier_id ON product_mappings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pm_customer_code ON product_mappings(customer_code);
CREATE INDEX IF NOT EXISTS idx_pm_product_code ON product_mappings(product_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pm_unique_mapping ON product_mappings(customer_id, customer_product_code);

-- templates 索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_code_unique ON templates(code);
CREATE INDEX IF NOT EXISTS idx_templates_type_active ON templates(type, is_active);
CREATE INDEX IF NOT EXISTS idx_templates_target ON templates(target_type, target_id);

-- alert_records 索引
CREATE INDEX IF NOT EXISTS idx_alert_records_order ON alert_records(order_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_resolved ON alert_records(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alert_records_rule_id ON alert_records(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_stock_id ON alert_records(stock_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_alert_type ON alert_records(alert_type);

-- return_records 索引
CREATE INDEX IF NOT EXISTS idx_return_records_order ON return_records(order_id);
CREATE INDEX IF NOT EXISTS idx_return_records_tracking ON return_records(tracking_no);
CREATE INDEX IF NOT EXISTS idx_return_records_supplier ON return_records(supplier_id);
CREATE INDEX IF NOT EXISTS idx_return_records_status ON return_records(status);

-- order_cost_history 索引
CREATE INDEX IF NOT EXISTS idx_order_cost_history_supplier ON order_cost_history(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_cost_history_customer_code ON order_cost_history(customer_code);
CREATE INDEX IF NOT EXISTS idx_order_cost_history_order_date ON order_cost_history(order_date);
CREATE INDEX IF NOT EXISTS idx_order_cost_history_dispatch ON order_cost_history(dispatch_batch);

-- stock_versions 索引
CREATE INDEX IF NOT EXISTS idx_stock_versions_stock ON stock_versions(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_versions_created ON stock_versions(created_at);

-- column_mappings 索引
CREATE INDEX IF NOT EXISTS idx_column_mappings_customer_active ON column_mappings(customer_code, is_active);
CREATE INDEX IF NOT EXISTS idx_column_mappings_header_fingerprint ON column_mappings(header_fingerprint);
CREATE INDEX IF NOT EXISTS idx_column_mappings_template_signature ON column_mappings(template_signature);

-- password_reset_codes 索引
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);

-- ai_logs 索引
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent ON ai_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at);

-- ============================================================
-- 种子数据：默认用户
-- ============================================================

-- 默认管理员用户 (密码均为 123456 的 bcrypt 哈希，预览用)
INSERT INTO users (id, username, password_hash, real_name, role, is_active, data_scope)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', '$2a$10$xJx.QzPQEL8Pz6H8GvX5YOK1X9Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', '系统管理员', 'admin', true, 'all'),
    ('00000000-0000-0000-0000-000000000002', 'salesperson', '$2a$10$xJx.QzPQEL8Pz6H8GvX5YOK1X9Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', '业务员', 'salesperson', true, 'self'),
    ('00000000-0000-0000-0000-000000000003', 'operator', '$2a$10$xJx.QzPQEL8Pz6H8GvX5YOK1X9Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', '跟单员', 'operator', true, 'self')
ON CONFLICT (username) DO NOTHING;

-- 默认角色
INSERT INTO roles (id, code, name, description, data_scope, is_system)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'admin', '管理员', '系统管理员，拥有全部权限', 'all', true),
    ('b0000000-0000-0000-0000-000000000002', 'salesperson', '业务员', '普通业务员，仅查看本人客户订单', 'self', true),
    ('b0000000-0000-0000-0000-000000000003', 'operator', '跟单员', '普通跟单员，仅查看本人跟单订单', 'self', true),
    ('b0000000-0000-0000-0000-000000000004', 'sales_manager', '销售主管', '销售主管，可查看本部门数据', 'department', true),
    ('b0000000-0000-0000-0000-000000000005', 'finance', '财务', '财务人员，可查看全部数据', 'all', true)
ON CONFLICT (code) DO NOTHING;

-- 默认发货通知模板
INSERT INTO templates (id, name, type, config, is_default, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', '标准发货通知单', 'shipping', '{"columns": [{"field": "order_no", "label": "客户订单号", "width": 20}, {"field": "receiver_name", "label": "收货人", "width": 10}, {"field": "receiver_phone", "label": "联系电话", "width": 15}, {"field": "receiver_address", "label": "收货地址", "width": 40}, {"field": "product_name", "label": "商品名称", "width": 30}, {"field": "quantity", "label": "数量", "width": 8}]}', true, true),
    ('c0000000-0000-0000-0000-000000000002', '详细发货通知单', 'shipping', '{"columns": [{"field": "order_no", "label": "客户订单号", "width": 20}, {"field": "bill_no", "label": "单据编号", "width": 20}, {"field": "receiver_name", "label": "收货人", "width": 10}, {"field": "receiver_phone", "label": "联系电话", "width": 15}, {"field": "receiver_address", "label": "收货地址", "width": 40}, {"field": "product_name", "label": "商品名称", "width": 30}, {"field": "product_spec", "label": "规格型号", "width": 20}, {"field": "quantity", "label": "数量", "width": 8}, {"field": "remark", "label": "备注", "width": 20}]}', false, true)
ON CONFLICT DO NOTHING;

-- 预设预警规则
INSERT INTO alert_rules (id, name, code, type, config, priority, is_enabled, description)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '库存不足预警', 'LOW_STOCK_ALERT', 'stock', '{"threshold": 2, "compare": "lte"}', 5, true, '当库存≤2台时触发预警'),
    ('a0000000-0000-0000-0000-000000000002', '订单超时预警', 'ORDER_TIMEOUT_ALERT', 'order', '{"timeout_hours": 24}', 3, true, '订单待处理超过24小时触发预警'),
    ('a0000000-0000-0000-0000-000000000003', '回单超时预警', 'RETURN_DELAY_ALERT', 'return', '{"delay_hours": 48}', 4, true, '发货后48小时未回单触发预警')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- COMMENT 说明
-- ============================================================

-- suppliers 表说明
COMMENT ON TABLE suppliers IS '供应商档案表（业务层实际使用）。通过 type 字段区分类型：supplier/jd/self/third_party。';
COMMENT ON COLUMN suppliers.id IS '主键UUID';
COMMENT ON COLUMN suppliers.code IS '供应商编码';
COMMENT ON COLUMN suppliers.name IS '供应商名称';
COMMENT ON COLUMN suppliers.short_name IS '简称';
COMMENT ON COLUMN suppliers.type IS '类型：supplier(供应商)/jd(京东)/self(自有仓)/third_party(第三方仓)';
COMMENT ON COLUMN suppliers.contact IS '联系人姓名';
COMMENT ON COLUMN suppliers.contact_person IS '联系人姓名（与contact同义，优先使用此字段）';
COMMENT ON COLUMN suppliers.contact_phone IS '联系电话';
COMMENT ON COLUMN suppliers.send_type IS '发货方式：download/jd/pdd/self';
COMMENT ON COLUMN suppliers.province IS '所在省份';
COMMENT ON COLUMN suppliers.city IS '所在城市';
COMMENT ON COLUMN suppliers.can_jd IS '是否支持京东发货';
COMMENT ON COLUMN suppliers.express_restrictions IS '禁止使用的快递列表（JSON数组）';
COMMENT ON COLUMN suppliers.cost_factor IS '成本系数（百分比，如100表示1.0）';
COMMENT ON COLUMN suppliers.is_active IS '是否启用';
COMMENT ON COLUMN suppliers.remark IS '备注';

-- shippers 表说明
COMMENT ON TABLE shippers IS '发货方档案表（前端发货方管理页面使用）。与 suppliers 表功能有重叠，详见 011_schema_clarification 说明。';
COMMENT ON COLUMN shippers.code IS '发货方编码（与 suppliers.code 对应）';
COMMENT ON COLUMN shippers.name IS '发货方名称（与 suppliers.name 对应）';
COMMENT ON COLUMN shippers.type IS '类型：supplier/jd/pdd/self/third_party（与 suppliers.type 对应）';
COMMENT ON COLUMN shippers.send_type IS '发货方式（与 suppliers.send_type 对应）';
COMMENT ON COLUMN shippers.jd_channel_id IS '京东渠道ID（仅 type=jd 时有效）';
COMMENT ON COLUMN shippers.pdd_shop_id IS '拼多多店铺ID（仅 type=pdd 时有效）';
COMMENT ON COLUMN shippers.can_jd IS '是否支持京东发货';
COMMENT ON COLUMN shippers.can_pdd IS '是否支持拼多多发货';
COMMENT ON COLUMN shippers.express_restrictions IS '禁止使用的快递列表（JSON数组）';
COMMENT ON COLUMN shippers.settlement_type IS '结算方式';
COMMENT ON COLUMN shippers.cost_factor IS '成本系数';
COMMENT ON COLUMN shippers.province IS '所在省份';
COMMENT ON COLUMN shippers.city IS '所在城市';
COMMENT ON COLUMN shippers.short_name IS '简称';
COMMENT ON COLUMN shippers.contact_person IS '联系人';
COMMENT ON COLUMN shippers.contact_phone IS '联系电话';
COMMENT ON COLUMN shippers.address IS '详细地址';
COMMENT ON COLUMN shippers.is_active IS '是否启用';

-- stocks 表说明
COMMENT ON TABLE stocks IS '库存档案表';
COMMENT ON COLUMN stocks.supplier_id IS '关联 suppliers.id（供应商/发货方档案ID）';
COMMENT ON COLUMN stocks.supplier_name IS '供应商/发货方名称（冗余存储，便于展示）';
COMMENT ON COLUMN stocks.warehouse_id IS '关联 warehouses.id（仓库ID，可为空）';
COMMENT ON COLUMN stocks.warehouse_name IS '仓库名称（冗余存储）';
COMMENT ON COLUMN stocks.quantity IS '当前库存数量';
COMMENT ON COLUMN stocks.reserved_quantity IS '预占数量（订单占用但未出库）';
COMMENT ON COLUMN stocks.available_quantity IS '可用数量 = quantity - reserved_quantity';
COMMENT ON COLUMN stocks.unit_price IS '单价';
COMMENT ON COLUMN stocks.min_stock IS '最低库存预警阈值';
COMMENT ON COLUMN stocks.max_stock IS '最高库存阈值';
COMMENT ON COLUMN stocks.status IS '状态：active/inactive';

-- product_mappings 表说明
COMMENT ON TABLE product_mappings IS '商品映射档案表，支持客户映射和供应商映射。mapping_type 字段区分类型。';
COMMENT ON COLUMN product_mappings.product_id IS '关联 products.id（系统商品ID）';
COMMENT ON COLUMN product_mappings.product_code IS '系统商品编码';
COMMENT ON COLUMN product_mappings.product_name IS '系统商品名称';
COMMENT ON COLUMN product_mappings.customer_id IS '关联 customers.id（仅 mapping_type=customer 时有效）';
COMMENT ON COLUMN product_mappings.customer_code IS '客户编码';
COMMENT ON COLUMN product_mappings.customer_name IS '客户名称';
COMMENT ON COLUMN product_mappings.supplier_id IS '关联 suppliers.id（仅 mapping_type=supplier 时有效）';
COMMENT ON COLUMN product_mappings.supplier_name IS '供应商名称';
COMMENT ON COLUMN product_mappings.customer_sku IS '客户/供应商商品SKU编码';
COMMENT ON COLUMN product_mappings.customer_barcode IS '客户/供应商商品条码';
COMMENT ON COLUMN product_mappings.customer_product_name IS '客户/供应商商品名称（品名）';
COMMENT ON COLUMN product_mappings.price IS '客户/供应商采购价格';
COMMENT ON COLUMN product_mappings.mapping_type IS '映射类型：customer（客户商品映射）/supplier（供应商商品映射）';
COMMENT ON COLUMN product_mappings.is_active IS '是否启用（默认 true）';

-- column_mappings 表说明
COMMENT ON COLUMN column_mappings.feedback_export_headers IS 'Feedback export column name mapping: { "客户列名": "系统字段名" }. Used to restore customer original column names when exporting feedback forms.';

-- password_reset_codes 表说明
COMMENT ON TABLE password_reset_codes IS 'Stores temporary verification codes for password reset functionality';
COMMENT ON COLUMN password_reset_codes.code IS '6-digit verification code';
COMMENT ON COLUMN password_reset_codes.expires_at IS 'Code expiration time, typically 10 minutes after creation';
COMMENT ON COLUMN password_reset_codes.used_at IS 'Timestamp when code was used, NULL if not yet used';

-- ============================================================
-- 完成
-- ============================================================
SELECT 'Database schema created successfully!' AS message;
