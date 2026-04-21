import { readFile } from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const REGRESSION_ENTRYPOINTS = [
  'check:unattended-acceptance',
  'check:api-contracts',
  'check:local-acceptance',
  'check:export-acceptance',
  'check:export-api-acceptance',
  'check:order-receipt-api-acceptance',
  'check:backend-heavy-acceptance',
  'check:permissions',
] as const;

type ChecklistItem = {
  status: 'pending' | 'in_progress' | 'done';
  text: string;
};

type ChecklistSection = {
  title: string;
  items: ChecklistItem[];
};

function parseChecklist(content: string): ChecklistSection[] {
  const lines = content.split('\n');
  const sections: ChecklistSection[] = [];
  let currentSection: ChecklistSection | null = null;

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1].trim(),
        items: [],
      };
      sections.push(currentSection);
      continue;
    }

    const itemMatch = line.match(/^- \[( |-|x)\]\s+(.+)$/);
    if (itemMatch && currentSection) {
      const rawStatus = itemMatch[1];
      currentSection.items.push({
        status:
          rawStatus === 'x'
            ? 'done'
            : rawStatus === '-'
              ? 'in_progress'
              : 'pending',
        text: itemMatch[2].trim(),
      });
    }
  }

  return sections;
}

function getSectionSummary(section: ChecklistSection) {
  const total = section.items.length;
  const done = section.items.filter((item) => item.status === 'done').length;
  const inProgress = section.items.filter((item) => item.status === 'in_progress').length;
  const pending = total - done - inProgress;

  return { total, done, inProgress, pending };
}

function extractQueueBlockers(content: string) {
  const lines = content.split('\n');
  const blockers: string[] = [];
  let inBlockers = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '当前阻塞事实：') {
      inBlockers = true;
      continue;
    }

    if (inBlockers) {
      if (trimmed.startsWith('## ')) {
        break;
      }
      if (trimmed.startsWith('- ')) {
        blockers.push(trimmed.slice(2));
      }
    }
  }

  return blockers;
}

async function getGitStatus(projectRoot: string) {
  const { stdout } = await execFileAsync('git', ['status', '--short'], {
    cwd: projectRoot,
  });

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

async function getPackageScripts(projectRoot: string) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageContent = await readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageContent) as { scripts?: Record<string, string> };
  return packageJson.scripts || {};
}

async function main() {
  const projectRoot = process.cwd();
  const checklistPath = path.join(projectRoot, 'docs/codex/UNATTENDED_EXECUTION_CHECKLIST.md');
  const nextActionPath = path.join(projectRoot, 'docs/codex/NEXT_ACTION.md');
  const queuePath = path.join(projectRoot, 'docs/codex/UNATTENDED_QUEUE.md');

  const [checklistContent, nextActionContent, queueContent, gitStatus, scripts] = await Promise.all([
    readFile(checklistPath, 'utf8'),
    readFile(nextActionPath, 'utf8'),
    readFile(queuePath, 'utf8'),
    getGitStatus(projectRoot),
    getPackageScripts(projectRoot),
  ]);

  const sections = parseChecklist(checklistContent);
  const blockers = extractQueueBlockers(queueContent);
  const nextActionLine = nextActionContent
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /^\d+\.\s+/.test(line));

  console.log('Unattended Progress Report');
  console.log('');
  console.log(`Next action: ${nextActionLine || '未设置'}`);
  console.log('');
  console.log('Checklist summary:');

  for (const section of sections) {
    const summary = getSectionSummary(section);
    if (summary.total === 0) continue;
    console.log(
      `- ${section.title}: done ${summary.done}/${summary.total}, in progress ${summary.inProgress}, pending ${summary.pending}`
    );
  }

  console.log('');
  console.log('Current in-progress items:');
  const inProgressItems = sections.flatMap((section) =>
    section.items
      .filter((item) => item.status === 'in_progress')
      .map((item) => `- ${section.title}: ${item.text}`)
  );

  if (inProgressItems.length === 0) {
    console.log('- 无');
  } else {
    for (const item of inProgressItems) {
      console.log(item);
    }
  }

  console.log('');
  console.log('Regression entrypoints:');
  for (const command of REGRESSION_ENTRYPOINTS) {
    const script = scripts[command];
    console.log(`- ${command}: ${script ? 'ready' : 'missing'}`);
  }

  console.log('');
  console.log('Current blockers:');
  if (blockers.length === 0) {
    console.log('- 无');
  } else {
    for (const blocker of blockers) {
      console.log(`- ${blocker}`);
    }
  }

  console.log('');
  console.log('Working tree:');
  if (gitStatus.length === 0) {
    console.log('- clean');
  } else {
    for (const line of gitStatus.slice(0, 20)) {
      console.log(`- ${line}`);
    }
    if (gitStatus.length > 20) {
      console.log(`- ...and ${gitStatus.length - 20} more`);
    }
  }
}

main().catch((error) => {
  console.error('Failed to check unattended progress:', error);
  process.exitCode = 1;
});
