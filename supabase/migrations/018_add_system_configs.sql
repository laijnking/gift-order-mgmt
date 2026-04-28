-- 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    config JSONB NOT NULL DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    editable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_system_configs_category ON system_configs(category);
CREATE INDEX IF NOT EXISTS idx_system_configs_code ON system_configs(code);

-- 确保 settings:view 和 settings:edit 权限存在
INSERT INTO permissions (id, code, name, category, description)
VALUES (
    'e0000000-0000-0000-0000-000000000028',
    'settings:view',
    '设置查看',
    '系统',
    '查看系统设置'
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (id, code, name, category, description)
VALUES (
    'e0000000-0000-0000-0000-000000000029',
    'settings:edit',
    '设置编辑',
    '系统',
    '编辑系统设置'
)
ON CONFLICT (code) DO NOTHING;

-- 确保 admin 角色有所需权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.code IN ('settings:view', 'settings:edit')
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- 初始数据：导出配置
INSERT INTO system_configs (code, name, category, config, description, is_public)
VALUES (
    'export_default_dir',
    '默认导出目录',
    'export',
    '{"provider": "local", "localPath": ""}',
    '设置导出文件的默认存储路径。空值时使用系统默认路径（下载目录）。',
    true
)
ON CONFLICT (code) DO NOTHING;

-- 导出配置分类的其他配置项
INSERT INTO system_configs (code, name, category, config, description, is_public)
VALUES (
    'export_provider',
    '导出存储 provider',
    'export',
    '{"provider": "local"}',
    '导出文件存储 provider：local 或 s3',
    true
)
ON CONFLICT (code) DO NOTHING;