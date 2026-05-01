-- 023: column_mappings 表新增 customer_id 字段，统一 customer 口径
-- 背景：product_mappings 已使用 customer_id 作为主查询口径，column_mappings 需对齐
-- 回滚：ALTER TABLE column_mappings DROP COLUMN customer_id;

-- 1. 新增 customer_id 列
ALTER TABLE column_mappings ADD COLUMN IF NOT EXISTS customer_id UUID;

-- 2. 回填已有数据（根据 customer_code 关联 customers 表）
UPDATE column_mappings cm
SET customer_id = c.id
FROM customers c
WHERE cm.customer_code = c.code
  AND cm.customer_id IS NULL;

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_column_mappings_customer_id ON column_mappings(customer_id);
