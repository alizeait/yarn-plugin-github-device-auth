import * as p from '@clack/prompts';
import type { Configuration } from '@yarnpkg/core';

/**
 * Gets the npm scope from configuration.
 * Exits with an error if not configured.
 */
export function getNpmScope(configuration: Configuration): string {
  const config = configuration.get('githubDeviceAuth') as
    | Map<string, string>
    | undefined;

  const scope = config?.get('scope');

  if (!scope) {
    p.log.error(
      'GitHub device authentication scope is not configured.\n' +
        'Please add "githubDeviceAuth.scope" to your .yarnrc.yml file.\n' +
        'Example:\n' +
        '  githubDeviceAuth:\n' +
        "    scope: 'your-org'",
    );
    process.exit(1);
  }

  return scope;
}
