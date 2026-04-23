-- Add feedback_export_headers column to column_mappings for storing
-- the customer's original column names used during import.
-- This enables the feedback export to use the customer's own column names
-- instead of system-generated field names.
ALTER TABLE column_mappings
ADD COLUMN IF NOT EXISTS feedback_export_headers JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN column_mappings.feedback_export_headers IS
  'Feedback export column name mapping: { "客户列名": "系统字段名" }. Used to restore customer original column names when exporting feedback forms.';
