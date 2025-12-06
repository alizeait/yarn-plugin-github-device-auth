import * as p from '@clack/prompts';
import { npath } from '@yarnpkg/fslib';
import { guideUserToGetToken } from '../auth';
import { getOAuthClientId, getNpmScope, setTokenInConfig } from '../utils';
import { ResponseError } from '../ResponseError';
import { runInstall } from '../utils/runInstall';

let added = false;

/**
 * This hook catches 401/403 errors from invalid/expired tokens and prompts for re-authentication.
 * Works together with getNpmAuthenticationHeader which ensures tokens are attached.
 */
export async function wrapNetworkRequest(
  executor: () => Promise<any>,
  info: any,
) {
  if (!info.configuration.projectCwd) {
    return () => executor();
  }

  const projectCwd = npath.fromPortablePath(info.configuration.projectCwd);
  const oauthClientId = getOAuthClientId(info.configuration);
  const npmScope = getNpmScope(info.configuration);

  const usedToken = await setTokenInConfig({
    configuration: info.configuration,
    projectCwd,
  });
  const tokenExists = !!usedToken;

  const targetUrl = info.target.toString();
  const isGitHubScopeRequest =
    targetUrl.includes('github.com') &&
    (!npmScope || targetUrl.includes(`@${npmScope}`));

  if (process.env.CI || !isGitHubScopeRequest) {
    return () => executor();
  }

  return async () => {
    try {
      const response = await executor();

      if (response.statusCode !== 200) {
        throw new ResponseError(
          response.statusMessage || 'Unauthorized',
          response,
        );
      }

      return response;
    } catch (error: unknown) {
      const handleError = async () => {
        await guideUserToGetToken(
          projectCwd,
          tokenExists,
          usedToken,
          oauthClientId,
          npmScope,
        );

        p.outro('Retrying installation...');

        const startingCwd = npath.fromPortablePath(
          info.configuration.startingCwd,
        );

        runInstall(startingCwd);
      };

      if (!added) {
        added = true;
        let fired = false;
        process.addListener('beforeExit', (code) => {
          if (fired) return;
          fired = true;

          if (error instanceof ResponseError) {
            // Check if it's a GitHub 401/403 authorization error
            if (
              (error.response?.statusCode === 401 ||
                error.response?.statusCode === 403) &&
              isGitHubScopeRequest
            ) {
              handleError();
            }
          } else if (
            (error instanceof Error &&
              error.message.includes('Unauthorized')) ||
            (error instanceof Error && error.message.includes('Forbidden'))
          ) {
            handleError();
          } else {
            process.exit(code);
          }
        });
      }

      if (error instanceof ResponseError) {
        return error.response;
      }
      throw error;
    }
  };
}
