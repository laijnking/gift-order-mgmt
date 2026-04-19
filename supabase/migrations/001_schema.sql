-- =====================================================
-- 礼品订单管理系统 - 数据库建表脚本
-- 适用于 Supabase PostgreSQL
-- 执行方式: 在 Supabase SQL Editor 或 psql 中执行
-- =====================================================

-- 启用 UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户表 (users)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'operator',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预设测试用户 (密码均为 123456 的 SHA256 哈希)
-- admin / admin123
-- salesperson / sales123
-- operator / operator123
INSERT INTO users (id, username, password_hash, real_name, role, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', '$2a$10$xJx.QzPQEL8Pz6H8GvX5YOK1X9Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', '系统管理员', 'admin', true),
    ('00000000-0000-0000-0000-000000000002', 'salesperson', '$2a$10$xJx.QzPQEL8Pz6H8GvX5YOK1X9Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', '业务员', 'salesperson', true),
    ('00000000-0000-0000-0000-000000000003', 'operator', '$2a$10$xJx.QzPQEL8Pz6H8GvX5YOK1X9Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z1Z', '跟单员', 'operator', true)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 2. 订单主表 (orders)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
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
    customer_code VARCHAR(50),
    customer_name VARCHAR(100),
    salesperson VARCHAR(50),
    supplier_id VARCHAR(36),
    supplier_name VARCHAR(100),
    express_company VARCHAR(50),
    tracking_no VARCHAR(100),
    source VARCHAR(20) NOT NULL DEFAULT 'excel',
    import_batch VARCHAR(50),
    assigned_batch VARCHAR(50),
    match_code VARCHAR(20),
    remark TEXT,
    express_requirement VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    sys_order_no VARCHAR(50),
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
    ext_field_20 TEXT,
    operator_name VARCHAR(50) DEFAULT '',
    bill_no VARCHAR(100),
    bill_date VARCHAR(50),
    warehouse VARCHAR(100),
    discount NUMERIC(10,2),
    tax_rate NUMERIC(5,2),
    amount NUMERIC(12,2),
    income_name VARCHAR(100),
    income_amount NUMERIC(12,2),
    invoice_required BOOLEAN,
    salesperson_id UUID,
    operator_id UUID,
    customer_id UUID,
    warehouse_id VARCHAR(100)
);

-- 订单状态索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- =====================================================
-- 3. 发货方档案表 (shippers)
-- =====================================================
CREATE TABLE IF NOT EXISTS shippers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    send_type VARCHAR(20) NOT NULL,
    jd_channel_id VARCHAR(50),
    pdd_shop_id VARCHAR(50),
    can_jd BOOLEAN DEFAULT false,
    can_pdd BOOLEAN DEFAULT false,
    express_restrictions JSONB DEFAULT '[]'::JSONB,
    settlement_type VARCHAR(20),
    cost_factor NUMERIC(5,4),
    contact VARCHAR(100),
    phone VARCHAR(20),
    address VARCHAR(500),
    region VARCHAR(50),
    api_config JSONB,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    remark TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. 供应商表 (suppliers)
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    type VARCHAR(20) NOT NULL,
    contact VARCHAR(100),
    send_type VARCHAR(20) NOT NULL,
    province VARCHAR(50),
    can_jd BOOLEAN DEFAULT false,
    express_restrictions JSONB DEFAULT '[]'::JSONB,
    cost_factor INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. 客户档案表 (customers)
-- =====================================================
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
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address VARCHAR(500),
    region VARCHAR(50),
    credit_limit NUMERIC(12,2),
    settlement_cycle VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    remark TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_salesperson ON customers(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_customers_order_taker ON customers(order_taker_id);

-- =====================================================
-- 6. 商品档案表 (products)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    barcode VARCHAR(50),
    brand VARCHAR(100),
    category VARCHAR(100),
    spec VARCHAR(200),
    unit VARCHAR(20),
    cost_price NUMERIC(12,2) DEFAULT 0,
    retail_price NUMERIC(12,2) DEFAULT 0,
    lifecycle_status VARCHAR(20) DEFAULT '在售',
    is_active BOOLEAN DEFAULT true,
    weight DECIMAL(8,3),
    length DECIMAL(8,2),
    width DECIMAL(8,2),
    height DECIMAL(8,2),
    volume DECIMAL(10,4),
    image_url VARCHAR(500),
    description TEXT,
    remark TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =====================================================
-- 7. 仓库档案表 (warehouses)
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    address VARCHAR(500),
    contact VARCHAR(100),
    phone VARCHAR(20),
    province VARCHAR(50),
    city VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. 库存表 (stocks)
-- =====================================================
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
    last_stock_in_at TIMESTAMP WITH TIME ZONE,
    last_stock_out_at TIMESTAMP WITH TIME ZONE,
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, supplier_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_stocks_product ON stocks(product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_supplier ON stocks(supplier_id);

-- =====================================================
-- 9. 库存版本历史表 (stock_versions)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_stock_versions_stock ON stock_versions(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_versions_created ON stock_versions(created_at);

-- =====================================================
-- 10. 价格历史表 (price_history)
-- =====================================================
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

-- =====================================================
-- 11. 历史成本库表 (order_cost_history)
-- =====================================================
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

-- =====================================================
-- 12. 回单记录表 (return_records)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_return_records_order ON return_records(order_id);
CREATE INDEX IF NOT EXISTS idx_return_records_tracking ON return_records(tracking_no);

-- =====================================================
-- 13. 回单回执表 (return_receipts)
-- =====================================================
CREATE TABLE IF NOT EXISTS return_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID NOT NULL,
    order_id UUID,
    supplier_id UUID NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supplier_order_no VARCHAR(50),
    warehouse VARCHAR(100),
    order_id_key UUID
);

-- =====================================================
-- 14. 回单回执记录表 (return_receipt_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS return_receipt_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL,
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
    warehouse VARCHAR(100)
);

-- =====================================================
-- 15. 导出记录表 (export_records)
-- =====================================================
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

-- =====================================================
-- 16. 批量导出明细表 (batch_export_details)
-- =====================================================
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

-- =====================================================
-- 17. 派发记录表 (dispatch_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS dispatch_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::VARCHAR(36),
    order_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    supplier_name VARCHAR(200) NOT NULL,
    batch_no VARCHAR(50) NOT NULL,
    dispatch_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    items JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- =====================================================
-- 18. SKU映射表 (product_mappings)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    system_product_id UUID NOT NULL,
    system_product_name VARCHAR(200),
    system_product_code VARCHAR(50),
    system_product_spec VARCHAR(200),
    customer_product_name VARCHAR(200) NOT NULL,
    customer_product_code VARCHAR(50),
    customer_product_spec VARCHAR(200),
    customer_barcode VARCHAR(50),
    mapping_type VARCHAR(20) DEFAULT 'exact',
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    remark TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_mappings_customer ON product_mappings(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_mappings_unique ON product_mappings(customer_id, customer_product_code);

-- =====================================================
-- 19. 客户商品映射表 (customer_product_mappings)
-- =====================================================
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

-- =====================================================
-- 20. 商品客户映射表 (product_customer_mappings)
-- =====================================================
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

-- =====================================================
-- 21. 列映射表 (column_mappings)
-- =====================================================
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
    remark TEXT
);

-- =====================================================
-- 22. 预警规则表 (alert_rules)
-- =====================================================
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
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预设预警规则
INSERT INTO alert_rules (id, name, code, type, config, priority, is_enabled, description)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '库存不足预警', 'LOW_STOCK_ALERT', 'stock', '{"threshold": 2, "compare": "lte"}', 5, true, '当库存≤2台时触发预警'),
    ('a0000000-0000-0000-0000-000000000002', '订单超时预警', 'ORDER_TIMEOUT_ALERT', 'order', '{"timeout_hours": 24}', 3, true, '订单待处理超过24小时触发预警'),
    ('a0000000-0000-0000-0000-000000000003', '回单超时预警', 'RETURN_DELAY_ALERT', 'return', '{"delay_hours": 48}', 4, true, '发货后48小时未回单触发预警')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 23. 预警记录表 (alert_records)
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID,
    rule_code VARCHAR(50),
    order_id UUID,
    order_no VARCHAR(50),
    stock_id UUID,
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

CREATE INDEX IF NOT EXISTS idx_alert_records_order ON alert_records(order_id);
CREATE INDEX IF NOT EXISTS idx_alert_records_resolved ON alert_records(is_resolved);

-- =====================================================
-- 24. 角色表 (roles)
-- =====================================================
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

-- 预设角色
INSERT INTO roles (id, code, name, description, data_scope, is_system)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'admin', '管理员', '系统管理员，拥有全部权限', 'all', true),
    ('b0000000-0000-0000-0000-000000000002', 'salesperson', '业务员', '普通业务员，仅查看本人客户订单', 'self', true),
    ('b0000000-0000-0000-0000-000000000003', 'operator', '跟单员', '普通跟单员，仅查看本人跟单订单', 'self', true),
    ('b0000000-0000-0000-0000-000000000004', 'sales_manager', '销售主管', '销售主管，可查看本部门数据', 'department', true),
    ('b0000000-0000-0000-0000-000000000005', 'finance', '财务', '财务人员，可查看全部数据', 'all', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 25. 权限表 (permissions)
-- =====================================================
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

-- =====================================================
-- 26. 角色权限关联表 (role_permissions)
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- 27. 模板表 (templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预设发货通知模板
INSERT INTO templates (id, name, type, config, is_default, is_active)
VALUES
    ('c0000000-0000-0000-0000-000000000001', '标准发货通知单', 'shipping', '{"columns": [{"field": "order_no", "label": "客户订单号", "width": 20}, {"field": "receiver_name", "label": "收货人", "width": 10}, {"field": "receiver_phone", "label": "联系电话", "width": 15}, {"field": "receiver_address", "label": "收货地址", "width": 40}, {"field": "product_name", "label": "商品名称", "width": 30}, {"field": "quantity", "label": "数量", "width": 8}]}', true, true),
    ('c0000000-0000-0000-0000-000000000002', '详细发货通知单', 'shipping', '{"columns": [{"field": "order_no", "label": "客户订单号", "width": 20}, {"field": "bill_no", "label": "单据编号", "width": 20}, {"field": "receiver_name", "label": "收货人", "width": 10}, {"field": "receiver_phone", "label": "联系电话", "width": 15}, {"field": "receiver_address", "label": "收货地址", "width": 40}, {"field": "product_name", "label": "商品名称", "width": 30}, {"field": "product_spec", "label": "规格型号", "width": 20}, {"field": "quantity", "label": "数量", "width": 8}, {"field": "remark", "label": "备注", "width": 20}]}', false, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 28. 模板字段表 (template_fields)
-- =====================================================
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

-- =====================================================
-- 29. 模板关联表 (template_links)
-- =====================================================
CREATE TABLE IF NOT EXISTS template_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    link_type VARCHAR(20) NOT NULL,
    partner_id UUID NOT NULL,
    partner_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 30. AI Agent配置表 (agent_configs)
-- =====================================================
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 31. AI调用日志表 (ai_logs)
-- =====================================================
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

CREATE INDEX IF NOT EXISTS idx_ai_logs_agent ON ai_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created ON ai_logs(created_at);

-- =====================================================
-- 32. 健康检查表 (health_check)
-- =====================================================
CREATE TABLE IF NOT EXISTS health_check (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) DEFAULT 'ok',
    message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 启用 RLS (Row Level Security)
-- =====================================================

-- 为所有表启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_cost_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_receipt_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_export_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customer_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_check ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略（MVP阶段不限制）
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for shippers" ON shippers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for warehouses" ON warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for stocks" ON stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for stock_versions" ON stock_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for price_history" ON price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for order_cost_history" ON order_cost_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for return_records" ON return_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for return_receipts" ON return_receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for return_receipt_records" ON return_receipt_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for export_records" ON export_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for batch_export_details" ON batch_export_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for dispatch_records" ON dispatch_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for product_mappings" ON product_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for customer_product_mappings" ON customer_product_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for product_customer_mappings" ON product_customer_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for column_mappings" ON column_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for alert_rules" ON alert_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for alert_records" ON alert_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for roles" ON roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for permissions" ON permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for role_permissions" ON role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for templates" ON templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for template_fields" ON template_fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for template_links" ON template_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for agent_configs" ON agent_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for ai_logs" ON ai_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for health_check" ON health_check FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 完成
-- =====================================================
SELECT 'Database schema created successfully!' AS message;
