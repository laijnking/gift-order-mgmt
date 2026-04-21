import { runSteps, type Step } from './lib/step-runner';

const STEPS: Step[] = [
  { name: 'Orders API', cmd: ['corepack', 'pnpm', 'check:api-orders'] },
  { name: 'Orders Duplicate API', cmd: ['corepack', 'pnpm', 'check:api-orders-duplicates'] },
  { name: 'Export Records API', cmd: ['corepack', 'pnpm', 'check:api-export-records'] },
  { name: 'Export Feedback API', cmd: ['corepack', 'pnpm', 'check:api-export-feedback'] },
  { name: 'Return Receipts API', cmd: ['corepack', 'pnpm', 'check:api-return-receipts'] },
  { name: 'Return Receipts Duplicate API', cmd: ['corepack', 'pnpm', 'check:api-return-receipts-duplicates'] },
  { name: 'Shipping Exports API', cmd: ['corepack', 'pnpm', 'check:api-shipping-exports'] },
  { name: 'Alert Executor', cmd: ['corepack', 'pnpm', 'check:alert-executor'] },
  { name: 'Order Cost History', cmd: ['corepack', 'pnpm', 'check:order-cost-history'] },
  { name: 'Reports API', cmd: ['corepack', 'pnpm', 'check:api-reports'] },
];
async function main() {
  console.log('API Contracts Acceptance');
  console.log('');
  await runSteps(STEPS);

  console.log('');
  console.log('All API contract acceptance checks passed.');
}

main().catch((error) => {
  console.error('FAIL API Contracts Acceptance');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
