import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5000';

async function checkOrderParse() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 捕获所有 console 输出
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  console.log('登录并打开AI订单录入页面...');
  
  // 登录
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // 检查登录表单
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.isVisible()) {
    console.log('输入密码并登录...');
    await passwordInput.fill('admin123');
    await page.click('button[type="submit"]');
  }
  
  // 等待页面跳转到首页
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('登录成功，当前URL:', page.url());
  
  // 打开AI订单录入页面
  console.log('打开 /order-parse...');
  await page.goto(`${BASE_URL}/order-parse`, { waitUntil: 'load', timeout: 60000 });
  
  // 等待 React hydration 完成 - 等待特定元素出现
  console.log('等待页面渲染...');
  
  // 尝试等待几个可能的元素
  const elementsToWait = [
    'text=AI订单录入',
    'text=订单录入',
    'text=点击上传',
    'text=拖放',
    'button:has-text("上传")',
  ];
  
  let found = false;
  for (const selector of elementsToWait) {
    try {
      await page.waitForSelector(selector, { timeout: 10000, state: 'attached' });
      console.log(`找到元素: ${selector}`);
      found = true;
      break;
    } catch {
      // 继续尝试下一个
    }
  }
  
  if (!found) {
    console.log('未找到预期的元素，尝试获取页面内容...');
    const text = await page.locator('body').textContent({ timeout: 5000 });
    console.log('页面文本 (前500字符):', text.substring(0, 500));
  }
  
  // 额外等待确保渲染完成
  await page.waitForTimeout(5000);
  
  const text = await page.locator('body').textContent();
  console.log('\n最终页面内容 (前1000字符):');
  console.log(text.substring(0, 1000));
  
  await browser.close();
}

checkOrderParse().catch(console.error);
