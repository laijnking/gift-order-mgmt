-- =====================================================
-- 礼品订单管理系统 - 完整 Schema 对齐迁移脚本
-- 执行顺序: 在已执行 001_schema.sql 等迁移之后执行
-- 作用: 以 API 为准，补全缺失字段，修正类型不一致
-- 执行方式: psql -h 127.0.0.1 -U postgres -d gift_order -f 008_api-schema-align.sql
-- =====================================================

DO $$
DECLARE
    tbl TEXT;
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '开始 API-Schema 对齐迁移...';
    RAISE NOTICE '========================================';

    -- =====================================================
    -- 1. stocks 表：补充 unit_price 列（API 使用 unit_price，但 DB 可能只有 price）
    -- =====================================================
    RAISE NOTICE '[1/N] 处理 stocks 表...';

    BEGIN
        ALTER TABLE stocks ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2);
        RAISE NOTICE '  + unit_price 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ unit_price 列跳过: %', SQLERRM;
    END;

    -- 如果 price 列有数据，迁移到 unit_price
    BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public' AND table_name = 'stocks' AND column_name = 'price')
        THEN
            EXECUTE 'UPDATE stocks SET unit_price = price WHERE price IS NOT NULL AND unit_price IS NULL';
            RAISE NOTICE '  ~ 迁移 price -> unit_price OK';
        END IF;
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ 迁移跳过: %', SQLERRM;
    END;

    -- 添加 in_transit 列（API 插入）
    BEGIN
        ALTER TABLE stocks ADD COLUMN IF NOT EXISTS in_transit INTEGER DEFAULT 0;
        RAISE NOTICE '  + in_transit 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ in_transit 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 2. alert_records 表：补充 API 使用的额外字段
    -- =====================================================
    RAISE NOTICE '[2/N] 处理 alert_records 表...';

    BEGIN
        ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS stock_id UUID;
        RAISE NOTICE '  + stock_id 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ stock_id 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS customer_code VARCHAR(50);
        RAISE NOTICE '  + customer_code 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ customer_code 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS product_code VARCHAR(50);
        RAISE NOTICE '  + product_code 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ product_code 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS supplier_id UUID;
        RAISE NOTICE '  + supplier_id 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ supplier_id 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(100);
        RAISE NOTICE '  + supplier_name 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ supplier_name 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 3. return_receipts 表：修正 record_id 和 supplier_id 类型，并补充字段
    --    API 传入 UUID 字符串，但 DB 可能是 UUID NOT NULL
    -- =====================================================
    RAISE NOTICE '[3/N] 处理 return_receipts 表...';

    -- 先尝试修改为 VARCHAR(36)，去掉 NOT NULL
    BEGIN
        -- 先删除外键约束（如果有）
        EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN record_id TYPE VARCHAR(36)';
        EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN record_id DROP NOT NULL';
        RAISE NOTICE '  ~ record_id -> VARCHAR(36) OK';
    EXCEPTION WHEN others THEN
        BEGIN
            EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN record_id TYPE TEXT';
            EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN record_id DROP NOT NULL';
            RAISE NOTICE '  ~ record_id -> TEXT OK';
        EXCEPTION WHEN others THEN
            RAISE NOTICE '  ~ record_id 类型修改跳过: %', SQLERRM;
        END;
    END;

    BEGIN
        EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN supplier_id TYPE VARCHAR(36)';
        EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN supplier_id DROP NOT NULL';
        RAISE NOTICE '  ~ supplier_id -> VARCHAR(36) OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ supplier_id 类型修改跳过: %', SQLERRM;
    END;

    BEGIN
        EXECUTE 'ALTER TABLE return_receipts ALTER COLUMN order_id TYPE VARCHAR(36)';
        RAISE NOTICE '  ~ order_id -> VARCHAR(36) OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ order_id 类型修改跳过: %', SQLERRM;
    END;

    -- 补充字段
    BEGIN
        ALTER TABLE return_receipts ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(50);
        RAISE NOTICE '  + receipt_no 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ receipt_no 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipts ADD COLUMN IF NOT EXISTS customer_id VARCHAR(36);
        RAISE NOTICE '  + customer_id 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ customer_id 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '  + updated_at 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ updated_at 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 4. orders 表：补充 express_fee, other_fee, returned_at
    -- =====================================================
    RAISE NOTICE '[4/N] 处理 orders 表补充字段...';

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS express_fee NUMERIC(12,2);
        RAISE NOTICE '  + express_fee 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ express_fee 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS other_fee NUMERIC(12,2);
        RAISE NOTICE '  + other_fee 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ other_fee 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '  + returned_at 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ returned_at 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 5. suppliers 表：补充字段
    --    API: contact_person, contact_phone, city, remark
    -- =====================================================
    RAISE NOTICE '[5/N] 处理 suppliers 表...';

    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  + contact_person 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_person 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  + contact_phone 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_phone 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(50);
        RAISE NOTICE '  + city 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ city 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  + remark 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ remark 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 6. warehouses 表：补充字段
    --    API: short_name, contact_person, contact_phone, province, city
    -- =====================================================
    RAISE NOTICE '[6/N] 处理 warehouses 表...';

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
        RAISE NOTICE '  + short_name 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ short_name 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  + contact_person 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_person 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  + contact_phone 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_phone 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS province VARCHAR(50);
        RAISE NOTICE '  + province 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ province 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city VARCHAR(50);
        RAISE NOTICE '  + city 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ city 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 7. customers 表：补充字段
    --    API: contact_person, contact_phone, contact_email, district
    -- =====================================================
    RAISE NOTICE '[7/N] 处理 customers 表...';

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  + contact_person 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_person 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  + contact_phone 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_phone 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);
        RAISE NOTICE '  + contact_email 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ contact_email 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS district VARCHAR(50);
        RAISE NOTICE '  + district 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ district 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 8. return_receipt_records 表：补充 supplier_order_no, warehouse, product_id 等字段
    -- =====================================================
    RAISE NOTICE '[8/N] 处理 return_receipt_records 表...';

    BEGIN
        ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS product_id UUID;
        RAISE NOTICE '  + product_id 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ product_id 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS quantity INTEGER;
        RAISE NOTICE '  + quantity 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ quantity 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
        RAISE NOTICE '  + price 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ price 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS supplier_order_no VARCHAR(50);
        RAISE NOTICE '  + supplier_order_no 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ supplier_order_no 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100);
        RAISE NOTICE '  + warehouse 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ warehouse 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE return_receipt_records ALTER COLUMN supplier_id TYPE VARCHAR(36);
        RAISE NOTICE '  ~ supplier_id -> VARCHAR(36) OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ supplier_id 类型跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 9. dispatch_records 表：补充 warehouse_id, created_at, updated_at
    -- =====================================================
    RAISE NOTICE '[9/N] 处理 dispatch_records 表...';

    BEGIN
        ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(36);
        RAISE NOTICE '  + warehouse_id 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ warehouse_id 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '  + created_at 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ created_at 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE dispatch_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '  + updated_at 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ updated_at 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 10. users 表：补充字段
    --    API: phone, email, remark, data_scope
    -- =====================================================
    RAISE NOTICE '[10/N] 处理 users 表...';

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
        RAISE NOTICE '  + phone 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ phone 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100);
        RAISE NOTICE '  + email 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ email 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  + remark 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ remark 列跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS data_scope VARCHAR(20) DEFAULT 'self';
        RAISE NOTICE '  + data_scope 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ data_scope 列跳过: %', SQLERRM;
    END;

    -- 设置 data_scope 默认值
    UPDATE users SET data_scope = 'all' WHERE role = 'admin' AND (data_scope IS NULL OR data_scope = 'self');
    UPDATE users SET data_scope = 'self' WHERE role != 'admin' AND data_scope IS NULL;

    -- =====================================================
    -- 11. alert_rules 表：补充 remark 字段
    -- =====================================================
    RAISE NOTICE '[11/N] 处理 alert_rules 表...';

    BEGIN
        ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  + remark 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ remark 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 12. products 表：补充 size 字段
    -- =====================================================
    RAISE NOTICE '[12/N] 处理 products 表...';

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(50);
        RAISE NOTICE '  + size 列 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ size 列跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 13. 添加索引（提高查询性能）
    -- =====================================================
    RAISE NOTICE '[13/N] 添加索引...';

    -- orders 索引
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_orders_supplier_id ON orders(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_orders_import_batch ON orders(import_batch);
        CREATE INDEX IF NOT EXISTS idx_orders_assigned_batch ON orders(assigned_batch);
        CREATE INDEX IF NOT EXISTS idx_orders_match_code ON orders(match_code);
        CREATE INDEX IF NOT EXISTS idx_orders_sys_order_no ON orders(sys_order_no);
        RAISE NOTICE '  + orders 索引 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ orders 索引跳过: %', SQLERRM;
    END;

    -- stocks 索引
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_stocks_warehouse_id ON stocks(warehouse_id);
        CREATE INDEX IF NOT EXISTS idx_stocks_status ON stocks(status);
        RAISE NOTICE '  + stocks 索引 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ stocks 索引跳过: %', SQLERRM;
    END;

    -- alert_records 索引
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_alert_records_rule_id ON alert_records(rule_id);
        CREATE INDEX IF NOT EXISTS idx_alert_records_stock_id ON alert_records(stock_id);
        CREATE INDEX IF NOT EXISTS idx_alert_records_alert_type ON alert_records(alert_type);
        CREATE INDEX IF NOT EXISTS idx_alert_records_alert_level ON alert_records(alert_level);
        CREATE INDEX IF NOT EXISTS idx_alert_records_created_at ON alert_records(created_at);
        RAISE NOTICE '  + alert_records 索引 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ alert_records 索引跳过: %', SQLERRM;
    END;

    -- return_records 索引
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_return_records_supplier_id ON return_records(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_return_records_status ON return_records(status);
        RAISE NOTICE '  + return_records 索引 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ return_records 索引跳过: %', SQLERRM;
    END;

    -- order_cost_history 索引
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_order_cost_history_supplier_id ON order_cost_history(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_order_cost_history_customer_code ON order_cost_history(customer_code);
        CREATE INDEX IF NOT EXISTS idx_order_cost_history_order_date ON order_cost_history(order_date);
        CREATE INDEX IF NOT EXISTS idx_order_cost_history_dispatch_batch ON order_cost_history(dispatch_batch);
        RAISE NOTICE '  + order_cost_history 索引 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  ~ order_cost_history 索引跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 完成报告
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'API-Schema 对齐迁移完成！';
    RAISE NOTICE '========================================';

EXCEPTION WHEN others THEN
    RAISE NOTICE '执行过程中出错: %', SQLERRM;
    RAISE NOTICE '部分字段可能未成功添加，请手动检查或重试';
END $$;

-- =====================================================
-- 最终验证查询：输出所有表及其列
-- =====================================================
SELECT
    c.table_name,
    string_agg(c.column_name || ' ' || UPPER(c.data_type) ||
        CASE WHEN c.character_maximum_length IS NOT NULL
             THEN '(' || c.character_maximum_length || ')'
             WHEN c.numeric_precision IS NOT NULL
             THEN '(' || c.numeric_precision ||
                  CASE WHEN c.numeric_scale IS NOT NULL
                       THEN ',' || c.numeric_scale
                       ELSE ''
                  END || ')'
             ELSE ''
        END ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        ', ' ORDER BY c.ordinal_position)
    FILTER (WHERE c.table_schema = 'public')
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name NOT LIKE 'pg_%'
  AND c.table_name NOT LIKE 'sql_%'
GROUP BY c.table_name
ORDER BY c.table_name;
