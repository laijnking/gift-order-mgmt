import { readFile } from 'fs/promises';
import path from 'path';
import {
  buildCustomerMutationData,
  transformCustomerRecord,
  type CustomerSchemaMode,
} from '../src/lib/customer-schema';

interface MutationFixture {
  mode: CustomerSchemaMode;
  payload: Record<string, unknown>;
  expected: Record<string, unknown>;
}

interface TransformFixture {
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}

interface FixtureFile {
  name: string;
  mutations: MutationFixture[];
  transforms: TransformFixture[];
}

function assertRecord(
  label: string,
  actual: Record<string, unknown>,
  expected: Record<string, unknown>
) {
  const mismatches: string[] = [];

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      mismatches.push(`${label}.${key}: expected=${JSON.stringify(expectedValue)} actual=${JSON.stringify(actualValue)}`);
    }
  }

  return mismatches;
}

async function main() {
  const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/customer-schema/customer-schema-basic.json');
  const raw = await readFile(fixturePath, 'utf8');
  const fixture = JSON.parse(raw) as FixtureFile;

  const failures: string[] = [];

  for (const mutation of fixture.mutations) {
    const actual = buildCustomerMutationData(mutation.payload, mutation.mode);
    failures.push(...assertRecord(`mutation:${mutation.mode}`, actual as Record<string, unknown>, mutation.expected));
  }

  for (const transform of fixture.transforms) {
    const actual = transformCustomerRecord(transform.input);
    failures.push(...assertRecord('transform', actual as Record<string, unknown>, transform.expected));
  }

  if (failures.length > 0) {
    console.error(`FAIL ${fixture.name}`);
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`PASS ${fixture.name}`);
  console.log(
    `Validated ${fixture.mutations.length} customer mutation cases and ${fixture.transforms.length} customer transform cases.`
  );
}

main().catch((error) => {
  console.error('Failed to validate customer-schema fixtures:', error);
  process.exitCode = 1;
});
