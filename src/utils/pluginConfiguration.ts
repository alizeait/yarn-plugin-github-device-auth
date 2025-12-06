import { SettingsType } from '@yarnpkg/core';
import type { SimpleSettingsDefinition } from '../types';

/**
 * Plugin configuration settings for .yarnrc.yml
 */
export const pluginConfiguration: Record<string, SimpleSettingsDefinition> = {
  githubDeviceOAuthAppClientId: {
    description:
      'Client ID from a GitHub OAuth App (NOT a GitHub App) for device flow authentication. ' +
      'Create one at: https://github.com/settings/developers > OAuth Apps',
    type: SettingsType.STRING,
    default: '',
  },
  githubDeviceAuthScope: {
    description:
      'NPM scope to apply GitHub device authentication to (e.g., "your-org" for @your-org/* packages)',
    type: SettingsType.STRING,
    default: '',
  },
};
