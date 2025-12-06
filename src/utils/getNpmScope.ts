import * as p from '@clack/prompts';
import type { Configuration } from '@yarnpkg/core';

/**
 * Gets the npm scope from configuration.
 * Exits with an error if not configured.
 */
export function getNpmScope(configuration: Configuration): string {
  const scope = configuration.get('githubDeviceAuthScope') as
    | string
    | undefined;

  if (!scope) {
    p.log.error(
      'GitHub device authentication scope is not configured.\n' +
        'Please add "githubDeviceAuthScope" to your .yarnrc.yml file.\n' +
        'Example: githubDeviceAuthScope: "volvo-cars"',
    );
    process.exit(1);
  }

  return scope;
}
