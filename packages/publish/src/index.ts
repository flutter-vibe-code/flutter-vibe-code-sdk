/**
 * @flutter-vibe-code/publish
 *
 * Cloudflare Pages deployment and custom domain management for React Native Vibe Code.
 *
 * This package provides utilities for:
 * - Deploying web apps to Cloudflare Pages
 * - Managing custom domains on Cloudflare
 * - Updating app configuration files (app.json, wrangler.toml)
 *
 * @example
 * ```typescript
 * import { deployToCloudflare, addCustomDomain } from '@flutter-vibe-code/publish'
 *
 * // Deploy to Cloudflare Pages
 * const result = await deployToCloudflare({
 *   sandboxId: 'sbx-123',
 *   projectId: 'proj-456',
 *   appName: 'my-app'
 * })
 *
 * // Add a custom domain
 * const domainResult = await addCustomDomain('my-project', 'my-subdomain')
 * ```
 *
 * @see README.md for configuration and setup instructions
 */

// Types
export type {
  CloudflareDeployOptions,
  CloudflareDeployResult,
  CustomDomainResult,
  DnsRecord,
  CloudflareEnvConfig
} from './types'

export {
  getCloudflareConfig,
  validateCloudflareConfig,
  validateCustomDomainConfig
} from './types'

// Cloudflare deployment
export {
  deployToCloudflare,
  sanitizeAppName,
  generateDeploymentName
} from './cloudflare/deploy'

// Custom domain management
export {
  addCustomDomain,
  verifyCustomDomain,
  getCustomDomainUrl,
  getCustomDomainBase
} from './cloudflare/custom-domain'

// App configuration
export {
  updateAppJsonWithName,
  updateWranglerTomlWithName,
  updateAppConfigWithName,
  generateWranglerToml
} from './config/app-config'
