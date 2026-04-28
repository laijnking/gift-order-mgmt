-- 添加 export_records.supplier_name 列（denormalized 字段，方便快速查询）
-- 供应商名称已存在于 metadata.supplier_names，此列为兼容 API 插入而添加

ALTER TABLE export_records ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);

-- 为历史记录补充 supplier_name（从 metadata 中提取）
UPDATE export_records
SET supplier_name = metadata->>'supplier_names'
WHERE supplier_name IS NULL AND metadata IS NOT NULL AND metadata->>'supplier_names' IS NOT NULL;