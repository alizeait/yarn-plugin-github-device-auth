import { pluginConfiguration } from './utils';
import type { ExtendedHooks } from './types';
import type { SettingsDefinition } from '@yarnpkg/core';
import { getNpmAuthenticationHeader } from './hooks/getNpmAuthenticationHeader';
import { wrapNetworkRequest } from './hooks/wrapNetworkRequest';

const plugin: {
  name: string;
  hooks: ExtendedHooks;
  configuration: Record<string, SettingsDefinition>;
} = {
  name: 'plugin-github-device-auth',
  configuration: pluginConfiguration,
  hooks: {
    getNpmAuthenticationHeader,
    wrapNetworkRequest,
  },
};

export default plugin;
