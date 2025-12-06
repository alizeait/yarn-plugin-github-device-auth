import { setTimeout } from 'node:timers/promises';
import type { DeviceCodeResponse, AccessTokenResponse } from '../types';

/**
 * Class for handling GitHub device flow authentication.
 * Implements the OAuth 2.0 Device Authorization Grant flow for GitHub.
 */
export class GitHubDeviceAuth {
  private clientId: string;
  private deviceCode: string | null = null;
  private interval: number | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private scopes: string[] = ['read:packages'];

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async initiateDeviceFlow(
    onDisplayUserCode: (
      userCode: string,
      verificationUri: string,
    ) => Promise<void>,
  ): Promise<DeviceCodeResponse> {
    const url = new URL('https://github.com/login/device/code');
    url.searchParams.append('client_id', this.clientId);

    if (this.scopes.length > 0) {
      url.searchParams.append('scope', this.scopes.join(' '));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to initiate device flow: ${errorData.error_description || response.statusText}`,
      );
    }

    const data = await response.json();

    this.deviceCode = data.device_code;
    this.interval = data.interval;

    await onDisplayUserCode(data.user_code, data.verification_uri);

    return data;
  }

  async getTokenUsingRefreshToken(
    refreshToken: string,
  ): Promise<AccessTokenResponse> {
    const url = new URL('https://github.com/login/oauth/access_token');
    url.searchParams.append('client_id', this.clientId);
    url.searchParams.append('grant_type', 'refresh_token');
    url.searchParams.append('refresh_token', refreshToken);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(
        `Failed to get token using refresh token: ${data.error_description || response.statusText}`,
      );
    }

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    data.timestamp = Date.now();

    return data;
  }

  async pollForToken(abortSignal: AbortSignal): Promise<AccessTokenResponse> {
    if (!this.deviceCode) {
      throw new Error(
        'Device flow has not been initiated. Call initiateDeviceFlow first.',
      );
    }

    const url = new URL('https://github.com/login/oauth/access_token');
    url.searchParams.append('client_id', this.clientId);
    url.searchParams.append('device_code', this.deviceCode);
    url.searchParams.append(
      'grant_type',
      'urn:ietf:params:oauth:grant-type:device_code',
    );

    await setTimeout((this.interval || 5) * 1000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: abortSignal,
    });

    const data = await response.json();

    if (data.error) {
      switch (data.error) {
        case 'authorization_pending':
          // User hasn't authorized yet, continue polling
          return this.pollForToken(abortSignal);

        case 'slow_down':
          // Update interval and continue polling
          this.interval = (this.interval || 5) + 5;
          console.log(
            `Polling too quickly. Slowing down. New interval: ${this.interval}s`,
          );
          return this.pollForToken(abortSignal);

        case 'expired_token':
          throw new Error(
            'Device code has expired. Please initiate a new device flow.',
          );

        case 'access_denied':
          throw new Error('User denied access to the application.');

        default:
          throw new Error(
            `Error during polling: ${data.error_description || data.error}`,
          );
      }
    }

    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    data.timestamp = Date.now();

    return data;
  }

  /** Complete authentication flow from start to finish. */
  async authenticate(
    onDisplayUserCode: (
      userCode: string,
      verificationUri: string,
    ) => Promise<void>,
    maxWaitTimeSeconds: number = 900,
  ): Promise<AccessTokenResponse> {
    await this.initiateDeviceFlow(onDisplayUserCode);

    const abortSignal = AbortSignal.timeout(maxWaitTimeSeconds * 1000);

    const result = await this.pollForToken(abortSignal);

    return result;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}
