-- ============================================================
-- 022: 权限种子数据（修复角色管理功能清单为空的问题）
--
-- 012_consolidated_init.sql 只建了 permissions 表结构，
-- 未插入权限数据。此迁移补齐所有权限记录和角色-权限关联。
-- 使用 ON CONFLICT DO NOTHING 保证幂等，可安全重复执行。
-- ============================================================

-- 1. 插入全部权限
INSERT INTO permissions (id, code, name, category, description) VALUES
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
    ('e0000000-0000-0000-0000-000000000011', 'suppliers:view', '发货方查看', '发货方', '查看发货方'),
    ('e0000000-0000-0000-0000-000000000012', 'suppliers:create', '发货方创建', '发货方', '创建发货方'),
    ('e0000000-0000-0000-0000-000000000013', 'suppliers:edit', '发货方编辑', '发货方', '编辑发货方'),
    ('e0000000-0000-0000-0000-000000000014', 'suppliers:delete', '发货方删除', '发货方', '删除发货方'),
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
    ('e0000000-0000-0000-0000-000000000028', 'settings:view', '设置查看', '系统', '查看系统设置'),
    ('e0000000-0000-0000-0000-000000000029', 'settings:edit', '设置编辑', '系统', '编辑系统设置')
ON CONFLICT (code) DO NOTHING;

-- 2. admin 角色关联所有权限（通过 code 查找角色，避免硬编码 UUID）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 3. salesperson 角色关联查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'salesperson'
  AND p.code IN (
      'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
      'customers:view', 'customers:create', 'customers:edit',
      'suppliers:view', 'products:view', 'stocks:view'
  )
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 4. operator 角色关联查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'operator'
  AND p.code IN (
      'dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
      'customers:view', 'suppliers:view', 'products:view', 'stocks:view'
  )
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 5. sales_manager 角色关联部门级查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'sales_manager'
  AND p.code IN (
      'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
      'customers:view', 'customers:create', 'customers:edit',
      'suppliers:view', 'products:view', 'stocks:view',
      'users:view'
  )
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 6. finance 角色关联查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'finance'
  AND p.code IN (
      'dashboard:view', 'orders:view', 'orders:export',
      'customers:view', 'suppliers:view', 'products:view', 'stocks:view',
      'users:view'
  )
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;
