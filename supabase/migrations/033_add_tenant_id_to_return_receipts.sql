-- 回单模块租户隔离：给 return_receipt_records / return_receipts / return_records 添加 tenant_id 列

-- 1. return_receipt_records 表添加 tenant_id
ALTER TABLE return_receipt_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_return_receipt_records_tenant ON return_receipt_records(tenant_id);

-- 2. return_receipts 表添加 tenant_id
ALTER TABLE return_receipts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_return_receipts_tenant ON return_receipts(tenant_id);

-- 3. return_records 表添加 tenant_id
ALTER TABLE return_records ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_return_records_tenant ON return_records(tenant_id);

-- 4. 存量数据回填
DO $$
DECLARE
    syl_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    UPDATE return_receipt_records SET tenant_id = syl_id WHERE tenant_id IS NULL;
    UPDATE return_receipts SET tenant_id = syl_id WHERE tenant_id IS NULL;
    UPDATE return_records SET tenant_id = syl_id WHERE tenant_id IS NULL;
END $$;
