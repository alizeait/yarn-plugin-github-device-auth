import { SettingsType } from '@yarnpkg/core';
import type { SettingsDefinition } from '@yarnpkg/core';

/**
 * Plugin configuration settings for .yarnrc.yml
 *
 * Usage:
 * ```yaml
 * githubDeviceAuth:
 *   clientId: 'your-oauth-app-client-id'
 *   scope: 'your-org'
 * ```
 */
export const pluginConfiguration: Record<string, SettingsDefinition> = {
  githubDeviceAuth: {
    description: 'Configuration for GitHub Device Flow authentication plugin',
    type: SettingsType.SHAPE,
    properties: {
      clientId: {
        description:
          'Client ID from a GitHub OAuth App (NOT a GitHub App) for device flow authentication. ' +
          'Create one at: https://github.com/settings/developers > OAuth Apps',
        type: SettingsType.STRING,
        default: '',
      },
      scope: {
        description:
          'NPM scope to apply GitHub device authentication to (e.g., "your-org" for @your-org/* packages)',
        type: SettingsType.STRING,
        default: '',
      },
    },
  },
};
