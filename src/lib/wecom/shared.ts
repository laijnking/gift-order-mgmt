/**
 * WeCom Plugin - Shared Utilities
 * file-processor 和 feedback-sender 共用的工具函数
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { WeComAppConfig } from './types';

/**
 * 获取企微应用配置（带 is_active 和软删除检查）
 */
export async function getWeComAppConfig(appId: string): Promise<WeComAppConfig | null> {
  const client = getSupabaseClient();
  const { data } = await client
    .from('wecom_app_config')
    .select('*')
    .eq('id', appId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();
  return data;
}
