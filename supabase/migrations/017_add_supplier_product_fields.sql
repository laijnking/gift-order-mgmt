-- 为 product_mappings 表添加发货方商品编码字段
-- 这些字段用于存储发货方特有的商品编码/名称/规格

ALTER TABLE product_mappings
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS supplier_product_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS supplier_product_spec VARCHAR(200);

-- 为 dispatch_records 表添加发货方商品信息快照字段（如果不存在）
-- 注：dispatch_records.items 是 JSONB，但也可直接在表级别添加字段方便查询

-- 验证
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_mappings'
  AND column_name IN ('supplier_product_code', 'supplier_product_name', 'supplier_product_spec');
