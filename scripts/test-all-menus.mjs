import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5000';

const menus = [
  { name: '首页', href: '/' },
  { name: '订单中心', href: '/orders' },
  { name: 'AI订单录入', href: '/order-parse' },
  { name: '发货通知单', href: '/shipping-export' },
  { name: '物流回单', href: '/return-receipt' },
  { name: '客户回单', href: '/export-records' },
  { name: '库存管理', href: '/stocks' },
  { name: '历史成本库', href: '/order-cost-history' },
  { name: '数据报表', href: '/reports' },
  { name: '档案概览', href: '/archive' },
  { name: '客户管理', href: '/customers' },
  { name: '发货方管理', href: '/suppliers-manage' },
  { name: '商品管理', href: '/products' },
  { name: 'SKU映射', href: '/sku-mappings' },
  { name: '用户管理', href: '/users' },
  { name: '角色与权限', href: '/roles' },
  { name: '预警设置', href: '/alerts' },
  { name: '模板配置', href: '/templates' },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function isRealError(text, url) {
  // Ignore WebSocket HMR noise
  if (text.includes('webpack-hmr') || text.includes('WebSocket')) return false;
  // Ignore "Failed to fetch" when it's about a 401 from a prior page (navigation timing)
  if (text.includes('Failed to fetch') && url.includes('/orders')) return false;
  return true;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const allErrors = [];
  const pageResults = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const loc = msg.location();
      const text = msg.text();
      const url = loc.url || '';
      const key = `${url}:${loc.lineNumber}`;
      if (isRealError(text, url)) {
        if (!allErrors.some(e => e.key === key)) {
          allErrors.push({ key, url, text, page: '' });
        }
      }
    }
  });

  page.on('pageerror', (err) => {
    allErrors.push({ key: err.message, url: 'pageerror', text: err.message, page: '' });
  });

  page.on('response', (res) => {
    if (!res.url().startsWith(BASE)) return;
    const status = res.status();
    const path = res.url().replace(BASE, '');
    if (status >= 400 && !path.includes('webpack-hmr')) {
      const key = `${status} ${path}`;
      if (!allErrors.some(e => e.key === key)) {
        allErrors.push({ key, url: res.url(), text: `HTTP ${status}: ${path}`, page: '' });
      }
    }
  });

  console.log('=== 礼品订单管理系统 - 全菜单测试 ===\n');

  // Login
  console.log('[1/3] 登录中...');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('  登录完成\n');

  // Visit pages
  console.log('[2/3] 遍历菜单页面...\n');
  for (const menu of menus) {
    const errorsBefore = allErrors.length;
    const pagesBefore = allErrors.length;

    try {
      await page.goto(`${BASE}${menu.href}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(2000);

      const newErrors = allErrors.slice(errorsBefore);
      const realErrors = newErrors.filter(e => {
        if (e.url === 'pageerror') return true;
        return true;
      });

      // Assign pages to errors
      realErrors.forEach(e => { e.page = menu.name; });

      const result = {
        name: menu.name,
        href: menu.href,
        status: realErrors.length > 0 ? 'error' : 'ok',
        errorCount: realErrors.length,
        notes: [],
      };

      realErrors.forEach(e => {
        result.notes.push(e.text.slice(0, 150));
      });

      const icon = result.status === 'ok' ? '✓' : '✗';
      console.log(`  ${icon} ${menu.name} (${menu.href})`);
      result.notes.forEach(n => console.log(`      └─ ${n}`));

      pageResults.push(result);
    } catch (err) {
      pageResults.push({ name: menu.name, href: menu.href, status: 'timeout', errorCount: 0, notes: [`超时: ${err.message}`] });
      console.log(`  ✗ ${menu.name} (${menu.href}) - 超时`);
    }
  }

  // Summary
  console.log('\n=== 测试结果汇总 ===\n');

  const ok = pageResults.filter(r => r.status === 'ok').length;
  const err = pageResults.filter(r => r.status === 'error').length;
  const to = pageResults.filter(r => r.status === 'timeout').length;
  console.log(`正常: ${ok}  异常: ${err}  超时: ${to}\n`);

  const bad = pageResults.filter(r => r.status !== 'ok');
  if (bad.length > 0) {
    console.log('--- 有问题的页面 ---');
    for (const p of bad) {
      console.log(`  ✗ ${p.name} (${p.href})`);
      p.notes.forEach(n => console.log(`      └─ ${n}`));
    }
  } else {
    console.log('  所有页面均正常访问 ✓');
  }

  await browser.close();
}

main().catch(console.error);
