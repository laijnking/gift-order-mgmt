import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  const client = getSupabaseClient();
  const { data, error } = await client.from('platform_defaults').select('*');
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  const defaults: Record<string, unknown> = {};
  for (const row of data || []) {
    defaults[row.config_key as string] = row.config_value;
  }
  return NextResponse.json({ success: true, data: defaults });
}

export async function PATCH(request: NextRequest) {
  const client = getSupabaseClient();
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    await client.from('platform_defaults').upsert({ config_key: key, config_value: value }, { onConflict: 'config_key' });
  }
  return NextResponse.json({ success: true, message: '全局默认配置已更新' });
}
