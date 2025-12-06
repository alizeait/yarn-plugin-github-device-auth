import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Configuration } from '@yarnpkg/core';
import { PortablePath, npath } from '@yarnpkg/fslib';

import { wrapNetworkRequest } from '../hooks/wrapNetworkRequest';

vi.mock('../auth', () => ({
  guideUserToGetToken: vi.fn().mockResolvedValue('mock-token'),
}));

vi.mock('../utils/runInstall', () => ({
  runInstall: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  outro: vi.fn(),
  log: { error: vi.fn(), warn: vi.fn(), success: vi.fn() },
  intro: vi.fn(),
  text: vi.fn(),
  note: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
}));

function createMockConfiguration(
  overrides: Partial<{
    projectCwd: string;
    startingCwd: string;
    scope: string;
    clientId: string;
  }> = {},
): Configuration {
  const {
    projectCwd,
    startingCwd = projectCwd,
    scope = 'test-scope',
    clientId = 'test-client-id',
  } = overrides;

  return {
    projectCwd: projectCwd
      ? (npath.toPortablePath(projectCwd) as PortablePath)
      : null,
    startingCwd: startingCwd
      ? (npath.toPortablePath(startingCwd) as PortablePath)
      : ('' as PortablePath),
    get: (key: string) => {
      if (key === 'githubDeviceAuth') return new Map([['clientId', clientId], ['scope', scope]]);
      if (key === 'npmScopes') return new Map();
      return undefined;
    },
  } as unknown as Configuration;
}

function createMockInfo(
  overrides: Partial<{
    projectCwd: string;
    target: string;
    scope: string;
    clientId: string;
  }> = {},
) {
  const { projectCwd, target = 'https://npm.pkg.github.com/@test-scope/pkg' } =
    overrides;

  return {
    configuration: createMockConfiguration({
      projectCwd,
      ...overrides,
    }),
    target: new URL(target),
  };
}

describe('wrapNetworkRequest', () => {
  let tempDir: string;
  let originalCI: string | undefined;

  beforeEach(async () => {
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

  describe('when no projectCwd is available', () => {
    it('returns a passthrough executor', async () => {
      const mockExecutor = vi.fn().mockResolvedValue({ statusCode: 200 });
      const info = createMockInfo({ projectCwd: undefined });

      const wrapped = await wrapNetworkRequest(mockExecutor, info);
      const result = await wrapped();

      expect(result).toEqual({ statusCode: 200 });
      expect(mockExecutor).toHaveBeenCalledOnce();
    });
  });

  describe('when running in CI environment', () => {
    it('returns a passthrough executor', async () => {
      process.env.CI = 'true';
      const mockExecutor = vi.fn().mockResolvedValue({ statusCode: 200 });
      const info = createMockInfo({ projectCwd: tempDir });

      const wrapped = await wrapNetworkRequest(mockExecutor, info);
      const result = await wrapped();

      expect(result).toEqual({ statusCode: 200 });
      expect(mockExecutor).toHaveBeenCalledOnce();
    });
  });

  describe('when target is not a GitHub request', () => {
    it('returns a passthrough executor for npmjs.org', async () => {
      const mockExecutor = vi.fn().mockResolvedValue({ statusCode: 200 });
      const info = createMockInfo({
        projectCwd: tempDir,
        target: 'https://registry.npmjs.org/package',
      });

      const wrapped = await wrapNetworkRequest(mockExecutor, info);
      const result = await wrapped();

      expect(result).toEqual({ statusCode: 200 });
      expect(mockExecutor).toHaveBeenCalledOnce();
    });
  });

  describe('when executor returns 200', () => {
    it('returns the response unchanged', async () => {
      const mockResponse = {
        statusCode: 200,
        body: 'package data',
      };
      const mockExecutor = vi.fn().mockResolvedValue(mockResponse);
      const info = createMockInfo({ projectCwd: tempDir });

      const wrapped = await wrapNetworkRequest(mockExecutor, info);
      const result = await wrapped();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('when executor returns 401', () => {
    it('returns the error response', async () => {
      const mockResponse = {
        statusCode: 401,
        statusMessage: 'Unauthorized',
      };
      const mockExecutor = vi.fn().mockResolvedValue(mockResponse);
      const info = createMockInfo({ projectCwd: tempDir });

      const wrapped = await wrapNetworkRequest(mockExecutor, info);
      const result = await wrapped();

      expect(result.statusCode).toBe(401);
    });
  });

  describe('when executor returns 403', () => {
    it('returns the error response', async () => {
      const mockResponse = {
        statusCode: 403,
        statusMessage: 'Forbidden',
      };
      const mockExecutor = vi.fn().mockResolvedValue(mockResponse);
      const info = createMockInfo({ projectCwd: tempDir });

      const wrapped = await wrapNetworkRequest(mockExecutor, info);
      const result = await wrapped();

      expect(result.statusCode).toBe(403);
    });
  });
});
