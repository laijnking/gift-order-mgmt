-- =====================================================
-- 修复 orders.supplier_id 类型问题
-- 问题：orders.supplier_id 定义为 VARCHAR(36)，但关联的是 shippers/suppliers 表的 UUID 主键
-- 解决方案：改为 UUID 类型以保持一致
-- =====================================================

BEGIN;

-- 检查当前 orders.supplier_id 的类型
DO $$
DECLARE
    current_type TEXT;
BEGIN
    SELECT data_type INTO current_type
    FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'supplier_id';
    
    RAISE NOTICE 'orders.supplier_id 当前类型: %', current_type;
END $$;

-- 修改 orders.supplier_id 类型从 VARCHAR(36) 到 UUID
ALTER TABLE orders ALTER COLUMN supplier_id TYPE UUID USING supplier_id::UUID;

-- 添加注释说明字段含义
COMMENT ON COLUMN orders.supplier_id IS '关联发货方ID（shippers表），存储 UUID 类型的主键';

-- 验证修改结果
DO $$
DECLARE
    new_type TEXT;
BEGIN
    SELECT data_type INTO new_type
    FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'supplier_id';
    
    RAISE NOTICE 'orders.supplier_id 修改后类型: %', new_type;
END $$;

COMMIT;

-- =====================================================
-- 说明：
-- 1. 发货方和仓库已合并为发货方（shippers）
-- 2. orders.supplier_id 关联的是 shippers.id（UUID 类型）
-- 3. 原来定义为 VARCHAR(36) 是为了兼容旧数据，但新数据应使用 UUID
-- =====================================================
