-- =====================================================
-- 数据库 Schema 迁移脚本
-- 用途：将旧版 schema (000_init.sql) 升级到新版 (001_schema.sql)
-- 适用：生产环境（华为云服务器 1.95.139.195）
-- 日期: 2026-04-23
-- 备份文件: /tmp/gift_order_backup_*.sql
--
-- 执行方式:
--   psql -h 127.0.0.1 -U postgres -d gift_order -f migrate-prod-schema.sql
--   或
--   PGPASSWORD=giftorder123 psql -h 127.0.0.1 -U postgres -d gift_order -f migrate-prod-schema.sql
-- =====================================================

-- =====================================================
-- 1. users 表修复
-- =====================================================
-- 移除 NOT NULL 约束（原旧 schema: name NOT NULL, password NOT NULL）
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN name SET DEFAULT '';
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password SET DEFAULT '';

-- 同步 name <- real_name（如果 name 为空）
UPDATE users SET name = COALESCE(real_name, '') WHERE name IS NULL OR name = '';

-- =====================================================
-- 2. customers 表添加缺失列
-- =====================================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS settlement_cycle VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS remark TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_days INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'normal';

-- =====================================================
-- 3. products 表添加缺失列
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS spec VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT '台';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(20) DEFAULT '在售';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(8,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_factor INTEGER DEFAULT 6000;

-- =====================================================
-- 4. suppliers 表添加缺失列
-- =====================================================
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS settlement_type VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE suppliers ALTER COLUMN send_type DROP NOT NULL;
ALTER TABLE suppliers ALTER COLUMN send_type SET DEFAULT '直发';
UPDATE suppliers SET send_type = '直发' WHERE send_type IS NULL;

-- =====================================================
-- 5. warehouses 表添加缺失列
-- =====================================================
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS province VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS city VARCHAR(50);
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS remark TEXT;

-- =====================================================
-- 6. 插入权限数据（permissions 表必须为空）
-- =====================================================
INSERT INTO permissions (id, code, name, category, description)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'dashboard:view', '仪表盘查看', '仪表盘', '查看仪表盘数据'),
    ('e0000000-0000-0000-0000-000000000002', 'orders:view', '订单查看', '订单', '查看订单列表'),
    ('e0000000-0000-0000-0000-000000000003', 'orders:create', '订单创建', '订单', '创建新订单'),
    ('e0000000-0000-0000-0000-000000000004', 'orders:edit', '订单编辑', '订单', '编辑订单'),
    ('e0000000-0000-0000-0000-000000000005', 'orders:delete', '订单删除', '订单', '删除订单'),
    ('e0000000-0000-0000-0000-000000000006', 'orders:export', '订单导出', '订单', '导出订单数据'),
    ('e0000000-0000-0000-0000-000000000007', 'customers:view', '客户查看', '客户', '查看客户列表'),
    ('e0000000-0000-0000-0000-000000000008', 'customers:create', '客户创建', '客户', '创建客户'),
    ('e0000000-0000-0000-0000-000000000009', 'customers:edit', '客户编辑', '客户', '编辑客户'),
    ('e0000000-0000-0000-0000-000000000010', 'customers:delete', '客户删除', '客户', '删除客户'),
    ('e0000000-0000-0000-0000-000000000011', 'suppliers:view', '供应商查看', '供应商', '查看供应商'),
    ('e0000000-0000-0000-0000-000000000012', 'suppliers:create', '供应商创建', '供应商', '创建供应商'),
    ('e0000000-0000-0000-0000-000000000013', 'suppliers:edit', '供应商编辑', '供应商', '编辑供应商'),
    ('e0000000-0000-0000-0000-000000000014', 'suppliers:delete', '供应商删除', '供应商', '删除供应商'),
    ('e0000000-0000-0000-0000-000000000015', 'products:view', '商品查看', '商品', '查看商品列表'),
    ('e0000000-0000-0000-0000-000000000016', 'products:create', '商品创建', '商品', '创建商品'),
    ('e0000000-0000-0000-0000-000000000017', 'products:edit', '商品编辑', '商品', '编辑商品'),
    ('e0000000-0000-0000-0000-000000000018', 'products:delete', '商品删除', '商品', '删除商品'),
    ('e0000000-0000-0000-0000-000000000019', 'stocks:view', '库存查看', '库存', '查看库存'),
    ('e0000000-0000-0000-0000-000000000020', 'stocks:edit', '库存编辑', '库存', '编辑库存'),
    ('e0000000-0000-0000-0000-000000000021', 'users:view', '用户查看', '用户', '查看用户'),
    ('e0000000-0000-0000-0000-000000000022', 'users:create', '用户创建', '用户', '创建用户'),
    ('e0000000-0000-0000-0000-000000000023', 'users:edit', '用户编辑', '用户', '编辑用户'),
    ('e0000000-0000-0000-0000-000000000024', 'users:delete', '用户删除', '用户', '删除用户'),
    ('e0000000-0000-0000-0000-000000000025', 'agent_configs:view', 'Agent配置查看', '系统', '查看Agent配置'),
    ('e0000000-0000-0000-0000-000000000026', 'agent_configs:edit', 'Agent配置编辑', '系统', '编辑Agent配置'),
    ('e0000000-0000-0000-0000-000000000027', 'ai_logs:view', 'AI日志查看', '系统', '查看AI调用日志'),
    ('e0000000-0000-0000-0000-000000000028', 'settings:view', '设置查看', '系统', '查看系统设置')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 7. 插入角色权限关联
-- =====================================================
-- admin 角色关联所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT '38cc3134-5f4f-435f-8dbe-26490f5ad11d', id
FROM permissions
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = '38cc3134-5f4f-435f-8dbe-26490f5ad11d'
      AND rp.permission_id = permissions.id
)
ON CONFLICT DO NOTHING;

-- salesperson 角色关联查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT '81a8a960-8af8-4737-8e9a-5f69728eacc5', id
FROM permissions
WHERE code IN ('dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
               'customers:view', 'customers:create', 'customers:edit',
               'suppliers:view', 'products:view', 'stocks:view')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = '81a8a960-8af8-4737-8e9a-5f69728eacc5'
      AND rp.permission_id = permissions.id
)
ON CONFLICT DO NOTHING;

-- operator 角色关联查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'df43626f-fc7a-422d-b67f-eb833a3f01f7', id
FROM permissions
WHERE code IN ('dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
               'customers:view', 'suppliers:view', 'products:view', 'stocks:view')
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = 'df43626f-fc7a-422d-b67f-eb833a3f01f7'
      AND rp.permission_id = permissions.id
)
ON CONFLICT DO NOTHING;
