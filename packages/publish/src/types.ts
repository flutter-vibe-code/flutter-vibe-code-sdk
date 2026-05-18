/**
 * Shared types for the publish package
 */

/**
 * Options for deploying to Cloudflare Pages
 */
export interface CloudflareDeployOptions {
  /** The E2B sandbox ID to deploy from */
  sandboxId: string
  /** The project ID in the database */
  projectId: string
  /** The app name (used to generate deployment name) */
  appName: string
  /** Path to the app in the sandbox (default: /home/user/app) */
  appPath?: string
  /** If provided, update existing project instead of creating new one */
  existingProjectName?: string
  /** If true, use appName exactly without adding nanoid suffix (for custom domains) */
  useExactName?: boolean
  /** Existing custom domain subdomain to preserve during updates (e.g., "swift-mountain") */
  existingCustomDomain?: string
}

/**
 * Result of a Cloudflare Pages deployment
 */
export interface CloudflareDeployResult {
  /** Whether the deployment was successful */
  success: boolean
  /** The final deployment URL (custom domain or pages.dev) */
  deploymentUrl?: string
  /** The custom domain URL if set (e.g., https://my-app.capsulethis.app) */
  customDomainUrl?: string
  /** The default pages.dev URL */
  pagesDevUrl?: string
  /** Human-readable status message */
  message: string
  /** Path to the build output */
  buildPath?: string
  /** Command output from the deployment */
  output?: string
  /** Error message if deployment failed */
  error?: string
  /** The Cloudflare Pages project name */
  deploymentName?: string
}

/**
 * Result of custom domain operations
 */
export interface CustomDomainResult {
  /** Whether the operation was successful */
  success: boolean
  /** The full custom domain (e.g., my-app.capsulethis.app) */
  customDomain?: string
  /** Current status of the domain */
  status?: 'initializing' | 'pending' | 'active' | 'failed'
  /** Error message if operation failed */
  error?: string
}

/**
 * DNS record structure from Cloudflare API
 */
export interface DnsRecord {
  /** Record ID */
  id: string
  /** Full domain name */
  name: string
  /** Target content (e.g., project.pages.dev) */
  content: string
  /** Record type (CNAME, A, etc.) */
  type: string
}

/**
 * Environment variables required for Cloudflare deployment
 */
export interface CloudflareEnvConfig {
  /** Cloudflare API token with Pages permissions */
  apiToken: string
  /** Cloudflare account ID */
  accountId: string
  /** DNS API token (if different from main API token) */
  dnsApiToken?: string
  /** DNS zone ID for custom domain base */
  dnsZoneId?: string
  /** Custom domain base (e.g., capsulethis.app) */
  customDomainBase?: string
}

/**
 * Get Cloudflare configuration from environment variables
 */
export function getCloudflareConfig(): Partial<CloudflareEnvConfig> {
  return {
    apiToken: process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID,
    dnsApiToken: process.env.CF_DNS_API_TOKEN,
    dnsZoneId: process.env.CF_DNS_ZONE_ID,
    customDomainBase: process.env.CUSTOM_DOMAIN_BASE || 'capsulethis.app'
  }
}

/**
 * Validate that required Cloudflare configuration is present
 */
export function validateCloudflareConfig(): { valid: boolean; missing: string[] } {
  const config = getCloudflareConfig()
  const missing: string[] = []

  if (!config.apiToken) {
    missing.push('CF_API_TOKEN or CLOUDFLARE_API_TOKEN')
  }

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Validate that custom domain configuration is present
 */
export function validateCustomDomainConfig(): { valid: boolean; missing: string[] } {
  const config = getCloudflareConfig()
  const missing: string[] = []

  if (!config.apiToken) {
    missing.push('CF_API_TOKEN or CLOUDFLARE_API_TOKEN')
  }
  if (!config.accountId) {
    missing.push('CF_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID')
  }
  if (!config.dnsApiToken) {
    missing.push('CF_DNS_API_TOKEN')
  }
  if (!config.dnsZoneId) {
    missing.push('CF_DNS_ZONE_ID')
  }

  return {
    valid: missing.length === 0,
    missing
  }
}
