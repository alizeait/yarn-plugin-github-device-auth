import * as p from '@clack/prompts';
import color from 'picocolors';
import { promptForDeviceToken } from './promptForDeviceToken';

export async function guideUserToGetToken(
  cwd: string,
  tokenExists: boolean,
  usedToken: string | undefined,
  oauthClientId: string,
  npmScope: string,
): Promise<string | undefined> {
  console.log();
  p.intro(
    `Authentication is required for ${color.inverse(`@${npmScope}`)} packages`,
  );

  if (tokenExists && usedToken) {
    const truncatedToken = `${usedToken.substring(0, 7)}...${usedToken.substring(
      usedToken.length - 4,
    )}`;
    p.log.warn(
      `The existing token appears to be invalid or expired: ${truncatedToken}`,
    );
  }

  const token = await promptForDeviceToken(cwd, oauthClientId);
  if (!token) {
    p.log.error('No token provided. Cannot proceed with installation.');
    process.exit(1);
  }

  p.log.success('Authentication successful!');

  return token;
}
