import { readFile } from 'fs/promises';
import path from 'path';
import { buildAiTestMockResult } from '../src/lib/ai-test-mock';

interface FixtureCase {
  name: string;
  input: string;
  duration: number;
  expected: {
    mode: 'mock';
    message: string;
    agentTestStatus: 'mock';
    logStatus: 'mock';
    outputIncludes: string[];
  };
}

interface FixtureFile {
  cases: FixtureCase[];
}

async function main() {
  const fixturePath = path.join(process.cwd(), 'tests/fixtures/ai-test/ai-test-mock-basic.json');
  const raw = await readFile(fixturePath, 'utf8');
  const fixture = JSON.parse(raw) as FixtureFile;

  let failed = 0;

  for (const testCase of fixture.cases) {
    const result = buildAiTestMockResult(testCase.input, testCase.duration);
    const mismatches: string[] = [];

    if (result.mode !== testCase.expected.mode) {
      mismatches.push(`mode expected=${testCase.expected.mode} actual=${result.mode}`);
    }
    if (result.message !== testCase.expected.message) {
      mismatches.push(`message expected=${testCase.expected.message} actual=${result.message}`);
    }
    if (result.agentTestStatus !== testCase.expected.agentTestStatus) {
      mismatches.push(
        `agentTestStatus expected=${testCase.expected.agentTestStatus} actual=${result.agentTestStatus}`
      );
    }
    if (result.logStatus !== testCase.expected.logStatus) {
      mismatches.push(`logStatus expected=${testCase.expected.logStatus} actual=${result.logStatus}`);
    }
    if (result.duration !== testCase.duration) {
      mismatches.push(`duration expected=${testCase.duration} actual=${result.duration}`);
    }

    for (const snippet of testCase.expected.outputIncludes) {
      if (!result.output.includes(snippet)) {
        mismatches.push(`output missing snippet=${JSON.stringify(snippet)}`);
      }
    }

    if (mismatches.length > 0) {
      failed += 1;
      console.error(`FAIL ${testCase.name}`);
      for (const mismatch of mismatches) {
        console.error(`  - ${mismatch}`);
      }
      continue;
    }

    console.log(`PASS ${testCase.name}`);
  }

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(`All ${fixture.cases.length} ai-test mock fixture cases passed.`);
}

void main();
