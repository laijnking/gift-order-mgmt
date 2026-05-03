-- ============================================================
-- 024: 企业微信插件（WeCom Plugin）数据库迁移
--
-- 功能：企业微信群自动接单/回单插件
-- 版本：v1.0 | 2026-05-03
-- 包含：
--   1. wecom_app_config — 企微应用配置
--   2. wecom_group_mappings — 群 → 客户映射
--   3. wecom_file_process_queue — 文件处理队列
--   4. wecom_feedback_tasks — 回单发送记录
--   5. wecom:manage 权限
-- ============================================================

-- 1. wecom_app_config — 企微应用配置
CREATE TABLE IF NOT EXISTS wecom_app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  corp_id VARCHAR(255) NOT NULL,
  agent_id VARCHAR(100) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  token VARCHAR(100) NOT NULL,
  encoding_aes_key VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE wecom_app_config IS '企业微信应用配置表';
COMMENT ON COLUMN wecom_app_config.corp_id IS '企业ID';
COMMENT ON COLUMN wecom_app_config.agent_id IS '应用AgentID';
COMMENT ON COLUMN wecom_app_config.secret IS '应用Secret';
COMMENT ON COLUMN wecom_app_config.token IS '回调Token';
COMMENT ON COLUMN wecom_app_config.encoding_aes_key IS '回调EncodingAESKey';

-- 2. wecom_group_mappings — 群 → 客户映射
CREATE TABLE IF NOT EXISTS wecom_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES wecom_app_config(id) ON DELETE CASCADE,
  group_id VARCHAR(255) NOT NULL,
  group_name VARCHAR(500),
  customer_id UUID,
  match_source VARCHAR(50) DEFAULT 'auto',
  match_score INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  auto_create_order BOOLEAN DEFAULT true,
  auto_send_feedback BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(app_id, group_id)
);

COMMENT ON TABLE wecom_group_mappings IS '企业微信群与客户映射表';
COMMENT ON COLUMN wecom_group_mappings.group_id IS '企业微信群ChatId';
COMMENT ON COLUMN wecom_group_mappings.group_name IS '群名称（用于自动匹配）';
COMMENT ON COLUMN wecom_group_mappings.customer_id IS '对应系统客户ID';
COMMENT ON COLUMN wecom_group_mappings.match_source IS '匹配来源：auto(自动匹配)/manual(人工绑定)';
COMMENT ON COLUMN wecom_group_mappings.match_score IS '匹配得分（0-100）';

-- 3. wecom_file_process_queue — 文件处理队列
CREATE TABLE IF NOT EXISTS wecom_file_process_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES wecom_app_config(id) ON DELETE SET NULL,
  msg_id VARCHAR(255) NOT NULL,
  media_id VARCHAR(255),
  file_name VARCHAR(500),
  file_length BIGINT,
  group_id VARCHAR(255),
  group_name VARCHAR(500),
  from_user_id VARCHAR(255),
  mapping_id UUID,
  customer_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  download_path TEXT,
  parsed_order_count INT DEFAULT 0,
  created_order_count INT DEFAULT 0,
  import_batch VARCHAR(255),
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(msg_id)
);

COMMENT ON TABLE wecom_file_process_queue IS '企业微信文件处理队列';
COMMENT ON COLUMN wecom_file_process_queue.status IS 'pending/downloading/parsing/creating_orders/completed/failed/duplicate';

-- 4. wecom_feedback_tasks — 回单发送记录
CREATE TABLE IF NOT EXISTS wecom_feedback_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES wecom_app_config(id) ON DELETE SET NULL,
  mapping_id UUID,
  customer_id UUID NOT NULL,
  group_id VARCHAR(255) NOT NULL,
  order_ids JSONB DEFAULT '[]',
  orders_count INT DEFAULT 0,
  export_media_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE wecom_feedback_tasks IS '企业微信回单发送任务记录';
COMMENT ON COLUMN wecom_feedback_tasks.status IS 'pending/exporting/uploading/sent/failed';

-- 5. 添加 wecom:manage 权限
INSERT INTO permissions (id, code, name, category, description)
VALUES ('e0000000-0000-0000-0000-000000000030', 'wecom:manage', '企业微信管理', '系统', '管理企业微信群自动接单/回单功能，包括群映射配置、队列监控、回单发送')
ON CONFLICT (code) DO NOTHING;

-- 6. 为 admin 角色自动关联 wecom:manage 权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
  AND p.code = 'wecom:manage'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;
