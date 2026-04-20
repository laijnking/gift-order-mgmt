import { readFile } from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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

async function getGitStatus(projectRoot: string) {
  const { stdout } = await execFileAsync('git', ['status', '--short'], {
    cwd: projectRoot,
  });

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

async function main() {
  const projectRoot = process.cwd();
  const checklistPath = path.join(projectRoot, 'docs/codex/UNATTENDED_EXECUTION_CHECKLIST.md');
  const nextActionPath = path.join(projectRoot, 'docs/codex/NEXT_ACTION.md');

  const [checklistContent, nextActionContent, gitStatus] = await Promise.all([
    readFile(checklistPath, 'utf8'),
    readFile(nextActionPath, 'utf8'),
    getGitStatus(projectRoot),
  ]);

  const sections = parseChecklist(checklistContent);
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
