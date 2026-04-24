-- =====================================================
-- 礼品订单管理系统 - 完整字段同步脚本
-- 解决开发环境与线上环境数据库不一致问题
-- 适用：测试环境和生产环境
-- =====================================================

DO $$
DECLARE
    missing_cols TEXT[];
    tbl TEXT;
    col TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '开始数据库字段同步...';
    RAISE NOTICE '========================================';

    -- =====================================================
    -- 1. users 表字段扩展
    -- =====================================================
    RAISE NOTICE '[1/10] 处理 users 表...';

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
        RAISE NOTICE '  - phone 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - phone 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100);
        RAISE NOTICE '  - email 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - email 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  - remark 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - remark 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS data_scope VARCHAR(20) DEFAULT 'self';
        RAISE NOTICE '  - data_scope 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - data_scope 字段添加跳过: %', SQLERRM;
    END;

    -- 设置默认值
    UPDATE users SET data_scope = 'all' WHERE role = 'admin' AND (data_scope IS NULL OR data_scope = 'self');
    UPDATE users SET data_scope = 'self' WHERE role != 'admin' AND data_scope IS NULL;

    -- =====================================================
    -- 2. products 表字段修复
    -- =====================================================
    RAISE NOTICE '[2/10] 处理 products 表...';

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  - remark 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - remark 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2);
        RAISE NOTICE '  - length_cm 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - length_cm 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2);
        RAISE NOTICE '  - width_cm 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - width_cm 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2);
        RAISE NOTICE '  - height_cm 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - height_cm 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,3);
        RAISE NOTICE '  - weight_kg 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - weight_kg 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_factor INTEGER DEFAULT 6000;
        RAISE NOTICE '  - volume_factor 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - volume_factor 字段添加跳过: %', SQLERRM;
    END;

    -- 迁移旧字段到新字段（如果存在旧字段且新字段为空）
    BEGIN
        EXECUTE 'UPDATE products SET length_cm = length WHERE length IS NOT NULL AND length_cm IS NULL';
        RAISE NOTICE '  - 迁移 length -> length_cm OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 length 跳过: %', SQLERRM;
    END;

    BEGIN
        EXECUTE 'UPDATE products SET width_cm = width WHERE width IS NOT NULL AND width_cm IS NULL';
        RAISE NOTICE '  - 迁移 width -> width_cm OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 width 跳过: %', SQLERRM;
    END;

    BEGIN
        EXECUTE 'UPDATE products SET height_cm = height WHERE height IS NOT NULL AND height_cm IS NULL';
        RAISE NOTICE '  - 迁移 height -> height_cm OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 height 跳过: %', SQLERRM;
    END;

    BEGIN
        EXECUTE 'UPDATE products SET weight_kg = weight WHERE weight IS NOT NULL AND weight_kg IS NULL';
        RAISE NOTICE '  - 迁移 weight -> weight_kg OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 weight 跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 3. shippers 表字段修复（发货方管理）
    -- =====================================================
    RAISE NOTICE '[3/10] 处理 shippers 表...';

    -- 添加 API 使用的 province 和 city 字段（测试环境可能只有 region）
    BEGIN
        ALTER TABLE shippers ADD COLUMN IF NOT EXISTS province VARCHAR(50);
        RAISE NOTICE '  - province 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - province 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE shippers ADD COLUMN IF NOT EXISTS city VARCHAR(50);
        RAISE NOTICE '  - city 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - city 字段添加跳过: %', SQLERRM;
    END;

    -- 添加 contact_person 和 contact_phone（部分环境可能只有 contact 和 phone）
    BEGIN
        ALTER TABLE shippers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  - contact_person 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_person 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE shippers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  - contact_phone 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_phone 字段添加跳过: %', SQLERRM;
    END;

    -- 迁移 region -> province（如果 province 为空且 region 有值）
    BEGIN
        EXECUTE 'UPDATE shippers SET province = region WHERE region IS NOT NULL AND (province IS NULL OR province = '''' )';
        RAISE NOTICE '  - 迁移 region -> province OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 region 跳过: %', SQLERRM;
    END;

    -- 迁移 contact -> contact_person
    BEGIN
        EXECUTE "UPDATE shippers SET contact_person = contact WHERE contact IS NOT NULL AND (contact_person IS NULL OR contact_person = '' )";
        RAISE NOTICE '  - 迁移 contact -> contact_person OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 contact 跳过: %', SQLERRM;
    END;

    -- 迁移 phone -> contact_phone
    BEGIN
        EXECUTE 'UPDATE shippers SET contact_phone = phone WHERE phone IS NOT NULL AND (contact_phone IS NULL OR contact_phone = '''' )';
        RAISE NOTICE '  - 迁移 phone -> contact_phone OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - 迁移 phone 跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 4. suppliers 表字段修复
    -- =====================================================
    RAISE NOTICE '[4/10] 处理 suppliers 表...';

    -- 添加 API 使用的 remark 字段
    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  - remark 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - remark 字段添加跳过: %', SQLERRM;
    END;

    -- 添加 contact_person 和 contact_phone（测试环境可能只有 contact）
    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  - contact_person 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_person 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  - contact_phone 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_phone 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(50);
        RAISE NOTICE '  - city 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - city 字段添加跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 5. customers 表字段修复
    -- =====================================================
    RAISE NOTICE '[5/10] 处理 customers 表...';

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  - contact_person 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_person 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  - contact_phone 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_phone 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);
        RAISE NOTICE '  - contact_email 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_email 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE customers ADD COLUMN IF NOT EXISTS district VARCHAR(50);
        RAISE NOTICE '  - district 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - district 字段添加跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 6. warehouses 表字段修复
    -- =====================================================
    RAISE NOTICE '[6/10] 处理 warehouses 表...';

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS short_name VARCHAR(100);
        RAISE NOTICE '  - short_name 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - short_name 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
        RAISE NOTICE '  - contact_person 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_person 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
        RAISE NOTICE '  - contact_phone 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - contact_phone 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS province VARCHAR(50);
        RAISE NOTICE '  - province 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - province 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city VARCHAR(50);
        RAISE NOTICE '  - city 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - city 字段添加跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 7. orders 表字段检查
    -- =====================================================
    RAISE NOTICE '[7/10] 检查 orders 表...';

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS salesperson_id UUID;
        RAISE NOTICE '  - salesperson_id 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - salesperson_id 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS operator_id UUID;
        RAISE NOTICE '  - operator_id 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - operator_id 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID;
        RAISE NOTICE '  - customer_id 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - customer_id 字段添加跳过: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(100);
        RAISE NOTICE '  - warehouse_id 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - warehouse_id 字段添加跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 8. agent_configs 表字段检查
    -- =====================================================
    RAISE NOTICE '[8/10] 检查 agent_configs 表...';

    BEGIN
        ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS remark TEXT;
        RAISE NOTICE '  - remark 字段 OK';
    EXCEPTION WHEN others THEN
        RAISE NOTICE '  - remark 字段添加跳过: %', SQLERRM;
    END;

    -- =====================================================
    -- 完成报告
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '数据库字段同步完成！';
    RAISE NOTICE '========================================';

    -- 输出字段验证
    FOR tbl IN SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema = 'public'
    LOOP
        SELECT string_agg(column_name, ', ')
        INTO missing_cols
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl;

        RAISE NOTICE '表 %: %', tbl, missing_cols;
    END LOOP;

EXCEPTION WHEN others THEN
    RAISE NOTICE '执行过程中出错: %', SQLERRM;
    RAISE NOTICE '部分字段可能未成功添加，请手动检查或重试';
END $$;

-- 最终验证查询
SELECT
    'users' AS table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
GROUP BY table_name

UNION ALL

SELECT
    'products' AS table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'products'
GROUP BY table_name

UNION ALL

SELECT
    'shippers' AS table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shippers'
GROUP BY table_name

UNION ALL

SELECT
    'suppliers' AS table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suppliers'
GROUP BY table_name

UNION ALL

SELECT
    'customers' AS table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'customers'
GROUP BY table_name

UNION ALL

SELECT
    'warehouses' AS table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'warehouses'
GROUP BY table_name;
