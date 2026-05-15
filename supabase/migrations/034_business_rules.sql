-- 创建业务规则表
CREATE TABLE IF NOT EXISTS business_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  priority INT DEFAULT 100,
  trigger_type VARCHAR(20) NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建规则执行日志表
CREATE TABLE IF NOT EXISTS rule_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES business_rules(id) ON DELETE CASCADE,
  tenant_id VARCHAR(36) NOT NULL,
  trigger_type VARCHAR(20),
  matched BOOLEAN,
  execution_result JSONB,
  execution_time INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_business_rules_tenant_id ON business_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_rules_enabled ON business_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_business_rules_priority ON business_rules(priority);
CREATE INDEX IF NOT EXISTS idx_rule_execution_logs_rule_id ON rule_execution_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_logs_tenant_id ON rule_execution_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rule_execution_logs_created_at ON rule_execution_logs(created_at);

-- 添加 RLS 策略
ALTER TABLE business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business rules are tenant isolated" ON business_rules
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::VARCHAR(36));

CREATE POLICY "Rule execution logs are tenant isolated" ON rule_execution_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::VARCHAR(36));