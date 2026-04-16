import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5000';

async function debugPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    console.log('Console:', msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('Page Error:', err.message);
  });

  console.log('打开首页...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('当前URL:', url);
  
  const bodyHTML = await page.content();
  console.log('HTML长度:', bodyHTML.length);
  console.log('HTML预览:', bodyHTML.substring(0, 2000));
  
  const bodyText = await page.locator('body').textContent();
  console.log('Body文本:', bodyText);
  
  // 检查页面元素
  const allButtons = await page.locator('button').allTextContents();
  console.log('所有按钮:', allButtons);
  
  const allInputs = await page.locator('input').count();
  console.log('输入框数量:', allInputs);
  
  await browser.close();
}

debugPage().catch(console.error);
