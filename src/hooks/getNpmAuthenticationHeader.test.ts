import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Configuration, Ident } from '@yarnpkg/core';
import { PortablePath, npath } from '@yarnpkg/fslib';

import { getNpmAuthenticationHeader } from '../hooks/getNpmAuthenticationHeader';
import { resetDeviceFlowCache } from '../utils';
import type { AccessTokenResponse } from '../types';

function createMockConfiguration(
  overrides: Partial<{
    projectCwd: string;
    scope: string;
  }> = {},
): Configuration {
  const { projectCwd, scope = 'test-scope' } = overrides;

  return {
    projectCwd: projectCwd
      ? (npath.toPortablePath(projectCwd) as PortablePath)
      : null,
    get: (key: string) => {
      if (key === 'githubDeviceAuth')
        return new Map([
          ['clientId', ''],
          ['scope', scope],
        ]);
      return undefined;
    },
  } as unknown as Configuration;
}

function createMockIdent(scope: string): Ident {
  return { scope, name: 'some-package' } as Ident;
}

function getCachePathForProject(projectPath: string): string {
  const hash = createHash('sha256')
    .update(projectPath)
    .digest('hex')
    .substring(0, 16);
  return path.join(
    os.homedir(),
    '.config',
    'yarn',
    'github-device-auth',
    hash,
    'device-flow.json',
  );
}

describe('getNpmAuthenticationHeader', () => {
  let tempDir: string;
  let originalCI: string | undefined;

  beforeEach(async () => {
    resetDeviceFlowCache();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'yarn-plugin-test-'));
    originalCI = process.env.CI;
    delete process.env.CI;
  });

  afterEach(async () => {
    if (originalCI !== undefined) {
      process.env.CI = originalCI;
    } else {
      delete process.env.CI;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('when an existing header is provided', () => {
    it('returns the existing header unchanged', async () => {
      const result = await getNpmAuthenticationHeader(
        'Bearer existing-token',
        'https://npm.pkg.github.com',
        { configuration: createMockConfiguration({ projectCwd: tempDir }) },
      );

      expect(result).toBe('Bearer existing-token');
    });
  });

  describe('when running in CI environment', () => {
    it('returns the current header without modification', async () => {
      process.env.CI = 'true';

      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.pkg.github.com',
        { configuration: createMockConfiguration({ projectCwd: tempDir }) },
      );

      expect(result).toBeUndefined();
    });
  });

  describe('when registry is not GitHub npm', () => {
    it('returns the current header for npmjs.org', async () => {
      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://registry.npmjs.org',
        { configuration: createMockConfiguration({ projectCwd: tempDir }) },
      );

      expect(result).toBeUndefined();
    });

    it('returns the current header for other registries', async () => {
      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.example.com',
        { configuration: createMockConfiguration({ projectCwd: tempDir }) },
      );

      expect(result).toBeUndefined();
    });
  });

  describe('when ident scope does not match configured scope', () => {
    it('returns the current header', async () => {
      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.pkg.github.com',
        {
          configuration: createMockConfiguration({
            projectCwd: tempDir,
            scope: 'my-org',
          }),
          ident: createMockIdent('other-org'),
        },
      );

      expect(result).toBeUndefined();
    });
  });

  describe('when no projectCwd is available', () => {
    it('returns the current header', async () => {
      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.pkg.github.com',
        {
          configuration: createMockConfiguration({ projectCwd: undefined }),
        },
      );

      expect(result).toBeUndefined();
    });
  });

  describe('when cache exists with valid token', () => {
    it('returns Bearer token from cache', async () => {
      const cachePath = getCachePathForProject(tempDir);
      await fs.mkdir(path.dirname(cachePath), { recursive: true });

      const cacheData: AccessTokenResponse = {
        access_token: 'gho_test_token_12345',
        token_type: 'bearer',
        scope: 'read:packages',
        timestamp: Date.now(),
      };
      await fs.writeFile(cachePath, JSON.stringify(cacheData), 'utf8');

      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.pkg.github.com',
        {
          configuration: createMockConfiguration({
            projectCwd: tempDir,
            scope: 'test-scope',
          }),
        },
      );

      expect(result).toBe('Bearer gho_test_token_12345');
    });
  });

  describe('when cache does not exist', () => {
    it('returns undefined to let wrapNetworkRequest handle auth', async () => {
      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.pkg.github.com',
        {
          configuration: createMockConfiguration({
            projectCwd: tempDir,
            scope: 'test-scope',
          }),
        },
      );

      expect(result).toBeUndefined();
    });
  });

  describe('when ident scope matches configured scope', () => {
    it('returns Bearer token from cache', async () => {
      const cachePath = getCachePathForProject(tempDir);
      await fs.mkdir(path.dirname(cachePath), { recursive: true });

      const cacheData: AccessTokenResponse = {
        access_token: 'gho_matching_scope_token',
        token_type: 'bearer',
        scope: 'read:packages',
        timestamp: Date.now(),
      };
      await fs.writeFile(cachePath, JSON.stringify(cacheData), 'utf8');

      const result = await getNpmAuthenticationHeader(
        undefined,
        'https://npm.pkg.github.com',
        {
          configuration: createMockConfiguration({
            projectCwd: tempDir,
            scope: 'my-org',
          }),
          ident: createMockIdent('my-org'),
        },
      );

      expect(result).toBe('Bearer gho_matching_scope_token');
    });
  });
});
