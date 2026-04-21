import { runSteps, type Step } from './lib/step-runner';

const STEPS: Step[] = [
  { name: 'Local Fixtures', cmd: ['corepack', 'pnpm', 'check:local-fixtures'] },
  { name: 'Layout Acceptance', cmd: ['corepack', 'pnpm', 'check:layout-acceptance'] },
  { name: 'Export Acceptance', cmd: ['corepack', 'pnpm', 'check:export-acceptance'] },
];
async function main() {
  console.log('Local Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All local acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Local Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
