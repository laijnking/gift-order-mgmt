import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { clearTenantConfigCache } from '@/lib/config/server';

export async function GET(request: NextRequest) {
  const tenant = await getTenantFromRequest(request);
  if (!tenant.tenantId) {
    return NextResponse.json({ success: false, error: '缺少租户上下文' }, { status: 400 });
  }

  const client = getSupabaseClient();

  try {
    const { data: rows, error } = await client
      .from('tenant_configs')
      .select('category, config_key, config_value')
      .eq('tenant_id', tenant.tenantId);

    if (error) throw new Error(`查询配置失败: ${error.message}`);

    const config: Record<string, unknown> = {
      name: '',
      financialSystem: '',
      statusLabels: {},
      actionLabels: {},
      exportPrefixes: {},
      businessRules: {},
    };

    if (rows) {
      for (const row of rows) {
        const cat = row.category as string;
        const key = row.config_key as string;
        const val = row.config_value;

        if (cat === 'basic') {
          if (key === 'name') config.name = val;
          else if (key === 'financialSystem') config.financialSystem = val;
        } else if (cat === 'businessRules') {
          const rules = config.businessRules as Record<string, unknown>;
          rules[key] = val;
        } else {
          const map = config[cat] as Record<string, unknown>;
          if (map) map[key] = val;
        }
      }
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('获取租户配置失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const tenant = await getTenantFromRequest(request);
  if (!tenant.tenantId) {
    return NextResponse.json({ success: false, error: '缺少租户上下文' }, { status: 400 });
  }

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { basic, statusLabels, actionLabels, exportPrefixes, businessRules } = body;
    const rows: { tenant_id: string; category: string; config_key: string; config_value: unknown }[] = [];

    if (basic && typeof basic === 'object') {
      for (const key of Object.keys(basic)) {
        rows.push({ tenant_id: tenant.tenantId, category: 'basic', config_key: key, config_value: basic[key] });
      }
    }
    const categories: Record<string, Record<string, unknown> | undefined> = {
      statusLabels, actionLabels, exportPrefixes,
    };
    for (const [category, obj] of Object.entries(categories)) {
      if (obj && typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
          rows.push({ tenant_id: tenant.tenantId, category, config_key: key, config_value: obj[key] });
        }
      }
    }
    if (businessRules && typeof businessRules === 'object') {
      for (const key of Object.keys(businessRules)) {
        rows.push({ tenant_id: tenant.tenantId, category: 'businessRules', config_key: key, config_value: businessRules[key] });
      }
    }

    if (rows.length > 0) {
      const { error } = await client
        .from('tenant_configs')
        .upsert(rows, { onConflict: 'tenant_id,category,config_key' });

      if (error) throw new Error(`保存配置失败: ${error.message}`);
    }

    clearTenantConfigCache(tenant.tenantId);

    return NextResponse.json({ success: true, message: '配置已保存' });
  } catch (error) {
    console.error('保存租户配置失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}
