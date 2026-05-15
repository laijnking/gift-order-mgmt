-- 预警模块租户隔离：给 alert_rules / alert_records 添加 tenant_id 列

-- 1. alert_rules 表添加 tenant_id
ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON alert_rules(tenant_id);

-- 2. alert_records 表添加 tenant_id
ALTER TABLE alert_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_alert_records_tenant ON alert_records(tenant_id);

-- 3. 存量数据回填（复用 031 逻辑，确保 NULL 行被赋予 SYL 租户 ID）
DO $$
DECLARE
    syl_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    UPDATE alert_rules SET tenant_id = syl_id WHERE tenant_id IS NULL;
    UPDATE alert_records SET tenant_id = syl_id WHERE tenant_id IS NULL;
END $$;
