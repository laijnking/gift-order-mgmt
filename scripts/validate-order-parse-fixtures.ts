import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { getColumnMappingDiagnostics } from '../src/lib/column-mapping-diagnostics';
import {
  buildHeaderFingerprint,
  buildTemplateSignature,
  normalizeHeaders,
} from '../src/lib/column-mapping-metadata';

interface OrderParseFixture {
  name: string;
  description?: string;
  headerRow: number;
  headers: string[];
  columnMapping: Record<string, string>;
  rows: Array<Array<string | number | null>>;
  expected: Partial<ReturnType<typeof getColumnMappingDiagnostics>>;
  expectedMetadata?: {
    normalizedHeaders?: string[];
    headerFingerprint?: string;
    templateSignature?: string;
  };
}

async function loadFixtures(fixturesDir: string) {
  const entries = await readdir(fixturesDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  const fixtures: OrderParseFixture[] = [];
  for (const file of files) {
    const filePath = path.join(fixturesDir, file);
    const content = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as Partial<OrderParseFixture>;

    if (!Array.isArray(parsed.headers) || !parsed.columnMapping || !parsed.expected) {
      continue;
    }

    fixtures.push(parsed as OrderParseFixture);
  }

  return fixtures;
}

function assertFixture(fixture: OrderParseFixture) {
  const actual = getColumnMappingDiagnostics(fixture.headers, fixture.columnMapping);
  const mismatches: string[] = [];
  const actualMetadata = {
    normalizedHeaders: normalizeHeaders(fixture.headers),
    headerFingerprint: buildHeaderFingerprint(fixture.headers),
    templateSignature: buildTemplateSignature(
      fixture.columnMapping,
      fixture.headerRow,
      fixture.headers
    ),
  };

  for (const [key, expectedValue] of Object.entries(fixture.expected)) {
    const actualValue = actual[key as keyof typeof actual];
    const expectedText = JSON.stringify(expectedValue);
    const actualText = JSON.stringify(actualValue);

    if (expectedText !== actualText) {
      mismatches.push(`${key}: expected=${expectedText} actual=${actualText}`);
    }
  }

  if (fixture.expectedMetadata) {
    for (const [key, expectedValue] of Object.entries(fixture.expectedMetadata)) {
      const actualValue = actualMetadata[key as keyof typeof actualMetadata];
      const expectedText = JSON.stringify(expectedValue);
      const actualText = JSON.stringify(actualValue);

      if (expectedText !== actualText) {
        mismatches.push(`metadata.${key}: expected=${expectedText} actual=${actualText}`);
      }
    }
  }

  return {
    name: fixture.name,
    success: mismatches.length === 0,
    mismatches,
    actual,
    actualMetadata,
  };
}

async function main() {
  const fixturesDir = path.resolve(process.cwd(), 'tests/fixtures/order-parse');
  const fixtures = await loadFixtures(fixturesDir);

  if (fixtures.length === 0) {
    console.log('No order-parse fixtures found.');
    return;
  }

  let hasFailure = false;

  for (const fixture of fixtures) {
    const result = assertFixture(fixture);
    if (result.success) {
      console.log(`PASS ${fixture.name}`);
      continue;
    }

    hasFailure = true;
    console.error(`FAIL ${fixture.name}`);
    for (const mismatch of result.mismatches) {
      console.error(`  - ${mismatch}`);
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${fixtures.length} order-parse fixtures.`);
}

main().catch((error) => {
  console.error('Failed to validate order-parse fixtures:', error);
  process.exitCode = 1;
});
