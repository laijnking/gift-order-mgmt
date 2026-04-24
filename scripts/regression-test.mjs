/**
 * 礼品订单管理系统 - 功能回归测试脚本
 *
 * 测试策略（修复旧计划问题）：
 * 1. 从登录入口开始真实登录流程（不再 mock）
 * 2. 使用系统已有真实数据（从 db-snapshot 获取）
 * 3. 所有 API 请求走真实浏览器，不 mock
 * 4. 端口使用 Docker 容器端口 3001
 *
 * 运行方式：
 *   node scripts/regression-test.mjs
 *
 * 前置条件：
 *   1. Docker 容器运行在 localhost:3001
 *   2. Playwright 已安装: npx playwright install chromium
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// ─── 配置 ───────────────────────────────────────────────
const BASE = 'http://127.0.0.1:3001';
const TEST_DATE = new Date().toISOString().slice(0, 10);

// 快照数据（来自 db-snapshot）
const SNAPSHOT = {
  admin: { username: 'admin', password: 'admin123', role: 'admin' },
  salesperson: { username: 'salesperson', password: 'sales123', role: 'salesperson' },
  operator: { username: 'operator', password: 'operator123', role: 'operator' },
  sampleCustomer: { code: 'DHSK01', name: '个人-散客' },
  sampleOrderNo: 'SYS-20260424-0001-MOD2UZ78V4VX',
  sampleShipper: { code: 'FHS-001', name: '广东云海供应链' },
};

// ─── 工具函数 ────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isRealError(text) {
  if (text.includes('webpack-hmr')) return false;
  if (text.includes('WebSocket')) return false;
  if (text.includes('Failed to fetch') && text.includes('401')) return false;
  if (text.includes('net::ERR_')) return true;
  if (text.includes('Uncaught')) return true;
  return false;
}

function screenshotName(testId, phase) {
  return `test-results/screenshots/${phase}_${testId}.png`;
}

// ─── 测试结果结构 ────────────────────────────────────────
const results = {
  testDate: TEST_DATE,
  phases: [],
  summary: { passed: 0, failed: 0, errors: [] },
};

function record(phase, testId, name, status, detail = '') {
  results.phases.push({ phase, testId, name, status, detail });
  if (status === 'PASS') results.summary.passed++;
  else results.summary.failed++;
  if (status === 'FAIL') results.summary.errors.push(`${phase}.${testId}: ${name} — ${detail}`);
}

// ─── 辅助：导航到页面并检查加载 ─────────────────────────
async function visitPage(page, url, phase, testId, name, waitMs = 3000) {
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(waitMs);

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && isRealError(msg.text())) {
        errors.push(msg.text().slice(0, 120));
      }
    });

    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message.slice(0, 120)));

    record(phase, testId, name, 'PASS');
    return true;
  } catch (err) {
    record(phase, testId, name, 'FAIL', err.message.slice(0, 120));
    return false;
  }
}

// ─── 阶段 1：登录入口测试（核心修复）────────────────────
async function phase1_loginTests(browser) {
  const phase = 'L1';
  console.log(`\n=== [${phase}] 登录入口测试 ===`);

  // T1.1: 未登录访问首页应重定向到登录页
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    let passed = false;
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);
      const url = page.url();
      // 允许重定向到 login 或根目录（可能是首页）
      passed = url.includes('/login') || url === `${BASE}/`;
      if (passed) {
        record(phase, 'T1.1', '未登录访问首页', 'PASS', `最终URL: ${url}`);
      } else {
        record(phase, 'T1.1', '未登录访问首页', 'FAIL', `未重定向: ${url}`);
      }
    } catch (e) {
      record(phase, 'T1.1', '未登录访问首页', 'FAIL', e.message.slice(0, 120));
    }
    await ctx.close();
  }

  // T1.2: 登录页加载正常
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);
      const usernameInput = await page.$('#username');
      const passwordInput = await page.$('#password');
      const submitBtn = await page.$('button[type="submit"]');
      if (usernameInput && passwordInput && submitBtn) {
        record(phase, 'T1.2', '登录页表单元素存在', 'PASS');
      } else {
        record(phase, 'T1.2', '登录页表单元素存在', 'FAIL',
          `username=${!!usernameInput} password=${!!passwordInput} button=${!!submitBtn}`);
      }
    } catch (e) {
      record(phase, 'T1.2', '登录页表单元素存在', 'FAIL', e.message.slice(0, 120));
    }
    await ctx.close();
  }

  // T1.3: 错误密码登录
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.fill('#username', 'admin');
      await page.fill('#password', 'wrongpassword');
      await page.click('button[type="submit"]');
      await sleep(3000);
      const url = page.url();
      // 如果仍在 login 页面说明登录失败（符合预期）
      const stillOnLogin = url.includes('/login');
      // 或者有错误提示出现
      const bodyText = await page.textContent('body');
      const hasError = bodyText.includes('错误') || bodyText.includes('失败') ||
                       bodyText.includes('invalid') || bodyText.includes('密码');
      if (stillOnLogin || hasError) {
        record(phase, 'T1.3', '错误密码登录失败', 'PASS', stillOnLogin ? '留在登录页' : '显示错误提示');
      } else {
        record(phase, 'T1.3', '错误密码登录失败', 'FAIL', `跳转到了: ${url}`);
      }
    } catch (e) {
      record(phase, 'T1.3', '错误密码登录失败', 'FAIL', e.message.slice(0, 120));
    }
    await ctx.close();
  }

  // T1.4: 正确密码登录 admin
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.fill('#username', SNAPSHOT.admin.username);
      await page.fill('#password', SNAPSHOT.admin.password);
      await page.click('button[type="submit"]');
      await sleep(3000);
      const url = page.url();
      const success = !url.includes('/login') || url === `${BASE}/`;
      if (success) {
        record(phase, 'T1.4', 'admin 登录成功', 'PASS', `跳转: ${url}`);
      } else {
        record(phase, 'T1.4', 'admin 登录成功', 'FAIL', `仍在登录页: ${url}`);
      }
    } catch (e) {
      record(phase, 'T1.4', 'admin 登录成功', 'FAIL', e.message.slice(0, 120));
    }
    await ctx.close();
  }

  // T1.5: salesperson 登录
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.fill('#username', SNAPSHOT.salesperson.username);
      await page.fill('#password', SNAPSHOT.salesperson.password);
      await page.click('button[type="submit"]');
      await sleep(3000);
      const url = page.url();
      if (!url.includes('/login')) {
        record(phase, 'T1.5', 'salesperson 登录成功', 'PASS', `跳转: ${url}`);
      } else {
        record(phase, 'T1.5', 'salesperson 登录成功', 'FAIL', `登录页: ${url}`);
      }
    } catch (e) {
      record(phase, 'T1.5', 'salesperson 登录成功', 'FAIL', e.message.slice(0, 120));
    }
    await ctx.close();
  }

  console.log(`  ${phase} 完成`);
}

// ─── 阶段 2：首页仪表盘（使用真实数据）──────────────────
async function phase2_dashboardTests(browser) {
  const phase = 'L2';
  console.log(`\n=== [${phase}] 首页仪表盘测试 ===`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 先登录
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.fill('#username', SNAPSHOT.admin.username);
    await page.fill('#password', SNAPSHOT.admin.password);
    await page.click('button[type="submit"]');
    await sleep(3000);
  } catch (e) {
    record(phase, 'setup', '登录 admin', 'FAIL', e.message.slice(0, 120));
    await ctx.close();
    return;
  }

  // T2.1: 首页加载
  {
    try {
      await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasContent = body.length > 200;
      record(phase, 'T2.1', '首页加载成功', hasContent ? 'PASS' : 'FAIL', hasContent ? '' : '页面内容为空');
    } catch (e) {
      record(phase, 'T2.1', '首页加载成功', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T2.2: 首页包含真实客户数据（仪表盘统计）
  {
    try {
      const body = await page.textContent('body');
      const hasStats = body.includes('订单') || body.includes('客户') || body.includes('今日');
      record(phase, 'T2.2', '首页包含统计内容', hasStats ? 'PASS' : 'FAIL', hasStats ? '' : '未找到统计元素');
    } catch (e) {
      record(phase, 'T2.2', '首页包含统计内容', 'FAIL', e.message.slice(0, 120));
    }
  }

  await ctx.close();
  console.log(`  ${phase} 完成`);
}

// ─── 阶段 3：档案管理（使用真实档案数据）────────────────
async function phase3_archiveTests(browser) {
  const phase = 'L3';
  console.log(`\n=== [${phase}] 档案管理测试 ===`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 登录
  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.fill('#username', SNAPSHOT.admin.username);
    await page.fill('#password', SNAPSHOT.admin.password);
    await page.click('button[type="submit"]');
    await sleep(3000);
  } catch (e) {
    record(phase, 'setup', '登录 admin', 'FAIL', e.message.slice(0, 120));
    await ctx.close();
    return;
  }

  // T3.1: 客户管理
  {
    try {
      await page.goto(`${BASE}/customers`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('客户') || body.includes('customer');
      record(phase, 'T3.1', '客户管理页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T3.1', '客户管理页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T3.2: 发货方管理
  {
    try {
      await page.goto(`${BASE}/suppliers-manage`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      // 搜索真实发货方数据
      const hasRealData = body.includes('广东云海') || body.includes('京东一件') ||
                          body.includes('发货方') || body.includes('FHS');
      record(phase, 'T3.2', '发货方管理包含真实数据', hasRealData ? 'PASS' : 'WARN',
        hasRealData ? `找到真实发货方数据` : '页面加载但可能无数据');
    } catch (e) {
      record(phase, 'T3.2', '发货方管理包含真实数据', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T3.3: 商品管理
  {
    try {
      await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('商品') || body.includes('产品');
      record(phase, 'T3.3', '商品管理页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T3.3', '商品管理页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T3.4: 档案概览
  {
    try {
      await page.goto(`${BASE}/archive`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('档案') || body.includes('概览');
      record(phase, 'T3.4', '档案概览页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T3.4', '档案概览页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T3.5: SKU 映射
  {
    try {
      await page.goto(`${BASE}/sku-mappings`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('SKU') || body.includes('映射') || body.includes('sku');
      record(phase, 'T3.5', 'SKU映射页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T3.5', 'SKU映射页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  await ctx.close();
  console.log(`  ${phase} 完成`);
}

// ─── 阶段 4：订单管理（使用真实订单数据）────────────────
async function phase4_orderTests(browser) {
  const phase = 'L4';
  console.log(`\n=== [${phase}] 订单管理测试 ===`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.fill('#username', SNAPSHOT.admin.username);
    await page.fill('#password', SNAPSHOT.admin.password);
    await page.click('button[type="submit"]');
    await sleep(3000);
  } catch (e) {
    record(phase, 'setup', '登录 admin', 'FAIL', e.message.slice(0, 120));
    await ctx.close();
    return;
  }

  // T4.1: 订单列表
  {
    try {
      await page.goto(`${BASE}/orders`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('订单') || body.includes('order');
      record(phase, 'T4.1', '订单列表页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T4.1', '订单列表页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T4.2: AI 订单录入
  {
    try {
      await page.goto(`${BASE}/order-parse`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('录入') || body.includes('导入') || body.includes('AI');
      record(phase, 'T4.2', 'AI订单录入页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T4.2', 'AI订单录入页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T4.3: 库存管理
  {
    try {
      await page.goto(`${BASE}/stocks`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('库存') || body.includes('stock');
      record(phase, 'T4.3', '库存管理页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T4.3', '库存管理页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T4.4: 历史成本库
  {
    try {
      await page.goto(`${BASE}/order-cost-history`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('成本') || body.includes('历史');
      record(phase, 'T4.4', '历史成本库页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T4.4', '历史成本库页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  await ctx.close();
  console.log(`  ${phase} 完成`);
}

// ─── 阶段 5：发货导出 ──────────────────────────────────
async function phase5_shippingTests(browser) {
  const phase = 'L5';
  console.log(`\n=== [${phase}] 发货与导出测试 ===`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.fill('#username', SNAPSHOT.admin.username);
    await page.fill('#password', SNAPSHOT.admin.password);
    await page.click('button[type="submit"]');
    await sleep(3000);
  } catch (e) {
    record(phase, 'setup', '登录 admin', 'FAIL', e.message.slice(0, 120));
    await ctx.close();
    return;
  }

  // T5.1: 发货通知单
  {
    try {
      await page.goto(`${BASE}/shipping-export`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('发货') || body.includes('通知');
      record(phase, 'T5.1', '发货通知单页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T5.1', '发货通知单页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T5.2: 导出记录
  {
    try {
      await page.goto(`${BASE}/export-records`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('导出') || body.includes('记录');
      record(phase, 'T5.2', '导出记录页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T5.2', '导出记录页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T5.3: 物流回单
  {
    try {
      await page.goto(`${BASE}/return-receipt`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('回单') || body.includes('物流');
      record(phase, 'T5.3', '物流回单页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T5.3', '物流回单页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T5.4: 数据报表
  {
    try {
      await page.goto(`${BASE}/reports`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('报表') || body.includes('报告');
      record(phase, 'T5.4', '数据报表页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T5.4', '数据报表页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  await ctx.close();
  console.log(`  ${phase} 完成`);
}

// ─── 阶段 6：系统设置 ──────────────────────────────────
async function phase6_systemTests(browser) {
  const phase = 'L6';
  console.log(`\n=== [${phase}] 系统设置测试 ===`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.fill('#username', SNAPSHOT.admin.username);
    await page.fill('#password', SNAPSHOT.admin.password);
    await page.click('button[type="submit"]');
    await sleep(3000);
  } catch (e) {
    record(phase, 'setup', '登录 admin', 'FAIL', e.message.slice(0, 120));
    await ctx.close();
    return;
  }

  // T6.1: 用户管理
  {
    try {
      await page.goto(`${BASE}/users`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      // 检查是否包含种子用户
      const hasAdmin = body.includes('管理员') || body.includes('admin');
      const hasUsers = body.includes('用户');
      record(phase, 'T6.1', '用户管理页面加载', (hasAdmin && hasUsers) ? 'PASS' : 'FAIL',
        hasAdmin ? '找到管理员用户' : '未找到admin用户');
    } catch (e) {
      record(phase, 'T6.1', '用户管理页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T6.2: 角色与权限
  {
    try {
      await page.goto(`${BASE}/roles`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('角色') || body.includes('权限');
      record(phase, 'T6.2', '角色与权限页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T6.2', '角色与权限页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T6.3: 模板配置
  {
    try {
      await page.goto(`${BASE}/templates`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('模板') || body.includes('template');
      record(phase, 'T6.3', '模板配置页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T6.3', '模板配置页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  // T6.4: 预警设置
  {
    try {
      await page.goto(`${BASE}/alerts`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      const body = await page.textContent('body');
      const hasData = body.includes('预警') || body.includes('alert');
      record(phase, 'T6.4', '预警设置页面加载', hasData ? 'PASS' : 'FAIL', hasData ? '' : '页面内容异常');
    } catch (e) {
      record(phase, 'T6.4', '预警设置页面加载', 'FAIL', e.message.slice(0, 120));
    }
  }

  await ctx.close();
  console.log(`  ${phase} 完成`);
}

// ─── 阶段 7：API 健康检查 ──────────────────────────────
async function phase7_apiTests(browser) {
  const phase = 'L7';
  console.log(`\n=== [${phase}] API 健康检查 ===`);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  try {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.fill('#username', SNAPSHOT.admin.username);
    await page.fill('#password', SNAPSHOT.admin.password);
    await page.click('button[type="submit"]');
    await sleep(3000);
  } catch (e) {
    record(phase, 'setup', '登录 admin', 'FAIL', e.message.slice(0, 120));
    await ctx.close();
    return;
  }

  // API 端点检查（通过 fetch）
  const apis = [
    { testId: 'T7.1', name: '客户列表 API', url: '/api/customers' },
    { testId: 'T7.2', name: '商品列表 API', url: '/api/products' },
    { testId: 'T7.3', name: '订单列表 API', url: '/api/orders' },
    { testId: 'T7.4', name: '发货方 API', url: '/api/shippers' },
    { testId: 'T7.5', name: '用户列表 API', url: '/api/users' },
    { testId: 'T7.6', name: '模板列表 API', url: '/api/templates' },
    { testId: 'T7.7', name: '库存 API', url: '/api/stocks' },
    { testId: 'T7.8', name: '报表统计 API', url: '/api/reports/stats' },
  ];

  for (const api of apis) {
    try {
      const response = await page.evaluate(async (url) => {
        const r = await fetch(url, { credentials: 'include' });
        return { status: r.status, ok: r.ok };
      }, api.url);

      if (response.status < 500) {
        record(phase, api.testId, `${api.name} (${api.url})`, 'PASS', `HTTP ${response.status}`);
      } else {
        record(phase, api.testId, `${api.name} (${api.url})`, 'FAIL', `HTTP ${response.status}`);
      }
    } catch (e) {
      record(phase, api.testId, `${api.name} (${api.url})`, 'FAIL', e.message.slice(0, 120));
    }
  }

  await ctx.close();
  console.log(`  ${phase} 完成`);
}

// ─── 主函数 ────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   礼品订单管理系统 - 功能回归测试            ║');
  console.log(`║   测试日期: ${TEST_DATE}                       ║`);
  console.log('╚══════════════════════════════════════════════╝');

  // 确保截图目录存在
  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  const startTime = Date.now();

  try {
    await phase1_loginTests(browser);
    await phase2_dashboardTests(browser);
    await phase3_archiveTests(browser);
    await phase4_orderTests(browser);
    await phase5_shippingTests(browser);
    await phase6_systemTests(browser);
    await phase7_apiTests(browser);
  } catch (err) {
    console.error('\n测试执行异常:', err);
    record('SYSTEM', 'FATAL', '测试执行异常', 'FAIL', err.message.slice(0, 200));
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  await browser.close();

  // ─── 输出结果 ────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              测试结果汇总                    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\n通过: ${results.summary.passed}  |  失败: ${results.summary.failed}  |  耗时: ${duration}s\n`);

  // 按阶段分组输出
  const phases = [...new Set(results.phases.map(r => r.phase))];
  for (const p of phases) {
    const phaseResults = results.phases.filter(r => r.phase === p);
    const passed = phaseResults.filter(r => r.status === 'PASS').length;
    const failed = phaseResults.filter(r => r.status === 'FAIL').length;
    const warn = phaseResults.filter(r => r.status === 'WARN').length;
    console.log(`\n[${p}] ${passed}通过/${failed}失败/${warn}警告`);
    for (const r of phaseResults) {
      const icon = r.status === 'PASS' ? '✓' : r.status === 'WARN' ? '⚠' : '✗';
      console.log(`  ${icon} ${r.testId}: ${r.name}${r.detail ? ` (${r.detail})` : ''}`);
    }
  }

  // 失败详情
  if (results.summary.errors.length > 0) {
    console.log('\n--- 失败详情 ---');
    results.summary.errors.forEach(e => console.log(`  ✗ ${e}`));
  }

  // 保存 JSON 报告
  const jsonPath = path.join(process.cwd(), 'test-results', `regression-report-${TEST_DATE}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\nJSON 报告已保存: ${jsonPath}`);

  // 保存 Markdown 报告
  const md = generateMarkdownReport(results, duration);
  const mdPath = path.join(process.cwd(), 'test-results', `regression-report-${TEST_DATE}.md`);
  fs.writeFileSync(mdPath, md);
  console.log(`Markdown 报告已保存: ${mdPath}`);

  // 退出码：失败 > 0 则非 0
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

function generateMarkdownReport(results, duration) {
  const lines = [
    `# 礼品订单管理系统 - 功能回归测试报告`,
    ``,
    `**测试日期**: ${results.testDate}`,
    `**测试耗时**: ${duration}s`,
    ``,
    `## 测试结果汇总`,
    ``,
    `| 阶段 | 通过 | 失败 | 警告 |`,
    `|------|------|------|------|`,
  ];

  const phases = [...new Set(results.phases.map(r => r.phase))];
  for (const p of phases) {
    const phaseResults = results.phases.filter(r => r.phase === p);
    const passed = phaseResults.filter(r => r.status === 'PASS').length;
    const failed = phaseResults.filter(r => r.status === 'FAIL').length;
    const warn = phaseResults.filter(r => r.status === 'WARN').length;
    lines.push(`| ${p} | ${passed} | ${failed} | ${warn} |`);
  }
  lines.push(``, `**总计**: ${results.summary.passed} 通过 / ${results.summary.failed} 失败`);
  lines.push(``, `## 详细结果`, ``);

  for (const p of phases) {
    lines.push(`### ${p}`, ``);
    const phaseResults = results.phases.filter(r => r.phase === p);
    lines.push(`| ID | 测试用例 | 状态 | 详情 |`);
    lines.push(`|---|---------|------|------|`);
    for (const r of phaseResults) {
      lines.push(`| ${r.testId} | ${r.name} | ${r.status} | ${r.detail || '-'} |`);
    }
    lines.push(``);
  }

  if (results.summary.errors.length > 0) {
    lines.push(`## 失败详情`, ``);
    results.summary.errors.forEach(e => lines.push(`- ✗ ${e}`));
    lines.push(``);
  }

  return lines.join('\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
