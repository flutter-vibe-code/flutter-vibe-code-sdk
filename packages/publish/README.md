# @react-native-vibe-code/publish

Cloudflare Pages deployment and custom domain management for React Native Vibe Code.

## Overview

This package provides utilities for deploying React Native/Expo web applications to Cloudflare Pages, including:

- **Deployment**: Build and deploy web apps to Cloudflare Pages via Wrangler
- **Custom Domains**: Automatic subdomain setup on your configured base domain
- **App Configuration**: Update app.json and wrangler.toml for deployment

## Installation

```bash
pnpm add @react-native-vibe-code/publish
```

## Environment Configuration

### Required Variables

These environment variables are **required** for basic Cloudflare Pages deployment:

| Variable | Description |
|----------|-------------|
| `CF_API_TOKEN` | Cloudflare API token with Pages permissions (or `CLOUDFLARE_API_TOKEN`) |

### Optional Variables

These provide additional functionality:

| Variable | Description | Default |
|----------|-------------|---------|
| `CF_ACCOUNT_ID` | Cloudflare account ID (or `CLOUDFLARE_ACCOUNT_ID`) | Auto-detected |
| `CF_DNS_API_TOKEN` | Separate token for DNS management (if different from main token) | Uses `CF_API_TOKEN` |
| `CF_DNS_ZONE_ID` | Zone ID for the custom domain base | Required for custom domains |
| `CUSTOM_DOMAIN_BASE` | Base domain for custom subdomains | `capsulethis.app` |

### Example `.env` Configuration

```bash
# Core Cloudflare API (required)
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id

# Custom Domain Configuration (optional but recommended)
CF_DNS_API_TOKEN=your_dns_api_token
CF_DNS_ZONE_ID=your_zone_id_for_base_domain
CUSTOM_DOMAIN_BASE=yourdomain.com
```

## Creating Cloudflare API Tokens

### Pages Deployment Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Profile → API Tokens
2. Click "Create Token"
3. Use "Custom token" template
4. Configure permissions:
   - **Account** → Cloudflare Pages → Edit
   - **Account** → Account Settings → Read
5. Set account resources to your account
6. Create and copy the token

### DNS Management Token (for Custom Domains)

If your DNS zone is in a different Cloudflare account or you want a separate token:

1. Go to Cloudflare Dashboard → Profile → API Tokens
2. Click "Create Token"
3. Configure permissions:
   - **Zone** → DNS → Edit
4. Set zone resources to your base domain zone
5. Create and copy the token

### Finding Your Zone ID

1. Go to Cloudflare Dashboard
2. Select your domain (e.g., `yourdomain.com`)
3. Scroll down on the Overview page
4. Find "Zone ID" in the right sidebar under "API"

## Usage

### Basic Deployment

```typescript
import { deployToCloudflare } from '@react-native-vibe-code/publish'

const result = await deployToCloudflare({
  sandboxId: 'sbx-abc123',           // E2B sandbox ID
  projectId: 'proj-xyz789',          // Your project ID
  appName: 'my-awesome-app'          // App name for the deployment
})

if (result.success) {
  console.log('Deployment URL:', result.deploymentUrl)
  console.log('Pages.dev URL:', result.pagesDevUrl)
  console.log('Custom Domain:', result.customDomainUrl)
}
```

### Update Existing Deployment

```typescript
import { deployToCloudflare } from '@react-native-vibe-code/publish'

const result = await deployToCloudflare({
  sandboxId: 'sbx-abc123',
  projectId: 'proj-xyz789',
  appName: 'my-awesome-app',
  existingProjectName: 'my-awesome-app-a1b2c3d',  // Previous deployment name
  existingCustomDomain: 'swift-mountain'           // Preserve custom subdomain
})
```

### Custom Domain Management

```typescript
import {
  addCustomDomain,
  verifyCustomDomain,
  getCustomDomainUrl
} from '@react-native-vibe-code/publish'

// Add a custom domain to a Pages project
const result = await addCustomDomain('my-project-name', 'my-subdomain')
// Result: my-subdomain.capsulethis.app

// Verify/fix domain configuration
const verified = await verifyCustomDomain('my-project-name', 'my-subdomain')

// Get the custom domain URL
const url = getCustomDomainUrl('my-project')
// Returns: https://my-project.capsulethis.app
```

### App Configuration Updates

```typescript
import { Sandbox } from '@e2b/code-interpreter'
import { updateAppConfigWithName } from '@react-native-vibe-code/publish'

const sandbox = await Sandbox.connect('sbx-abc123')

// Update both app.json and wrangler.toml
await updateAppConfigWithName(sandbox, 'cosmic-phoenix')

// Or update individually
import {
  updateAppJsonWithName,
  updateWranglerTomlWithName
} from '@react-native-vibe-code/publish'

await updateAppJsonWithName(sandbox, 'cosmic-phoenix')
await updateWranglerTomlWithName(sandbox, 'cosmic-phoenix')
```

### Configuration Validation

```typescript
import {
  validateCloudflareConfig,
  validateCustomDomainConfig
} from '@react-native-vibe-code/publish'

// Check if basic deployment config is valid
const deployConfig = validateCloudflareConfig()
if (!deployConfig.valid) {
  console.error('Missing:', deployConfig.missing.join(', '))
}

// Check if custom domain config is complete
const domainConfig = validateCustomDomainConfig()
if (!domainConfig.valid) {
  console.error('Missing:', domainConfig.missing.join(', '))
}
```

## API Reference

### `deployToCloudflare(options)`

Deploy a web application to Cloudflare Pages.

**Options:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `sandboxId` | `string` | ✅ | E2B sandbox ID to deploy from |
| `projectId` | `string` | ✅ | Project ID for tracking |
| `appName` | `string` | ✅ | App name (used for deployment name) |
| `appPath` | `string` | | Path to app in sandbox (default: `/home/user/app`) |
| `existingProjectName` | `string` | | Cloudflare project name for updates |
| `useExactName` | `boolean` | | Use exact app name without nanoid suffix |
| `existingCustomDomain` | `string` | | Preserve this subdomain during updates |

**Returns:** `CloudflareDeployResult`

| Property | Type | Description |
|----------|------|-------------|
| `success` | `boolean` | Whether deployment succeeded |
| `deploymentUrl` | `string` | Final URL (custom or pages.dev) |
| `customDomainUrl` | `string` | Custom domain URL if set |
| `pagesDevUrl` | `string` | Default pages.dev URL |
| `deploymentName` | `string` | Cloudflare Pages project name |
| `message` | `string` | Human-readable status |
| `error` | `string` | Error message if failed |

### `addCustomDomain(projectName, subdomain?)`

Add a custom domain to a Cloudflare Pages project.

**Parameters:**
- `projectName`: The Cloudflare Pages project name
- `subdomain` (optional): Custom subdomain (defaults to projectName)

**Returns:** `CustomDomainResult`

### `verifyCustomDomain(projectName, subdomain?)`

Verify and fix custom domain configuration for an existing project.

### `sanitizeAppName(appName)`

Sanitize an app name for Cloudflare Pages compatibility.

### `generateDeploymentName(appName)`

Generate a unique deployment name with nanoid suffix.

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    deployToCloudflare()                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Connect to E2B Sandbox                                   │
│     - Sandbox.connect(sandboxId)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Build Web App                                            │
│     - bun run build:web                                      │
│     - Outputs to /dist                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Create Cloudflare Pages Project (if new)                 │
│     - wrangler pages project create                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Deploy to Cloudflare Pages                               │
│     - wrangler pages deploy dist                             │
│     - Returns: https://<name>.pages.dev                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Setup Custom Domain                                      │
│     - addCustomDomain() or verifyCustomDomain()              │
│     - Creates DNS CNAME record                               │
│     - Registers domain with Pages project                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Result                                                      │
│  - deploymentUrl: https://myapp.yourdomain.com              │
│  - pagesDevUrl: https://myapp-abc123.pages.dev              │
└─────────────────────────────────────────────────────────────┘
```

## Custom Domain Setup Flow

The custom domain setup follows a specific order to avoid Cloudflare Error 1014:

1. **Delete old CNAME records** (clears error state)
2. **Add domain to Pages project FIRST** (authorizes cross-account CNAME)
3. **Create CNAME record AFTER** (now authorized)

**Important:** Creating the CNAME before registering with Pages causes Error 1014.

## Troubleshooting

### Error: "CF_API_TOKEN or CLOUDFLARE_API_TOKEN environment variable is required"

Make sure you have set the `CF_API_TOKEN` environment variable with a valid Cloudflare API token.

### Error 1014: CNAME Cross-User Banned

This occurs when a CNAME record is created before the domain is registered with Pages. The package handles this automatically by:
1. Deleting existing CNAME records
2. Registering with Pages first
3. Creating CNAME after registration

### Custom domain not working

1. Verify `CF_DNS_ZONE_ID` is correct
2. Check that `CF_DNS_API_TOKEN` has DNS:Edit permissions
3. Ensure `CUSTOM_DOMAIN_BASE` matches your zone

### Build failures

- Check that the sandbox has `bun` installed
- Verify the app has a `build:web` script in package.json
- Check build logs in the deployment result

## Package Structure

```
packages/publish/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # TypeScript types
│   ├── cloudflare/
│   │   ├── index.ts          # Cloudflare exports
│   │   ├── deploy.ts         # Deployment logic
│   │   └── custom-domain.ts  # Domain management
│   └── config/
│       ├── index.ts          # Config exports
│       └── app-config.ts     # App configuration utilities
├── package.json
├── tsconfig.json
└── README.md
```

## License

Private - Part of React Native Vibe Code
