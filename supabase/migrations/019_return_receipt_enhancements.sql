-- =====================================================
-- 回单导入模块增强
-- 版本: 1.7.0 | 日期: 2026-04-28
-- 变更内容:
--   1. orders 表新增 freight_cost 字段（运费成本）
--   2. return_receipts 表新增 freight_cost 字段
--   3. return_receipts.supplier_id 改为可选（支持不指定发货方导入）
--   4. return_receipt_records 表新增 file_name 字段
-- =====================================================

BEGIN;

-- 1. orders 表新增 freight_cost 字段（运费成本）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS freight_cost NUMERIC(12,2);
COMMENT ON COLUMN orders.freight_cost IS '运费成本（总运费，由回单导入时补全）';

-- 2. return_receipts 表新增 freight_cost 字段
ALTER TABLE return_receipts ADD COLUMN IF NOT EXISTS freight_cost NUMERIC(12,2);
COMMENT ON COLUMN return_receipts.freight_cost IS '运费成本';

-- 3. return_receipts.supplier_id 改为可选（允许不指定发货方导入，系统自动按订单号匹配）
ALTER TABLE return_receipts ALTER COLUMN supplier_id DROP NOT NULL;

-- 4. return_receipt_records 表新增 file_name 字段（存储上传的原始文件名）
ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
COMMENT ON COLUMN return_receipt_records.file_name IS '导入的原始文件名';

COMMIT;

-- =====================================================
-- 验证迁移结果
-- =====================================================

DO $$
DECLARE
    col_exists BOOLEAN;
    col_type TEXT;
BEGIN
    -- 检查 orders.freight_cost
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'freight_cost'
    ) INTO col_exists;
    RAISE NOTICE 'orders.freight_cost 存在: %', col_exists;

    -- 检查 return_receipts.freight_cost
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'return_receipts' AND column_name = 'freight_cost'
    ) INTO col_exists;
    RAISE NOTICE 'return_receipts.freight_cost 存在: %', col_exists;

    -- 检查 return_receipts.supplier_id 是否可空
    SELECT CASE WHEN is_nullable = 'YES' THEN TRUE ELSE FALSE END INTO col_exists
    FROM information_schema.columns
    WHERE table_name = 'return_receipts' AND column_name = 'supplier_id';
    RAISE NOTICE 'return_receipts.supplier_id 可空: %', col_exists;

    -- 检查 return_receipt_records.file_name
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'return_receipt_records' AND column_name = 'file_name'
    ) INTO col_exists;
    RAISE NOTICE 'return_receipt_records.file_name 存在: %', col_exists;
END $$;
