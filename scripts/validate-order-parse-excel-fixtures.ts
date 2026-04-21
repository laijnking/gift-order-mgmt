import { readFile } from 'fs/promises';
import path from 'path';
import {
  buildExcelPreviewRows,
  normalizeExcelSheetRows,
  resolveExcelParsePayload,
} from '../src/lib/order-parse-excel';

interface FixtureCase {
  name: string;
  rows: Array<Array<string | number | boolean | null>>;
  headerRow: number;
  previewLimit?: number;
  expected: {
    normalizedRowCount: number;
    previewRowCount: number;
    headerCount: number;
    dataRowCount: number;
    lastDataRowFirstCell: string;
  };
}

interface FixtureFile {
  name: string;
  cases: FixtureCase[];
}

function assertCase(testCase: FixtureCase) {
  const normalizedRows = normalizeExcelSheetRows(testCase.rows);
  const previewRows = buildExcelPreviewRows(normalizedRows, testCase.previewLimit ?? 20);
  const { headers, dataRows } = resolveExcelParsePayload(normalizedRows, previewRows, testCase.headerRow);

  const actual = {
    normalizedRowCount: normalizedRows.length,
    previewRowCount: previewRows.length,
    headerCount: headers.length,
    dataRowCount: dataRows.length,
    lastDataRowFirstCell: dataRows[dataRows.length - 1]?.[0] || '',
  };

  const mismatches: string[] = [];
  for (const [key, expectedValue] of Object.entries(testCase.expected)) {
    const actualValue = actual[key as keyof typeof actual];
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      mismatches.push(`${key}: expected=${JSON.stringify(expectedValue)} actual=${JSON.stringify(actualValue)}`);
    }
  }

  return { actual, mismatches };
}

async function main() {
  const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/order-parse/excel-sheet-payload.json');
  const raw = await readFile(fixturePath, 'utf8');
  const fixture = JSON.parse(raw) as FixtureFile;

  let hasFailure = false;

  for (const testCase of fixture.cases) {
    const result = assertCase(testCase);
    if (result.mismatches.length === 0) {
      console.log(`PASS ${testCase.name}`);
      continue;
    }

    hasFailure = true;
    console.error(`FAIL ${testCase.name}`);
    for (const mismatch of result.mismatches) {
      console.error(`  - ${mismatch}`);
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${fixture.cases.length} order-parse Excel payload fixture cases.`);
}

main().catch((error) => {
  console.error('Failed to validate order-parse Excel fixtures:', error);
  process.exitCode = 1;
});
