-- 存量数据租户回填：将所有 tenant_id 为 NULL 的行统一设为 SYL（首映礼）租户
-- SYL 租户 ID 固定为 00000000-0000-0000-0000-000000000001

DO $$
DECLARE
    syl_id UUID := '00000000-0000-0000-0000-000000000001';
    tbl TEXT;
BEGIN
    -- 确保 SYL 租户存在
    INSERT INTO tenants (id, code, name, status, plan) VALUES
        (syl_id, 'SYL', '首映礼', 'active', 'basic')
    ON CONFLICT (id) DO NOTHING;

    -- 回填所有有 tenant_id 列的表
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'tenant_id'
          AND table_name NOT IN ('tenants', 'tenant_configs', 'tenant_brands')
    LOOP
        EXECUTE format(
            'UPDATE %I SET tenant_id = $1 WHERE tenant_id IS NULL',
            tbl
        ) USING syl_id;
    END LOOP;
END $$;
