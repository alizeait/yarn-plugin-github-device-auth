import type {
  Configuration,
  Hooks,
  Ident,
  SettingsDefinition,
} from '@yarnpkg/core';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  timestamp: number;
}

export type SimpleSettingsDefinition = Extract<
  SettingsDefinition,
  { default: any }
>;

export type ExtendedHooks = Hooks & {
  getNpmAuthenticationHeader?: (
    currentHeader: string | undefined,
    registry: string,
    context: { configuration: Configuration; ident?: Ident },
  ) => Promise<string | undefined>;
};
