import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

/**
 * Gets the cache file path for a project.
 * Uses a hash of the project path to create a unique cache location.
 */
export function getCachePath(projectPath: string): string {
  const hash = createHash('sha256')
    .update(projectPath)
    .digest('hex')
    .substring(0, 16);

  // Use ~/.config/yarn/github-device-auth/<hash>/device-flow.json
  const homeDir = os.homedir();
  return path.join(
    homeDir,
    '.config',
    'yarn',
    'github-device-auth',
    hash,
    'device-flow.json',
  );
}
