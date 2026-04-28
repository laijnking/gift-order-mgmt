/**
 * Phase 5: 全链路集成测试编排脚本
 *
 * 按顺序执行所有测试阶段，收集测试结果，汇总为最终报告。
 * 支持单独执行某个 Phase，也支持一键运行全部。
 *
 * 用法:
 *   node --import tsx scripts/validate-full-integration.ts           # 运行全部
 *   node --import tsx scripts/validate-full-integration.ts --phase=0  # 仅 Phase 0
 *   node --import tsx scripts/validate-full-integration.ts --phase=3  # 仅 Phase 3 (Playwright)
 */

import { spawn } from 'child_process';

type PhaseResult = {
  phase: string;
  name: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  error?: string;
};

const PHASES = [
  { id: '0', name: '数据快照验证', cmd: ['node', '--import', 'tsx', 'scripts/validate-data-snapshot.ts'] },
  { id: '1', name: '档案管理模块 API', cmd: ['node', '--import', 'tsx', 'scripts/validate-api-archive-modules.ts'] },
  { id: '2', name: '订单全流程 API', cmd: ['node', '--import', 'tsx', 'scripts/validate-order-full-flow.ts'] },
  { id: '4', name: '权限回归测试', cmd: ['corepack', 'pnpm', 'check:permissions'] },
  {
    id: '3',
    name: 'Playwright E2E 测试',
    cmd: ['npx', 'playwright', 'test', 'scripts/e2e/full-flow.spec.ts', '--reporter=list'],
  },
];

const results: PhaseResult[] = [];
const startTime = Date.now();

// 解析命令行参数
const runAll = !process.argv.includes('--phase=');
const targetPhase = process.argv.find((a) => a.startsWith('--phase='))?.split('=')[1] ?? '';

function log(msg: string) {
  console.log(msg);
}

function logSeparator(title: string) {
  console.log('');
  console.log('='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

async function runCommand(cmd: string[], cwd?: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd[0], cmd.slice(1), {
      cwd: cwd || process.cwd(),
      stdio: 'pipe',
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('error', (err) => {
      stderr += err.message;
    });

    child.on('close', (code) => {
      resolve({ exitCode: code ?? 0, stdout, stderr });
    });
  });
}

async function runPhase(phase: { id: string; name: string; cmd: string[] }): Promise<PhaseResult> {
  const phaseStart = Date.now();
  logSeparator(`Phase ${phase.id}: ${phase.name}`);

  try {
    const { exitCode, stdout, stderr } = await runCommand(phase.cmd);

    const duration = Date.now() - phaseStart;
    const output = stdout + stderr;

    // 解析通过/失败数（从输出中提取）
    let passed = 0;
    let failed = 0;
    const skipped = 0;

    const passMatch = output.match(/(?:通过|PASS)[^0-9]*(\d+)/g);
    const failMatch = output.match(/(?:失败|FAIL)[^0-9]*(\d+)/g);

    if (passMatch) {
      const nums = passMatch.map((m) => parseInt(m.match(/\d+/)?.[0] ?? '0', 10));
      passed = Math.max(...nums);
    }
    if (failMatch) {
      const nums = failMatch.map((m) => parseInt(m.match(/\d+/)?.[0] ?? '0', 10));
      failed = Math.max(...nums);
    }

    // 如果脚本自己输出了统计，尝试解析
    const statsMatch = output.match(/总计[：:]\s*(\d+)\s*项\s*\|\s*通过[:：]\s*(\d+)\s*\|\s*失败[:：]\s*(\d+)/);
    if (statsMatch) {
      const total = parseInt(statsMatch[1] ?? '0', 10);
      passed = parseInt(statsMatch[2] ?? '0', 10);
      failed = parseInt(statsMatch[3] ?? '0', 10);
    }

    return {
      phase: phase.id,
      name: phase.name,
      passed,
      failed,
      skipped,
      duration,
      error: exitCode === 0 ? undefined : `Exit code: ${exitCode}`,
    };
  } catch (err) {
    const duration = Date.now() - phaseStart;
    return {
      phase: phase.id,
      name: phase.name,
      passed: 0,
      failed: 1,
      skipped: 0,
      duration,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  logSeparator('礼品订单管理系统 - 全链路无人值守测试');
  log(`开始时间: ${new Date().toLocaleString('zh-CN')}`);
  log(`环境: ${process.env.NODE_ENV || 'development'}`);

  const phasesToRun = runAll
    ? PHASES
    : PHASES.filter((p) => !targetPhase || p.id === targetPhase);

  if (phasesToRun.length === 0) {
    log(`未找到 Phase ${targetPhase}`);
    log(`可用 Phase: ${PHASES.map((p) => p.id).join(', ')}`);
    process.exit(1);
  }

  log(`将执行 ${phasesToRun.length} 个 Phase: ${phasesToRun.map((p) => `P${p.id}`).join(' -> ')}`);
  log('');

  for (const phase of phasesToRun) {
    const result = await runPhase(phase);
    results.push(result);

    log('');
    if (result.error) {
      log(`Phase ${result.phase} 完成 (有错误): ${result.duration}ms`);
    } else {
      log(`Phase ${result.phase} 完成: ${result.duration}ms`);
    }
    log('');
  }

  // ================================================================
  // 汇总报告
  // ================================================================
  logSeparator('测试执行汇总');

  const totalDuration = Date.now() - startTime;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const r of results) {
    totalPassed += r.passed;
    totalFailed += r.failed;
    totalSkipped += r.skipped;

    const icon = r.error ? 'FAIL' : r.failed > 0 ? 'FAIL' : 'PASS';
    log(
      `  [${icon}] P${r.phase} ${r.name}: 通过 ${r.passed} / 失败 ${r.failed} / 跳过 ${r.skipped} (${r.duration}ms)`
    );
    if (r.error) {
      log(`       错误: ${r.error}`);
    }
  }

  log('');
  log(`总耗时: ${(totalDuration / 1000).toFixed(1)}s`);
  log(`总计: 通过 ${totalPassed} | 失败 ${totalFailed} | 跳过 ${totalSkipped}`);
  log('');

  // 生成 Markdown 汇总
  logSeparator('Markdown 测试结果汇总');
  console.log(generateMarkdownSummary(results, totalDuration));

  if (totalFailed > 0) {
    log('');
    log('存在失败项，请查看上方详细输出。');
    process.exit(1);
  }

  log('');
  log('所有测试阶段通过！');
  process.exit(0);
}

function generateMarkdownSummary(phaseResults: PhaseResult[], totalDuration: number): string {
  const rows = phaseResults
    .map((r) => {
      const status = r.error || r.failed > 0 ? 'FAIL' : 'PASS';
      return `| P${r.phase} | ${r.name} | ${r.passed} | ${r.failed} | ${r.skipped} | ${r.duration}ms | ${status} |`;
    })
    .join('\n');

  const totalPassed = phaseResults.reduce((s, r) => s + r.passed, 0);
  const totalFailed = phaseResults.reduce((s, r) => s + r.failed, 0);
  const totalSkipped = phaseResults.reduce((s, r) => s + r.skipped, 0);

  return `
| Phase | 测试项 | 通过 | 失败 | 跳过 | 耗时 | 状态 |
|-------|--------|------|------|------|------|------|
${rows}

**汇总**: 通过 ${totalPassed} / 失败 ${totalFailed} / 跳过 ${totalSkipped} | 总耗时: ${(totalDuration / 1000).toFixed(1)}s
`.trim();
}

main().catch((error) => {
  console.error('集成测试执行失败:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
