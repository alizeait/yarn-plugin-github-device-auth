import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

export function runInstall(cwd: string) {
  const isWin = os.platform() === 'win32';

  const command = process.argv;
  let yarnIndex = command.findIndex((c) =>
    c.includes(`yarn${path.sep}`),
  );

  yarnIndex = yarnIndex === -1 ? 2 : yarnIndex;

  const commandWithoutYarn = command.slice(yarnIndex + 1);

  const child = spawn(isWin ? 'yarn.cmd' : 'yarn', commandWithoutYarn, {
    env: process.env,
    cwd,
    shell: isWin,
    stdio: 'inherit',
  });

  process.on('SIGINT', () => {
    child.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    child.kill('SIGTERM');
  });
  process.on('beforeExit', () => {
    child.kill();
  });

  return child;
}
