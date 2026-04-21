import { runSteps, type Step } from './lib/step-runner';

const STEPS: Step[] = [
  { name: 'Export Feedback API', cmd: ['corepack', 'pnpm', 'check:api-export-feedback'] },
  { name: 'Shipping Exports API', cmd: ['corepack', 'pnpm', 'check:api-shipping-exports'] },
  { name: 'Export Records API', cmd: ['corepack', 'pnpm', 'check:api-export-records'] },
];
async function main() {
  console.log('Export API Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All export API acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Export API Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
