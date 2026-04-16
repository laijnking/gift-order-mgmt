import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5000';

async function login() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('打开登录页面...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // 获取页面内容
  const text = await page.locator('body').textContent();
  console.log('登录页面内容:');
  console.log(text.substring(0, 500));
  
  // 查找所有输入框
  const inputs = await page.locator('input').all();
  console.log('\n找到', inputs.length, '个输入框');
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    console.log(`  - type=${type}, name=${name}, placeholder=${placeholder}`);
  }
  
  // 查找所有按钮
  const buttons = await page.locator('button').all();
  console.log('\n找到', buttons.length, '个按钮');
  for (const btn of buttons) {
    const text = await btn.textContent();
    console.log(`  - ${text}`);
  }
  
  await browser.close();
}

login().catch(console.error);
