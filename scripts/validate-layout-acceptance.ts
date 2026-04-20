import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type Step = {
  name: string;
  cmd: string[];
};

const ACCEPTANCE_DOC_PATH = path.join(
  process.cwd(),
  'docs',
  'codex',
  '2026-04-19-关键页面适配验收清单.md'
);

const REQUIRED_DOC_MARKERS = [
  '## 2. 通用验收项',
  '### 3.1 全局布局',
  '### 3.2 订单录入',
  '### 3.3 订单与导出链路',
  '### 3.4 系统设置与档案管理',
  '## 4. 当前已收口页面',
  '## 6. 回归执行方式',
];

const LAYOUT_TARGETS = [
  'src/app/(app)/layout.tsx',
  'src/app/(app)/page.tsx',
  'src/app/(app)/order-parse/page.tsx',
  'src/app/(app)/orders/page.tsx',
  'src/app/(app)/shipping-export/page.tsx',
  'src/app/(app)/return-receipt/page.tsx',
  'src/app/(app)/export-records/page.tsx',
  'src/app/(app)/users/page.tsx',
  'src/app/(app)/roles/page.tsx',
  'src/app/(app)/alerts/page.tsx',
  'src/app/(app)/templates/page.tsx',
  'src/app/(app)/customers/page.tsx',
  'src/app/(app)/suppliers-manage/page.tsx',
  'src/app/(app)/products/page.tsx',
  'src/app/(app)/sku-mappings/page.tsx',
  'src/app/(app)/archive/page.tsx',
  'src/app/(app)/warehouses-manage/page.tsx',
  'src/app/(app)/stocks/page.tsx',
  'src/app/(app)/reports/page.tsx',
  'src/app/(app)/order-cost-history/page.tsx',
  'src/app/(app)/agent-configs/page.tsx',
  'src/app/(app)/ai-logs/page.tsx',
];

const STEPS: Step[] = [
  { name: 'TypeScript', cmd: ['corepack', 'pnpm', 'ts-check'] },
  {
    name: 'Layout Pages Lint',
    cmd: ['corepack', 'pnpm', 'exec', 'eslint', ...LAYOUT_TARGETS, '--quiet'],
  },
];

async function verifyAcceptanceDoc() {
  const content = await readFile(ACCEPTANCE_DOC_PATH, 'utf8');
  const missing = REQUIRED_DOC_MARKERS.filter((marker) => !content.includes(marker));

  if (missing.length > 0) {
    throw new Error(`关键页面适配验收清单缺少必要章节: ${missing.join(', ')}`);
  }
}

async function runStep(step: Step) {
  await execFileAsync(step.cmd[0], step.cmd.slice(1), {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024 * 10,
  });
}

async function main() {
  console.log('Layout Acceptance');
  console.log('');

  await verifyAcceptanceDoc();
  console.log('PASS Acceptance Doc');

  for (const step of STEPS) {
    await runStep(step);
    console.log(`PASS ${step.name}`);
  }

  console.log('');
  console.log('All layout acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Layout Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
