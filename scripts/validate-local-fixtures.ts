import { runSteps, type Step } from './lib/step-runner';

const FIXTURE_TARGETS = [
  'src/lib/customer-schema.ts',
  'src/lib/order-parse-excel.ts',
  'src/lib/ai-test-mock.ts',
  'scripts/validate-customer-schema-fixtures.ts',
  'scripts/validate-order-parse-fixtures.ts',
  'scripts/validate-order-parse-excel-fixtures.ts',
  'scripts/validate-ai-test-mock-fixtures.ts',
];

const STEPS: Step[] = [
  { name: 'TypeScript', cmd: ['corepack', 'pnpm', 'ts-check'] },
  {
    name: 'Fixture Lint',
    cmd: ['corepack', 'pnpm', 'exec', 'eslint', ...FIXTURE_TARGETS, '--quiet'],
  },
  { name: 'Customer Schema Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:customer-schema'] },
  { name: 'Order Parse Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:order-parse'] },
  { name: 'Order Parse Excel Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:order-parse-excel'] },
  { name: 'AI Test Fixtures', cmd: ['corepack', 'pnpm', 'fixtures:ai-test'] },
];
async function main() {
  console.log('Local Fixture Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All local fixture checks passed.');
}

main().catch((error) => {
  console.error('FAIL Local Fixture Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
