import { runSteps, type Step } from './lib/step-runner';

const STEPS: Step[] = [
  { name: 'Reports API', cmd: ['corepack', 'pnpm', 'check:api-reports'] },
  { name: 'Alert Executor', cmd: ['corepack', 'pnpm', 'check:alert-executor'] },
  { name: 'Order Cost History', cmd: ['corepack', 'pnpm', 'check:order-cost-history'] },
];
async function main() {
  console.log('Backend Heavy Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All backend heavy acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Backend Heavy Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
