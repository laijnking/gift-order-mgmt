/**
 * 安全回归验证脚本
 * 验证安全修复是否正确实施
 * 
 * 使用方法：pnpm tsx ./scripts/validate-security-regression.ts
 */

import { existsSync } from 'fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:5300';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  PASS ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
    console.log(`  FAIL ${name}: ${error}`);
  }
}

async function main() {
  console.log('\n=== 安全回归测试 ===\n');

  // 测试 1: SSRF 防护
  console.log('1. SSRF 防护测试');

  const ssrfTestCases = [
    { url: 'http://127.0.0.1:8080/', expectReject: true },
    { url: 'http://localhost:8080/', expectReject: true },
    { url: 'http://169.254.169.254/', expectReject: true },
    { url: 'http://10.0.0.1:8080/', expectReject: true },
    { url: 'http://172.16.0.1:8080/', expectReject: true },
    { url: 'http://192.168.1.1:8080/', expectReject: true },
    { url: 'http://example.com/', expectReject: false },
  ];

  for (const { url, expectReject } of ssrfTestCases) {
    await runTest(`SSRF: ${url}`, async () => {
      const response = await fetch(`${BASE_URL}/api/fetch-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-info': JSON.stringify({
            id: 'test-id',
            username: 'admin',
            role: 'admin',
            permissions: ['settings:edit'],
          }),
        },
        body: JSON.stringify({ url }),
      });

      if (expectReject) {
        if (response.status !== 400 && response.status !== 401) {
          throw new Error(`期望拒绝(400/401)，实际 ${response.status}`);
        }
      } else {
        // 公网地址可能被接受或返回其他错误（如权限问题）
        // 这里只检查不是 SSRF 相关错误
        if (response.status === 400) {
          const data = await response.json();
          if (data.details?.includes('安全检查')) {
            throw new Error(`公网地址被错误拒绝`);
          }
        }
      }
    });
  }

  // 测试 2: 危险端口防护
  console.log('\n2. 危险端口防护测试');

  await runTest('拒绝 SSH 端口 22', async () => {
    const response = await fetch(`${BASE_URL}/api/fetch-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-info': JSON.stringify({
          id: 'test-id',
          username: 'admin',
          role: 'admin',
          permissions: ['settings:edit'],
        }),
      },
      body: JSON.stringify({ url: 'http://example.com:22/' }),
    });

    if (response.status !== 400) {
      throw new Error(`期望 400，实际 ${response.status}`);
    }
    const data = await response.json();
    if (!data.details?.includes('禁止访问端口')) {
      throw new Error(`错误信息不正确: ${data.details}`);
    }
  });

  // 测试 3: 登录返回签名信息
  console.log('\n3. 鉴权签名测试');

  await runTest('登录响应包含签名信息', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });

    // 只要服务器返回成功响应，验证响应格式
    if (response.ok) {
      const data = await response.json();
      if (!data.data) {
        throw new Error('响应缺少 data 字段');
      }
      if (!data.data.authSignature) {
        throw new Error('响应缺少 authSignature 字段');
      }
      if (!data.data.authTimestamp) {
        throw new Error('响应缺少 authTimestamp 字段');
      }
    }
  });

  // 测试 4: 改密接口密码强度验证
  console.log('\n4. 密码强度测试');

  await runTest('改密拒绝弱密码', async () => {
    const response = await fetch(`${BASE_URL}/api/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-info': JSON.stringify({
          id: 'test-id',
          username: 'test',
          role: 'user',
          permissions: [],
        }),
      },
      body: JSON.stringify({
        oldPassword: 'oldpass123',
        newPassword: '123', // 弱密码
        confirmPassword: '123',
      }),
    });

    if (response.status !== 400 && response.status !== 401) {
      throw new Error(`期望 400/401，实际 ${response.status}`);
    }
  });

  // 输出总结
  console.log('\n=== 测试结果 ===\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);

  if (failed > 0) {
    console.log('\n失败项:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }

  console.log('\n所有安全测试通过！');
}

main().catch(console.error);
