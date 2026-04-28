/**
 * 验证 order-parse/page.tsx 组件集成进度
 *
 * 检查以下内容：
 * 1. 组件文件存在并正确导出
 * 2. page.tsx 导入了所有必要组件
 * 3. page.tsx 中的内联 JSX 已被组件替换
 * 4. props 类型兼容（无 any 使用）
 * 5. page.tsx 行数降至目标阈值以下
 *
 * 用法：
 *   npx tsx scripts/validate-order-parse-component-integration.ts
 */

import { readFile } from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const PAGE_FILE = path.join(PROJECT_ROOT, 'src/app/(app)/order-parse/page.tsx');
const COMPONENTS_DIR = path.join(PROJECT_ROOT, 'src/app/(app)/order-parse/components');

interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: CheckResult[] = [];
let totalChecks = 0;
let passedChecks = 0;

function check(name: string, passed: boolean, detail?: string) {
  totalChecks++;
  if (passed) passedChecks++;
  results.push({ name, passed, detail });
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fileContains(filePath: string, pattern: string | RegExp): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf8');
    if (pattern instanceof RegExp) {
      return pattern.test(content);
    }
    return content.includes(pattern);
  } catch {
    return false;
  }
}

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return -1;
  }
}

async function main() {
  console.log('');
  console.log('============================================================');
  console.log('Order Parse Component Integration Validation');
  console.log('============================================================');
  console.log('');

  // ===== 1. 组件文件存在性检查 =====
  console.log('[ 1/6 ] 组件文件存在性检查');

  const componentFiles = [
    'input-panel.tsx',
    'customer-selector.tsx',
    'column-mapping-ui.tsx',
    'excel-upload.tsx',
    'text-input.tsx',
    'parse-button.tsx',
    'order-preview-panel.tsx',
    'order-list.tsx',
    'order-card.tsx',
    'order-stats.tsx',
    'mapping-history-dialog.tsx',
    'import-result-dialog.tsx',
  ];

  for (const file of componentFiles) {
    const filePath = path.join(COMPONENTS_DIR, file);
    const exists = await fileExists(filePath);
    check(`组件文件 ${file} 存在`, exists, exists ? `${filePath}` : 'NOT FOUND');
  }

  // ===== 2. 组件导出检查 =====
  console.log('');
  console.log('[ 2/6 ] 组件导出检查');

  const componentExports = [
    { file: 'input-panel.tsx', exportName: 'InputPanel' },
    { file: 'customer-selector.tsx', exportName: 'CustomerSelector' },
    { file: 'column-mapping-ui.tsx', exportName: 'ColumnMappingUI' },
    { file: 'excel-upload.tsx', exportName: 'ExcelUpload' },
    { file: 'text-input.tsx', exportName: 'TextInput' },
    { file: 'parse-button.tsx', exportName: 'ParseButton' },
    { file: 'order-preview-panel.tsx', exportName: 'OrderPreviewPanel' },
    { file: 'order-list.tsx', exportName: 'OrderList' },
    { file: 'order-card.tsx', exportName: 'OrderCard' },
    { file: 'order-stats.tsx', exportName: 'OrderStats' },
    { file: 'mapping-history-dialog.tsx', exportName: 'MappingHistoryDialog' },
    { file: 'import-result-dialog.tsx', exportName: 'ImportResultDialog' },
  ];

  for (const { file, exportName } of componentExports) {
    const filePath = path.join(COMPONENTS_DIR, file);
    const content = await readFile(filePath, 'utf8');
    const exported = content.includes(`export function ${exportName}`) ||
                     content.includes(`export const ${exportName}`) ||
                     content.includes(`export { ${exportName}`);
    check(`${exportName} 已从 ${file} 导出`, exported);
  }

  // ===== 3. page.tsx 导入检查 =====
  console.log('');
  console.log('[ 3/6 ] page.tsx 导入检查（集成进度）');

  const pageImports = [
    { pattern: "from './components/input-panel'", name: '导入 InputPanel' },
    { pattern: "from './components/customer-selector'", name: '导入 CustomerSelector' },
    { pattern: "from './components/order-preview-panel'", name: '导入 OrderPreviewPanel' },
    { pattern: "from './components/import-result-dialog'", name: '导入 ImportResultDialog' },
    { pattern: "from './components/mapping-history-dialog'", name: '导入 MappingHistoryDialog' },
  ];

  const pageContent = await readFile(PAGE_FILE, 'utf8');

  for (const { pattern, name } of pageImports) {
    const imported = pageContent.includes(pattern);
    check(name, imported, imported ? '已集成' : '未集成 — JSX 仍内联');
  }

  // ===== 4. page.tsx 内联 JSX 残留检查 =====
  console.log('');
  console.log('[ 4/6 ] page.tsx 内联 JSX 残留检查');

  const inlinePatterns = [
    {
      pattern: /<Popover>\s*<PopoverTrigger>[\s\S]{0,500}<customers\.map/,
      name: '客户选择 Popover（应被 CustomerSelector 替换）',
    },
    {
      pattern: /<Tabs[\s\S]{0,100}<TabsTrigger value="text"[\s\S]{0,200}<Textarea/,
      name: '文本输入 Tabs（应被 InputPanel 替换）',
    },
    {
      pattern: /<Tabs[\s\S]{0,100}<TabsTrigger value="excel"[\s\S]{0,200}<input[\s\S]{0,200}type="file"/,
      name: 'Excel 上传 Tabs（应被 InputPanel 替换）',
    },
    {
      pattern: /Dialog[\s\S]{0,50}open=\{importResult[\s\S]{0,200}sysOrderNos\.map[\s\S]{0,200}DialogContent[\s\S]{0,200}importResult\.duplicateSummary/,
      name: '导入结果 Dialog（应被 ImportResultDialog 替换）',
    },
    {
      pattern: /Dialog[\s\S]{0,50}open=\{showMappingDialog[\s\S]{0,200}filteredHistory\.map[\s\S]{0,200}DialogContent/,
      name: '映射历史 Dialog（应被 MappingHistoryDialog 替换）',
    },
  ];

  for (const { pattern, name } of inlinePatterns) {
    const found = pattern.test(pageContent);
    check(`${name}`, !found, found ? '仍残留内联 JSX' : '已清除');
  }

  // ===== 5. page.tsx 行数检查 =====
  console.log('');
  console.log('[ 5/6 ] page.tsx 行数检查');

  const lineCount = pageContent.split('\n').length;
  const thresholds = [
    { count: 500, label: '目标阈值（< 500）' },
    { count: 1000, label: '良好（< 1000）' },
    { count: 2000, label: '可接受（< 2000）' },
    { count: 3327, label: '当前基线（3327）' },
  ];

  for (const { count, label } of thresholds) {
    check(`${label}`, lineCount < count, `${lineCount} 行`);
  }

  // ===== 6. props 类型兼容性检查 =====
  console.log('');
  console.log('[ 6/6 ] props 类型兼容性检查（无 any）');

  const anyUsages = (pageContent.match(/\bany\b/g) || []).length;
  check('page.tsx 中不使用 any 类型', anyUsages === 0, anyUsages === 0 ? '无 any' : `${anyUsages} 处使用 any`);

  // 检查组件文件中是否使用 any
  for (const file of ['input-panel.tsx', 'customer-selector.tsx', 'order-preview-panel.tsx']) {
    const filePath = path.join(COMPONENTS_DIR, file);
    try {
      const content = await readFile(filePath, 'utf8');
      const count = (content.match(/\bany\b/g) || []).length;
      check(`${file} 中不使用 any 类型`, count === 0, count === 0 ? '无 any' : `${count} 处使用 any`);
    } catch {
      check(`${file} 读取失败`, false);
    }
  }

  // ===== 汇总 =====
  console.log('');
  console.log('============================================================');
  console.log(`结果：${passedChecks}/${totalChecks} 项检查通过`);
  console.log('============================================================');
  console.log('');

  const integrationRate = pageImports.filter(({ pattern }) =>
    pageContent.includes(pattern)
  ).length / pageImports.length;

  const inlineCleared = inlinePatterns.filter(({ pattern }) =>
    !pattern.test(pageContent)
  ).length / inlinePatterns.length;

  console.log(`组件导入进度：${Math.round(integrationRate * 100)}% (${pageImports.filter(({ pattern }) => pageContent.includes(pattern)).length}/${pageImports.length})`);
  console.log(`内联 JSX 清除率：${Math.round(inlineCleared * 100)}% (${inlinePatterns.filter(({ pattern }) => !pattern.test(pageContent)).length}/${inlinePatterns.length})`);
  console.log(`page.tsx 行数：${lineCount} 行（目标 < 500）`);
  console.log('');

  if (passedChecks < totalChecks) {
    console.log('失败项：');
    for (const r of results) {
      if (!r.passed) {
        console.log(`  ✗ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
      }
    }
    console.log('');
    process.exitCode = 1;
  } else {
    console.log('所有检查通过！组件集成完成。');
  }
}

main().catch((error) => {
  console.error('验证脚本执行失败:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
