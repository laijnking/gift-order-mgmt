import { readFile } from 'fs/promises';
import path from 'path';
import {
  getDownloadActionLabel,
  getDownloadHint,
  getDownloadStrategy,
  type ExportArtifactProvider,
} from '@/lib/export-download';

interface FixtureCase {
  name: string;
  provider?: ExportArtifactProvider;
  hasArtifact?: boolean;
  customHint?: string;
  expected: {
    strategy: string;
    actionLabel: string;
    hint: string;
  };
}

interface FixtureFile {
  cases: FixtureCase[];
}

async function main() {
  const fixturePath = path.join(process.cwd(), 'tests', 'fixtures', 'export-interactions', 'export-interactions-basic.json');
  const raw = await readFile(fixturePath, 'utf8');
  const fixture = JSON.parse(raw) as FixtureFile;

  let failed = 0;

  for (const testCase of fixture.cases) {
    const actualStrategy = getDownloadStrategy(testCase.provider, testCase.hasArtifact);
    const actualActionLabel = getDownloadActionLabel(testCase.provider, testCase.hasArtifact);
    const actualHint = getDownloadHint(testCase.provider, testCase.hasArtifact, testCase.customHint);

    const matched =
      actualStrategy === testCase.expected.strategy &&
      actualActionLabel === testCase.expected.actionLabel &&
      actualHint === testCase.expected.hint;

    if (!matched) {
      failed += 1;
      console.error(`FAIL ${testCase.name}`);
      console.error(`  expected strategy=${testCase.expected.strategy}, got ${actualStrategy}`);
      console.error(`  expected actionLabel=${testCase.expected.actionLabel}, got ${actualActionLabel}`);
      console.error(`  expected hint=${testCase.expected.hint}, got ${actualHint}`);
      continue;
    }

    console.log(`PASS ${testCase.name}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All ${fixture.cases.length} export-interaction fixture cases passed.`);
}

void main();
