-- ============================================================
-- Migration: 015_add_customer_order_no
-- Date: 2026-04-26
-- Description:
--   给 orders 表添加 customer_order_no 列。
--   AI 智能订单解析流程中，前端传递 customer_order_no 字段
--   供后端在订单去重时使用（buildDuplicateOrderKey）。
--   该列不参与 NOT NULL 约束，允许为空。
-- ============================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_order_no VARCHAR(100);

COMMENT ON COLUMN orders.customer_order_no IS '客户原始单号（AI智能订单解析时传递，用于订单去重）';
