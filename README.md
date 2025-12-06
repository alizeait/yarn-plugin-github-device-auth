# Yarn Plugin GitHub Device Auth

This Yarn plugin provides GitHub Device Flow authentication for packages hosted on
GitHub Packages.

## Features

- Automatically prompts for GitHub authentication when accessing private
  packages
- Uses GitHub Device Flow (similar to GitHub CLI) for secure authentication

## Install

```bash
yarn plugin import https://raw.githubusercontent.com/alizeait/yarn-plugin-github-device-auth/v1.0/bundles/@yarnpkg/plugin-github-device-auth.js
```

Add the following to your `.yarnrc.yml`:

```yaml

githubDeviceOAuthAppClientId: 'your-oauth-app-client-id' # See below to create an OAuth App
githubDeviceAuthScope: 'your-org'

npmScopes:
  your-org:
    npmRegistryServer: 'https://npm.pkg.github.com/your-org'
```

## Creating a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" in the left sidebar
3. Click "New OAuth App" button
4. Fill in the application details:
   - **Application name**: Choose a descriptive name (e.g., "Yarn Package
     Manager")
   - **Homepage URL**: Can be your organization's URL or `http://localhost`
   - **Authorization callback URL**: `http://localhost` (not used for device
     flow, but required)
5. Click "Register application"
6. Copy the **Client ID** - you'll need this for the configuration

**Important**: Make sure you create an **OAuth App** (not a GitHub App). The
*Device Flow authentication requires an OAuth App.

## How it works

When you try to install a package from GitHub Packages and authentication is
needed:

1. The plugin opens your browser to GitHub's device authentication page
2. You'll receive a one-time code to authenticate the device
3. After authorization, the token is cached in `~/.config/yarn/github-device-auth/<project-hash>/`
4. The installation continues automatically

The device-specific token is only used for the device it was created on and is
stored securely in your home directory with restricted file permissions.
