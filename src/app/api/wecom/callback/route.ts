/**
 * WeCom Callback Route Handler
 * GET: 验证回调 URL
 * POST: 处理回调消息
 */

import { NextRequest } from 'next/server';
import { handleCallback } from '@/lib/wecom/callback-handler';

export async function GET(request: NextRequest) {
  return handleCallback(request as unknown as Request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request as unknown as Request);
}
