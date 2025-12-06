import * as p from '@clack/prompts';
import * as ncp from 'copy-paste';
import open from 'open';
import color from 'picocolors';
import { GitHubDeviceAuth } from './GitHubDeviceAuth';
import { saveDeviceFlowCache } from '../utils';

/**
 * Prompts the user for GitHub device flow authentication.
 * Opens the browser and copies the code to clipboard.
 * Returns the access token if successful, undefined/null otherwise.
 */
export async function promptForDeviceToken(
  cwd: string,
  oauthClientId: string,
): Promise<string | undefined | null> {
  const auth = new GitHubDeviceAuth(oauthClientId);

  try {
    const tokenResponse = await auth.authenticate(
      async (userCode, verificationUri) => {
        p.note(
          `${color.inverse(userCode)}\n\n${color.dim(verificationUri)}`,
          'Enter one-time code',
          { format: (line) => line },
        );

        const proceed = await p.text({
          message: 'Press Enter to copy to clipboard and open browser',
          placeholder: '',
          defaultValue: '',
        });

        if (p.isCancel(proceed)) {
          p.cancel('Authentication cancelled.');
          process.exit(0);
        }

        try {
          ncp.copy(userCode);
        } catch {
          // Silently fail if clipboard is not available
        }

        await open(verificationUri);
      },
    );

    await saveDeviceFlowCache(tokenResponse, cwd);
    return auth.getAccessToken();
  } catch (error) {
    p.log.error('Authentication failed');
    console.log(error);
  }
}
