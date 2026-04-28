-- return_receipt_records.supplier_id 改为 nullable（系统按订单号自动匹配发货方）
ALTER TABLE return_receipt_records ALTER COLUMN supplier_id DROP NOT NULL;

-- 同时添加一个虚拟供应商 ID 用于那些无法匹配到具体供应商的导入记录
-- 这是一个兼容性修改，确保历史数据和新功能都能正常工作