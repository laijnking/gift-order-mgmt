import { runSteps, type Step } from './lib/step-runner';

const STEPS: Step[] = [
  { name: 'Orders API', cmd: ['corepack', 'pnpm', 'check:api-orders'] },
  { name: 'Orders Duplicate API', cmd: ['corepack', 'pnpm', 'check:api-orders-duplicates'] },
  { name: 'Return Receipts API', cmd: ['corepack', 'pnpm', 'check:api-return-receipts'] },
  { name: 'Return Receipts Duplicate API', cmd: ['corepack', 'pnpm', 'check:api-return-receipts-duplicates'] },
];
async function main() {
  console.log('Order Receipt API Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All order/receipt API acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL Order Receipt API Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
