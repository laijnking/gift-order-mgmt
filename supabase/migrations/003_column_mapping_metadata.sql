ALTER TABLE column_mappings
ADD COLUMN IF NOT EXISTS source_headers JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS header_fingerprint VARCHAR(64),
ADD COLUMN IF NOT EXISTS template_signature VARCHAR(64);

UPDATE column_mappings
SET source_headers = COALESCE(source_headers, '[]'::JSONB)
WHERE source_headers IS NULL;

CREATE INDEX IF NOT EXISTS idx_column_mappings_customer_active
ON column_mappings(customer_code, is_active);

CREATE INDEX IF NOT EXISTS idx_column_mappings_header_fingerprint
ON column_mappings(header_fingerprint);

CREATE INDEX IF NOT EXISTS idx_column_mappings_template_signature
ON column_mappings(template_signature);
