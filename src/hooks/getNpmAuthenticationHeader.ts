import type { Configuration, Ident } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';
import { getNpmScope, getDeviceFlowCache } from '../utils';

/**
 * This hook is called by plugin-npm for every npm registry request that needs authentication.
 * Unlike wrapNetworkRequest which may miss some resolution-phase requests,
 * this hook is called reliably for all npm registry auth header resolutions.
 *
 * This hook only returns cached tokens. If no cache exists, it returns undefined
 * and lets wrapNetworkRequest handle the 401/403 error and prompt for authentication.
 */
export async function getNpmAuthenticationHeader(
  currentHeader: string | undefined,
  registry: string,
  { configuration, ident }: { configuration: Configuration; ident?: Ident },
): Promise<string | undefined> {
  if (currentHeader || process.env.CI) {
    return currentHeader;
  }

  if (!registry.includes('npm.pkg.github.com')) {
    return currentHeader;
  }

  const npmScope = getNpmScope(configuration);
  if (ident && ident.scope !== npmScope) {
    return currentHeader;
  }

  const projectCwd = configuration.projectCwd
    ? npath.fromPortablePath(configuration.projectCwd)
    : undefined;

  if (!projectCwd) {
    return currentHeader;
  }

  const deviceFlowCache = await getDeviceFlowCache(projectCwd);
  const token = deviceFlowCache?.access_token;

  if (token) {
    return `Bearer ${token}`;
  }

  return currentHeader;
}
