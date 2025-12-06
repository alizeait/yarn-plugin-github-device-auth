import * as p from '@clack/prompts';
import type { Configuration } from '@yarnpkg/core';

/**
 * Gets the OAuth App Client ID from configuration.
 * Exits with an error if not configured.
 */
export function getOAuthClientId(configuration: Configuration): string {
  const config = configuration.get('githubDeviceAuth') as
    | Map<string, string>
    | undefined;

  const clientId = config?.get('clientId');

  if (!clientId) {
    p.log.error(
      'GitHub OAuth App (NOT GitHub App) Client ID is not configured.\n' +
        'Please add "githubDeviceAuth.clientId" to your .yarnrc.yml file.\n' +
        'Example:\n' +
        '  githubDeviceAuth:\n' +
        "    clientId: 'your-client-id'\n" +
        'Create an OAuth App at: https://github.com/settings/developers',
    );
    process.exit(1);
  }

  return clientId;
}

