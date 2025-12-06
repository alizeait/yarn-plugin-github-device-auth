import fs from 'node:fs/promises';
import path from 'node:path';
import type { AccessTokenResponse } from '../types';
import { getCachePath } from './getCachePath';
import { setDeviceFlowCacheInternal } from './getDeviceFlowCache';

/**
 * Saves the device flow cache to disk.
 */
export async function saveDeviceFlowCache(
  cache: AccessTokenResponse,
  cwd: string,
): Promise<void> {
  const cachePath = getCachePath(cwd);
  const cacheDir = path.dirname(cachePath);

  await fs.mkdir(cacheDir, { recursive: true });

  await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), {
    mode: 0o600,
  });

  setDeviceFlowCacheInternal(cache);
}
