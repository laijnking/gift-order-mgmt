-- 全局默认配置表（新租户初始化模板）
CREATE TABLE IF NOT EXISTS platform_defaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description VARCHAR(500),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初始化默认配置（从 tenant-defaults 的代码值）
INSERT INTO platform_defaults (config_key, config_value, description) VALUES
('statusLabels', '{"pending":"待派发","assigned":"已派发","notified":"通知发货","partial_returned":"部分回单","returned":"已回单","feedbacked":"已反馈","completed":"已完成","cancelled":"已取消"}', '订单状态标签默认值'),
('actionLabels', '{"complete":"完成","exportKingdee":"导出","completeAction":"已完成","shipping":"发货通知单","exportShipping":"导出发货通知单"}', '操作按钮标签默认值'),
('exportPrefixes', '{"kingdee":"导出","shipping":"发货通知单"}', '导出文件名前缀默认值'),
('financialSystem', '"财务管理"', '财务系统名称默认值')
ON CONFLICT (config_key) DO NOTHING;

-- 创建 superadmin 角色（如不存在）
INSERT INTO roles (code, name, data_scope, description) VALUES
('superadmin', '超级管理员', 'all', '平台管理员，可管理所有租户和全局配置')
ON CONFLICT (code) DO NOTHING;
