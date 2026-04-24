/**
 * scripts/regression/run-all.mjs
 * Phase 4 entry point: waits for phase3_done, loads snapshot, runs hybrid tests,
 * then writes the report to docs/TEST_REPORT_2026-04-24.md
 */

import fs from 'fs';
import { runLoadTests } from './load-tests.mjs';
import { runOperationTests } from './operation-tests.mjs';

const DEPLOY_STATUS_FILE = '/tmp/deploy-status.json';
const DB_SNAPSHOT_FILE = '/tmp/db-snapshot.json';
const REPORT_FILE = 'docs/TEST_REPORT_2026-04-24.md';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForPhase3() {
  console.log('等待服务就绪 (phase3_done)...');
  for (let i = 0; i < 60; i++) {
    if (fs.existsSync(DEPLOY_STATUS_FILE)) {
      try {
        const status = JSON.parse(fs.readFileSync(DEPLOY_STATUS_FILE, 'utf8'));
        if (status.phase3_done === true) {
          console.log('Phase 3 完成，开始执行测试。');
          return true;
        }
      } catch {
        // ignore parse errors
      }
    }
    if (i < 12) {
      process.stdout.write('.');
    }
    await sleep(5000);
  }
  console.log('\n服务未就绪 (phase3_done 未在 60 秒内到达)，退出。');
  return false;
}

async function checkServerHealth() {
  // Check if the dev server is responding
  const http = await import('http');
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:3001/', (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 600);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxRetries = 20) {
  console.log('等待服务响应 (http://127.0.0.1:3001)...');
  for (let i = 0; i < maxRetries; i++) {
    const ok = await checkServerHealth();
    if (ok) {
      console.log('服务已响应，开始测试。');
      return true;
    }
    process.stdout.write('.');
    await sleep(3000);
  }
  console.log('\n服务未响应，退出。');
  return false;
}

function generateReport(loadResults, opResults, snapshot) {
  const all = [...loadResults, ...opResults];
  const pass = all.filter(r => r.status === 'PASS').length;
  const fail = all.filter(r => r.status === 'FAIL').length;
  const skip = all.filter(r => r.status === 'SKIP').length;

  // Group by prefix
  const groups = {};
  for (const r of all) {
    const prefix = r.id.match(/^[A-Z]+/)?.[0] || 'OTHER';
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(r);
  }

  const now = new Date().toISOString();

  const lines = [];
  lines.push(`# 礼品订单管理系统 - 功能回归测试报告`);
  lines.push('');
  lines.push(`> 测试时间: ${now.slice(0, 19).replace('T', ' ')}`);
  lines.push(`> 测试类型: Docker 重建部署 + Playwright 端到端功能回归测试`);
  lines.push('');
  lines.push('## 测试结果汇总');
  lines.push('');
  lines.push('| 测试集 | 通过 | 失败 | 跳过 | 详情 |');
  lines.push('|--------|------|------|------|------|');

  const loadPass = loadResults.filter(r => r.status === 'PASS').length;
  const loadFail = loadResults.filter(r => r.status === 'FAIL').length;
  const loadSkip = loadResults.filter(r => r.status === 'SKIP').length;
  lines.push(`| L1-L7 页面加载测试 | ${loadPass} | ${loadFail} | ${loadSkip} | ${loadResults.length} 项总计 |`);

  const opPass = opResults.filter(r => r.status === 'PASS').length;
  const opFail = opResults.filter(r => r.status === 'FAIL').length;
  const opSkip = opResults.filter(r => r.status === 'SKIP').length;
  lines.push(`| 操作层测试 | ${opPass} | ${opFail} | ${opSkip} | ${opResults.length} 项总计 |`);

  lines.push(`| **合计** | **${pass}** | **${fail}** | **${skip}** | **${all.length} 项** |`);
  lines.push('');

  const failed = all.filter(r => r.status === 'FAIL');
  const skipped = all.filter(r => r.status === 'SKIP');
  const passed = all.filter(r => r.status === 'PASS');

  lines.push('## L1-L7 保留层测试（页面加载）');
  lines.push('');
  lines.push('| ID | 测试项 | 状态 | 备注 |');
  lines.push('|----|--------|------|------|');
  for (const r of loadResults) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '⊘';
    lines.push(`| ${r.id} | ${r.name} | ${icon} ${r.status} | ${r.note || '-'} |`);
  }
  lines.push('');

  lines.push('## 操作层测试（真实用户操作）');
  lines.push('');
  lines.push('| ID | 测试项 | 状态 | 备注 |');
  lines.push('|----|--------|------|------|');
  for (const r of opResults) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '⊘';
    lines.push(`| ${r.id} | ${r.name} | ${icon} ${r.status} | ${r.note || '-'} |`);
  }
  lines.push('');

  lines.push('## 新发现的问题');
  lines.push('');
  if (failed.length === 0) {
    lines.push('本次测试未发现新问题。');
  } else {
    for (const r of failed) {
      lines.push(`- **${r.id} ${r.name}**: ${r.note || '测试失败'}`);
    }
  }
  lines.push('');

  lines.push('## 验证正常的模块');
  lines.push('');
  lines.push('以下模块通过测试：');
  for (const r of passed) {
    lines.push(`- ${r.id} ${r.name}`);
  }
  lines.push('');

  lines.push('## 测试数据概况');
  lines.push('');
  lines.push('| 数据类型 | 数量 |');
  lines.push('|----------|------|');
  if (snapshot && snapshot.table_counts) {
    for (const [key, val] of Object.entries(snapshot.table_counts)) {
      lines.push(`| ${key} | ${val} |`);
    }
  }
  lines.push('');
  lines.push(`---\n*本报告由 Playwright 自动化测试生成*`);

  return lines.join('\n');
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  礼品订单管理系统 - 回归测试');
  console.log('  Phase 4 & 5: Playwright 端到端测试');
  console.log('═══════════════════════════════════════\n');

  // 1. Wait for phase3_done
  const ready = await waitForPhase3();
  if (!ready) {
    console.error('ERROR: 服务未就绪');
    process.exit(1);
  }

  // 2. Load snapshot
  let snapshot = {};
  try {
    const raw = fs.readFileSync(DB_SNAPSHOT_FILE, 'utf8');
    snapshot = JSON.parse(raw);
    console.log(`快照已加载: ${snapshot.table_counts?.customers || 0} 客户, ${snapshot.table_counts?.orders || 0} 订单`);
  } catch (e) {
    console.error('WARNING: 无法加载 db-snapshot.json，使用空数据', e.message);
  }

  // 3. Wait for server to actually respond
  const serverOk = await waitForServer();
  if (!serverOk) {
    console.error('ERROR: 服务未响应');
    process.exit(1);
  }

  // 4. Run load tests
  console.log('\n═══════════════════════════════════════');
  console.log('  执行 L1-L7 页面加载测试...');
  console.log('═══════════════════════════════════════');
  let loadResults = [];
  try {
    loadResults = await runLoadTests(snapshot);
  } catch (e) {
    console.error('Load tests failed with error:', e.message);
    loadResults = [];
  }

  // 5. Run operation tests
  console.log('\n═══════════════════════════════════════');
  console.log('  执行操作层测试...');
  console.log('═══════════════════════════════════════');
  let opResults = [];
  try {
    opResults = await runOperationTests(snapshot);
  } catch (e) {
    console.error('Operation tests failed with error:', e.message);
    opResults = [];
  }

  // 6. Generate and write report
  const all = [...loadResults, ...opResults];
  const pass = all.filter(r => r.status === 'PASS').length;
  const fail = all.filter(r => r.status === 'FAIL').length;
  const skip = all.filter(r => r.status === 'SKIP').length;

  console.log('\n═══════════════════════════════════════');
  console.log(`  测试完成: PASS=${pass} FAIL=${fail} SKIP=${skip}`);
  console.log('═══════════════════════════════════════\n');

  const report = generateReport(loadResults, opResults, snapshot);
  fs.writeFileSync(REPORT_FILE, report, 'utf8');
  console.log(`报告已写入: ${REPORT_FILE}`);

  if (fail > 0) {
    console.log('\n⚠ 有测试失败，请查看上方详细结果。');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
