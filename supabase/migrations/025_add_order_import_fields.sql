-- 订单导入 Excel 列映射新字段支持
-- 新增：渠道备注、建议发货方、原订单状态
-- 日期：2026-05-05

ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel_remark TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS suggested_shipper VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_status VARCHAR(30);
