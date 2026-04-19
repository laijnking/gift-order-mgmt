-- =====================================================
-- 模板结构对齐：补齐 API / 页面依赖字段
-- =====================================================

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS target_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS target_id UUID,
  ADD COLUMN IF NOT EXISTS target_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS field_mappings JSONB NOT NULL DEFAULT '{}'::JSONB;

UPDATE templates
SET code = CONCAT('TPL-', SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE code IS NULL OR BTRIM(code) = '';

UPDATE templates
SET field_mappings = COALESCE(
  NULLIF(field_mappings, '{}'::JSONB),
  (
    SELECT COALESCE(
      jsonb_object_agg(
        COALESCE(col->>'label', col->>'header', col->>'field', col->>'key'),
        COALESCE(col->>'field', col->>'key', '')
      ),
      '{}'::JSONB
    )
    FROM jsonb_array_elements(COALESCE(config->'columns', '[]'::JSONB)) AS col
  ),
  '{}'::JSONB
)
WHERE field_mappings IS NULL OR field_mappings = '{}'::JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_code_unique ON templates(code);
CREATE INDEX IF NOT EXISTS idx_templates_type_active ON templates(type, is_active);
CREATE INDEX IF NOT EXISTS idx_templates_target ON templates(target_type, target_id);
