import { spawn } from 'child_process';

export type Step = {
  name: string;
  cmd: string[];
};

export async function runStep(step: Step) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(step.cmd[0], step.cmd.slice(1), {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${step.name} exited with code ${code ?? 'unknown'}`));
    });
  });
}

export async function runSteps(steps: Step[]) {
  for (const step of steps) {
    console.log(`RUN ${step.name}`);
    await runStep(step);
    console.log(`PASS ${step.name}`);
  }
}
