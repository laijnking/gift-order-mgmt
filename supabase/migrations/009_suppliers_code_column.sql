-- =====================================================
-- 礼品订单管理系统 - 补充 suppliers 表缺失字段
-- 问题：suppliers 表缺少 code 列，但 pending API 和 suppliers API 都在使用
-- 修复：添加 code 列（使用 id 前8位作为默认编码）
-- =====================================================

-- 为 suppliers 表添加 code 列
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 为已有数据设置默认值（使用 id 前8位）
UPDATE suppliers SET code = LEFT(id::text, 8) WHERE code IS NULL;

-- 为新插入的 suppliers API 也传入 code（fallback 到 id 前8位）
-- API 层面已在 transformSupplier 中做了兜底，这里只保证 DB 层面不缺失
