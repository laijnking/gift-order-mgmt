import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';

export const DEFAULT_HOST = '127.0.0.1';

export type MockUser = {
  id: string;
  username: string;
  realName: string;
  role: string;
  roleName: string;
  dataScope: string;
  permissions: string[];
};

export const ADMIN_USER: MockUser = {
  id: 'user-admin',
  username: 'admin',
  realName: '管理员',
  role: 'admin',
  roleName: '管理员',
  dataScope: 'all',
  permissions: [
    'dashboard:view',
    'orders:view',
    'orders:create',
    'orders:edit',
    'orders:delete',
    'orders:export',
    'customers:view',
    'suppliers:view',
    'products:view',
    'stocks:view',
    'users:view',
    'settings:view',
  ],
};

export async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function startServer(port: number) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: DEFAULT_HOST,
      COZE_PROJECT_ENV: 'DEV',
    },
    stdio: 'pipe',
  });

  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});

  return child;
}

export async function waitForServer(baseUrl: string, child?: ChildProcessWithoutNullStreams) {
  let stderrTail = '';
  let stdoutTail = '';

  const remember = (current: string, chunk: Buffer) => `${current}${chunk.toString()}`.slice(-4000);
  const onStdout = (chunk: Buffer) => {
    stdoutTail = remember(stdoutTail, chunk);
  };
  const onStderr = (chunk: Buffer) => {
    stderrTail = remember(stderrTail, chunk);
  };

  child?.stdout.on('data', onStdout);
  child?.stderr.on('data', onStderr);

  for (let i = 0; i < 60; i += 1) {
    if (child && child.exitCode !== null) {
      child.stdout.off('data', onStdout);
      child.stderr.off('data', onStderr);
      throw new Error(
        `本地服务启动失败(${baseUrl})，进程已退出，exitCode=${child.exitCode}\nstdout:\n${stdoutTail || '(empty)'}\nstderr:\n${stderrTail || '(empty)'}`
      );
    }

    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) {
        child?.stdout.off('data', onStdout);
        child?.stderr.off('data', onStderr);
        return;
      }
    } catch {}
    await wait(1000);
  }

  child?.stdout.off('data', onStdout);
  child?.stderr.off('data', onStderr);
  throw new Error(`本地服务启动超时: ${baseUrl}\nstdout:\n${stdoutTail || '(empty)'}\nstderr:\n${stderrTail || '(empty)'}`);
}

export async function stopServer(child: ChildProcessWithoutNullStreams) {
  if (child.exitCode !== null) return;

  child.kill('SIGTERM');
  for (let i = 0; i < 10; i += 1) {
    if (child.exitCode !== null) return;
    await wait(300);
  }

  if (child.exitCode === null) {
    child.kill('SIGKILL');
  }
}

export function buildAuthedHeaders(user: MockUser = ADMIN_USER) {
  return {
    'Content-Type': 'application/json',
    'x-user-info': JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      dataScope: user.dataScope,
      permissions: user.permissions,
    }),
  };
}

export async function fetchJson<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<{ status: number; data: T }> {
  const response = await fetch(input, init);
  const data = (await response.json()) as T;
  return {
    status: response.status,
    data,
  };
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
