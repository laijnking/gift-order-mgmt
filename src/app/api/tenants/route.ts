import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireSuperadmin } from '@/lib/server-auth';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function GET(request: NextRequest) {
  const authError = await requireSuperadmin(request);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const { data: tenants, error } = await client
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询租户失败: ${error.message}`);

    const data: Record<string, unknown>[] = [];
    for (const t of tenants || []) {
      const id = t.id as string;
      const { count } = await client
        .from('user_tenants')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', id);

      data.push({
        id: t.id,
        code: t.code,
        name: t.name,
        status: t.status,
        plan: t.plan,
        created_at: t.created_at,
        member_count: count ?? 0,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('获取租户列表失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireSuperadmin(request);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const code: string = (body.code || '').toUpperCase().trim();
    const name: string = (body.name || '').trim();
    const plan: string = body.plan || 'basic';

    if (!code || !name) {
      return NextResponse.json({ success: false, error: '租户编码和名称不能为空' }, { status: 400 });
    }

    // 1. 校验编码唯一性
    const { data: existing } = await client
      .from('tenants')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: `租户编码 "${code}" 已存在` }, { status: 409 });
    }

    // 2. 创建租户
    const { data: tenant, error: tenantError } = await client
      .from('tenants')
      .insert({ code, name, status: 'active', plan })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw new Error(`创建租户失败: ${tenantError?.message || '未知错误'}`);
    }

    const tenantId = tenant.id as string;

    // 3. 创建租户管理员
    const adminUsername = `admin_${code.toLowerCase()}`;
    const adminPassword = `Admin${code}123!`;
    const { data: adminUser, error: userError } = await client
      .from('users')
      .insert({
        username: adminUsername,
        password_hash: hashPassword(adminPassword),
        name: `${name}管理员`,
        real_name: `${name}管理员`,
        role: 'admin',
        is_active: true,
        is_superadmin: false,
      })
      .select()
      .single();

    if (userError || !adminUser) {
      throw new Error(`创建管理员用户失败: ${userError?.message || '未知错误'}`);
    }

    // 4. 创建 user_tenants 关联
    const { error: utError } = await client
      .from('user_tenants')
      .insert({
        user_id: adminUser.id,
        tenant_id: tenantId,
        role: 'admin',
        is_default: true,
      });

    if (utError) {
      throw new Error(`创建用户-租户关联失败: ${utError.message}`);
    }

    // 5. 从 platform_defaults 复制全局默认配置到 tenant_configs
    const { data: defaults } = await client
      .from('platform_defaults')
      .select('config_key, config_value');

    if (defaults && defaults.length > 0) {
      const configRows: Record<string, unknown>[] = [];
      for (const row of defaults) {
        const key = row.config_key as string;
        const value = row.config_value;

        // 确定 category
        let category = 'basic';
        if (key === 'statusLabels') category = 'statusLabels';
        else if (key === 'actionLabels') category = 'actionLabels';
        else if (key === 'exportPrefixes') category = 'exportPrefixes';

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // JSONB 对象：展开为多条记录
          const obj = value as Record<string, unknown>;
          for (const objKey of Object.keys(obj)) {
            configRows.push({
              tenant_id: tenantId,
              category,
              config_key: objKey,
              config_value: obj[objKey],
            });
          }
        } else {
          // 简单值：直接存储
          configRows.push({
            tenant_id: tenantId,
            category,
            config_key: key,
            config_value: value,
          });
        }
      }

      if (configRows.length > 0) {
        const { error: configError } = await client
          .from('tenant_configs')
          .insert(configRows);

        if (configError) {
          console.error('复制默认配置失败:', configError.message);
        }
      }
    }

    // 6. 创建 brand_configs 行
    const { error: brandError } = await client
      .from('brand_configs')
      .upsert({
        tenant_id: tenantId,
        brand_name: name,
        theme_color: '#1890ff',
      }, { onConflict: 'tenant_id' });

    if (brandError) {
      console.error('创建品牌配置失败:', brandError.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        adminUsername,
        adminPassword,
      },
      message: `租户 "${name}" 创建成功`,
    });
  } catch (error) {
    console.error('创建租户失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 },
    );
  }
}
