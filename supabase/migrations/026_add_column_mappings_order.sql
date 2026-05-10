-- Add column_order field to column_mappings to preserve original Excel column order
-- JSONB objects don't preserve key order, but JSONB arrays do
ALTER TABLE column_mappings
ADD COLUMN IF NOT EXISTS column_order JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN column_mappings.column_order IS
'Ordered array of original Excel header names, preserving the column sequence from customer import. Used for feedback export to maintain the same column order as the import template.';
