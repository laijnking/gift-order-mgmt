-- Add system_remark field for internal operations use
ALTER TABLE orders ADD COLUMN IF NOT EXISTS system_remark VARCHAR(200);

COMMENT ON COLUMN orders.system_remark IS '系统备注（内部运营使用）';
