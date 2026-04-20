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
  '2026-04-19-导出交互验收清单.md'
);

const REQUIRED_DOC_MARKERS = [
  '## 2. 通用验收项',
  '### 4.1 发货通知导出页',
  '### 4.2 导出记录页',
  '## 5. 固定校验命令',
  '## 6. 当前基线',
];

const STEPS: Step[] = [
  { name: 'TypeScript', cmd: ['corepack', 'pnpm', 'ts-check'] },
  {
    name: 'Export UI Lint',
    cmd: [
      'corepack',
      'pnpm',
      'exec',
      'eslint',
      'src/lib/export-download.ts',
      'src/app/(app)/export-records/page.tsx',
      'src/app/(app)/shipping-export/page.tsx',
      'scripts/validate-export-ui.ts',
      'scripts/validate-business-smoke.ts',
      '--quiet',
    ],
  },
  { name: 'Export Record Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:export-records'] },
  { name: 'Export Result Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:export-results'] },
  { name: 'Export Interaction Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:export-interactions'] },
  { name: 'Export UI Validation', cmd: ['corepack', 'pnpm', 'check:export-ui'] },
  { name: 'Business Smoke', cmd: ['corepack', 'pnpm', 'check:business-smoke'] },
];

async function verifyAcceptanceDoc() {
  const content = await readFile(ACCEPTANCE_DOC_PATH, 'utf8');
  const missing = REQUIRED_DOC_MARKERS.filter((marker) => !content.includes(marker));

  if (missing.length > 0) {
    throw new Error(`导出交互验收清单缺少必要章节: ${missing.join(', ')}`);
  }
}

async function runStep(step: Step) {
  await execFileAsync(step.cmd[0], step.cmd.slice(1), {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024 * 10,
  });
}

async function main() {
  console.log('Export Interaction Acceptance');
  console.log('');

  await verifyAcceptanceDoc();
  console.log('PASS Acceptance Doc');

  for (const step of STEPS) {
    await runStep(step);
    console.log(`PASS ${step.name}`);
  }

  console.log('');
  console.log('All export interaction acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Export Interaction Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
