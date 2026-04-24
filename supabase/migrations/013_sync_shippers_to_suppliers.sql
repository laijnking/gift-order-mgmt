-- ============================================================
-- Migration: 012_sync_shippers_to_suppliers
-- Date: 2026-04-24
-- Description:
--   从 shippers 表同步数据到 suppliers 表，解决批量导出发货通知功能
--   无法执行的问题（suppliers 表为空，但 shippers 表有真实业务数据）。
--
-- 问题背景：
--   - suppliers 表是 API 层的档案表（buildRelatedMaps 等查询此表）
--   - shippers 表是前端发货方管理页面使用的档案表
--   - 历史上两个表各自独立，导致 suppliers 表为空
--   - 本次同步通过 id 关联，将 shippers 数据写入 suppliers
--
-- 同步规则：
--   - 按 id 一一对应写入/更新 suppliers 表
--   - shippers.id -> suppliers.id（保持 ID 一致性，确保关联查询正确）
--   - 仅同步活跃的发货方（is_active = true）
--   - type 为 supplier/jd/self/third_party 的发货方才同步
--
-- 本迁移幂等，可安全重复执行
-- ============================================================

INSERT INTO suppliers (
    id,
    code,
    name,
    type,
    province,
    city,
    contact_person,
    contact_phone,
    send_type,
    can_jd,
    cost_factor,
    is_active,
    contact,
    created_at,
    updated_at
)
SELECT
    id,
    code,
    name,
    type,
    COALESCE(province, ''),
    COALESCE(city, ''),
    COALESCE(contact_person, ''),
    COALESCE(contact_phone, ''),
    COALESCE(send_type, 'download'),
    COALESCE(can_jd, false),
    COALESCE(cost_factor, 1.0),
    COALESCE(is_active, true),
    COALESCE(contact_person, ''),
    COALESCE(created_at, NOW()),
    NOW()
FROM shippers
WHERE is_active = true
  AND type IN ('supplier', 'jd', 'self', 'third_party')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    province = EXCLUDED.province,
    city = EXCLUDED.city,
    contact_person = EXCLUDED.contact_person,
    contact_phone = EXCLUDED.contact_phone,
    send_type = EXCLUDED.send_type,
    can_jd = EXCLUDED.can_jd,
    cost_factor = EXCLUDED.cost_factor,
    is_active = EXCLUDED.is_active,
    contact = EXCLUDED.contact,
    updated_at = NOW();

RAISE NOTICE '从 shippers 表同步 % 条数据到 suppliers 表',
    (SELECT count(*) FROM shippers WHERE is_active = true AND type IN ('supplier', 'jd', 'self', 'third_party'));
