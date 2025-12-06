import fs from 'node:fs/promises';
import type { AccessTokenResponse } from '../types';
import { getCachePath } from './getCachePath';

let deviceFlowCache: AccessTokenResponse | null = null;

export async function getDeviceFlowCache(
  cwd: string,
): Promise<AccessTokenResponse | null> {
  if (deviceFlowCache) {
    return deviceFlowCache;
  }
  try {
    const cachePath = getCachePath(cwd);
    const cache = await fs.readFile(cachePath, 'utf8');

    const parsedCache = JSON.parse(cache) as AccessTokenResponse;

    deviceFlowCache = parsedCache;
    return parsedCache;
  } catch {
    return null;
  }
}

export function resetDeviceFlowCache() {
  deviceFlowCache = null;
}

export function setDeviceFlowCacheInternal(cache: AccessTokenResponse) {
  deviceFlowCache = cache;
}
