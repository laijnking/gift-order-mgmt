import { runSteps, type Step } from './lib/step-runner';

const STEPS: Step[] = [
  { name: 'Local Acceptance', cmd: ['corepack', 'pnpm', 'check:local-acceptance'] },
  { name: 'Export API Acceptance', cmd: ['corepack', 'pnpm', 'check:export-api-acceptance'] },
  { name: 'Order Receipt API Acceptance', cmd: ['corepack', 'pnpm', 'check:order-receipt-api-acceptance'] },
  { name: 'Backend Heavy Acceptance', cmd: ['corepack', 'pnpm', 'check:backend-heavy-acceptance'] },
  { name: 'Permissions Regression', cmd: ['corepack', 'pnpm', 'check:permissions'] },
];
async function main() {
  console.log('Unattended Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All unattended acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Unattended Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
