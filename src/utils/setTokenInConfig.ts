import type { Configuration } from '@yarnpkg/core';
import { getDeviceFlowCache } from './getDeviceFlowCache';
import { getNpmScope } from './getNpmScope';

let tokenCache: string | undefined;

/**
 * Sets the cached token in Yarn's npm configuration.
 * Returns the token if found, undefined otherwise.
 */
export async function setTokenInConfig({
  configuration,
  projectCwd,
}: {
  configuration: Configuration;
  projectCwd: string;
}): Promise<string | undefined> {
  if (tokenCache) {
    return tokenCache;
  }

  const npmScopes = configuration.get('npmScopes') as Map<
    string,
    Map<string, string>
  >;

  const npmScope = getNpmScope(configuration);

  const deviceFlowCache = await getDeviceFlowCache(projectCwd);
  const token = deviceFlowCache?.access_token;

  if (token) {
    npmScopes.get(npmScope)?.set('npmAuthToken', token);
  }

  tokenCache = token;

  return token;
}
