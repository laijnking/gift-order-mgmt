-- RLS 策略 — 数据库层租户隔离（可选，当前以 API 层显式过滤为主）
-- 启用后作为双重保险，防止 API 遗漏时的数据泄漏

-- 设置租户上下文的辅助函数
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 订单表
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_tenant_isolation ON orders
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 客户表
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_tenant_isolation ON customers
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 发货方表
ALTER TABLE shippers ENABLE ROW LEVEL SECURITY;
CREATE POLICY shippers_tenant_isolation ON shippers
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 库存表
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY stocks_tenant_isolation ON stocks
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 派发记录
ALTER TABLE dispatch_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY dispatch_records_tenant_isolation ON dispatch_records
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 回单记录
ALTER TABLE return_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY return_receipts_tenant_isolation ON return_receipts
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 导出记录
ALTER TABLE export_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY export_records_tenant_isolation ON export_records
  FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);

-- 商品表 (visibility + owner_tenant_id)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_visibility_policy ON products
  FOR ALL USING (
    visibility = 'global' OR
    (visibility = 'private' AND owner_tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
  );

-- 其余业务表
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'order_cost_history', 'templates', 'column_mappings', 'warehouses',
      'alert_rules', 'alert_records', 'product_mappings',
      'feedback_export_headers', 'wecom_configs', 'wecom_file_queue', 'wecom_send_records'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)',
      tbl || '_tenant_isolation', tbl
    );
  END LOOP;
END $$;
