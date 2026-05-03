import { NextRequest, NextResponse } from 'next/server';
import { FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { URL } from 'url';

const config = new Config();

// SSRF 防护配置
const SSRF_CONFIG = {
  // 允许的协议
  allowedProtocols: ['http:', 'https:'],
  // 阻止的主机名/模式
  blockedHosts: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254',  // AWS/GCP/Azure 元数据端点
    'metadata.google.internal',
    'metadata.azure.com',
  ],
  // 阻止的 IP 范围（CIDR）
  blockedIpRanges: [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16',
  ],
  // 最大响应大小（字节）
  maxResponseSize: 1024 * 1024, // 1MB
  // 最大超时（毫秒）
  maxTimeout: 10000, // 10秒
};

/**
 * 检查 IP 是否在阻止的范围内
 */
function isBlockedIp(ip: string): boolean {
  const blockedPatterns = [
    /^127\./,                      // 127.0.0.0/8
    /^10\./,                       // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,                 // 192.168.0.0/16
    /^169\.254\./,                 // 169.254.0.0/16 (链路本地)
    /^::1$/,                       // IPv6 环回
    /^(fe80:|fc00:|fec0:)/i,     // IPv6 本地链路
  ];

  return blockedPatterns.some(pattern => pattern.test(ip));
}

/**
 * 验证 URL 是否安全
 */
function isUrlSafe(inputUrl: string): { valid: boolean; reason?: string } {
  try {
    const url = new URL(inputUrl);

    // 检查协议
    if (!SSRF_CONFIG.allowedProtocols.includes(url.protocol)) {
      return { valid: false, reason: '只允许 http/https 协议' };
    }

    const hostname = url.hostname.toLowerCase();

    // 检查阻止的主机名
    if (SSRF_CONFIG.blockedHosts.includes(hostname)) {
      return { valid: false, reason: '禁止访问该主机' };
    }

    // 检查是否为 IP 地址
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(hostname)) {
      if (isBlockedIp(hostname)) {
        return { valid: false, reason: '禁止访问私有 IP 地址' };
      }
    }

    // DNS 重绑定防护：检查是否有数字 IP 伪装
    // 如果主机名看起来像 IP 但不是有效格式，可能有问题
    const ipLikePattern = /^\d{1,3}(\.\d{1,3}){3}$/;
    if (ipLikePattern.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      if (parts.some(p => p > 255)) {
        return { valid: false, reason: '无效的 IP 地址格式' };
      }
      if (isBlockedIp(hostname)) {
        return { valid: false, reason: '禁止访问该 IP 地址' };
      }
    }

    // 阻止 DNS 重绑定攻击的常见模式
    if (hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        hostname.includes('0.0.0.0') ||
        hostname.includes('.internal') ||
        hostname.includes('.metadata')) {
      return { valid: false, reason: '禁止访问该主机' };
    }

    // 检查端口
    const port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);
    if (port < 1 || port > 65535) {
      return { valid: false, reason: '无效的端口号' };
    }

    // 阻止常用危险端口
    const dangerousPorts = [22, 23, 25, 3389, 5432, 6379, 27017];
    if (dangerousPorts.includes(port)) {
      return { valid: false, reason: `禁止访问端口 ${port}` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, reason: '无效的 URL 格式' };
  }
}

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // SSRF 防护：验证 URL
    const urlCheck = isUrlSafe(url);
    if (!urlCheck.valid) {
      return NextResponse.json({
        error: 'URL 安全检查失败',
        details: urlCheck.reason
      }, { status: 400 });
    }

    // Extract forward headers for proper request tracing
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const fetchClient = new FetchClient(config, customHeaders);

    // 带超时和大小限制的请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SSRF_CONFIG.maxTimeout);

    try {
      const response = await fetchClient.fetch(url);

      // 检查响应大小
      if (response.content && response.content.length > SSRF_CONFIG.maxResponseSize) {
        return NextResponse.json({
          error: '响应内容过大',
          details: `最大允许 ${SSRF_CONFIG.maxResponseSize} 字节`
        }, { status: 400 });
      }

      return NextResponse.json({
        status_code: response.status_code,
        status_message: response.status_message,
        title: response.title,
        filetype: response.filetype,
        content: response.content,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Fetch error:', error);

    // 区分用户错误和服务端错误
    if (error instanceof Error) {
      if (error.message.includes('abort')) {
        return NextResponse.json({
          error: '请求超时',
          details: `超过 ${SSRF_CONFIG.maxTimeout / 1000} 秒`
        }, { status: 408 });
      }
    }

    return NextResponse.json({
      error: 'Failed to fetch URL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
