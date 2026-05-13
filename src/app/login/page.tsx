import { headers } from 'next/headers';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LoginForm } from './login-form';

interface BrandInfo {
  brandName?: string;
  logoUrl?: string;
  themeColor?: string;
  welcomeMessage?: string;
  footerText?: string;
  tenantCode?: string;
}

async function getBrandFromHost(): Promise<BrandInfo> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const hostname = host.split(':')[0];
    const parts = hostname.split('.');

    // 子域名解析: syl.lp.lianxiaoyun.com → syl
    // 本地开发: localhost → 默认
    let tenantCode: string | null = null;
    if (parts.length >= 3) {
      tenantCode = parts[0];
    }

    if (tenantCode) {
      const client = getSupabaseClient();
      const { data: tenant } = await client
        .from('tenants')
        .select('id')
        .eq('code', tenantCode)
        .maybeSingle();

      if (tenant) {
        const { data: brandData } = await client
          .from('brand_configs')
          .select('brand_name, logo_url, theme_color, welcome_message, footer_text')
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (brandData) {
          return {
            brandName: brandData.brand_name as string,
            logoUrl: brandData.logo_url as string,
            themeColor: brandData.theme_color as string,
            welcomeMessage: brandData.welcome_message as string,
            footerText: brandData.footer_text as string,
            tenantCode,
          };
        }
      }
    }
  } catch {
    // 数据库不可用时静默降级
  }
  return {};
}

export default async function LoginPage() {
  const brand = await getBrandFromHost();

  return <LoginForm brand={brand} />;
}
