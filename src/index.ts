import { pluginConfiguration } from './utils';
import type { ExtendedHooks, SimpleSettingsDefinition } from './types';
import { getNpmAuthenticationHeader } from './hooks/getNpmAuthenticationHeader';
import { wrapNetworkRequest } from './hooks/wrapNetworkRequest';

const plugin: {
  name: string;
  hooks: ExtendedHooks;
  configuration: Record<string, SimpleSettingsDefinition>;
} = {
  name: 'plugin-github-device-auth',
  configuration: pluginConfiguration,
  hooks: {
    getNpmAuthenticationHeader,
    wrapNetworkRequest,
  },
};

export default plugin;
