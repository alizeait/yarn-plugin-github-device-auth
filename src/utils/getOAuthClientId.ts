import * as p from '@clack/prompts';
import type { Configuration } from '@yarnpkg/core';

/**
 * Gets the OAuth App Client ID from configuration.
 * Exits with an error if not configured.
 */
export function getOAuthClientId(configuration: Configuration): string {
  const clientId = configuration.get('githubDeviceOAuthAppClientId') as
    | string
    | undefined;

  if (!clientId) {
    p.log.error(
      'GitHub OAuth App (NOT GitHub App) Client ID is not configured.\n' +
        'Please add "githubDeviceOAuthAppClientId" to your .yarnrc.yml file.\n' +
        'Create an OAuth App at: https://github.com/settings/developers',
    );
    process.exit(1);
  }

  return clientId;
}
