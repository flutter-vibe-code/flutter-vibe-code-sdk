/**
 * Cloudflare Pages Custom Domain Management
 * Adds custom subdomains to Cloudflare Pages projects
 *
 * For custom domains on capsulethis.app:
 * 1. Delete any old CNAME records (clears Error 1014 state)
 * 2. Add domain to Pages project FIRST (authorizes the cross-account CNAME)
 * 3. THEN create CNAME to pages.dev (now authorized because domain is on Pages)
 *
 * Order matters: CNAME before Pages = Error 1014, CNAME after Pages = works
 *
 * Requires:
 * - CF_API_TOKEN: Cloudflare Pages permissions (to add domain to project)
 * - CF_DNS_API_TOKEN: Zone DNS:Edit permission (to manage DNS records)
 * - CF_DNS_ZONE_ID: Zone ID for the custom domain base (e.g., capsulethis.app)
 */

import Cloudflare from 'cloudflare'

export interface CustomDomainResult {
  success: boolean
  customDomain?: string
  status?: 'initializing' | 'pending' | 'active' | 'failed'
  error?: string
}

interface DnsRecord {
  id: string
  name: string
  content: string
  type: string
}

const CUSTOM_DOMAIN_BASE = process.env.CUSTOM_DOMAIN_BASE || 'capsulethis.app'

/**
 * Get existing DNS record for a subdomain
 */
async function getDnsRecord(
  subdomain: string
): Promise<{ record?: DnsRecord; error?: string }> {
  const dnsToken = process.env.CF_DNS_API_TOKEN
  const zoneId = process.env.CF_DNS_ZONE_ID

  if (!dnsToken || !zoneId) {
    return { error: 'DNS credentials not configured' }
  }

  const fullDomain = `${subdomain}.${CUSTOM_DOMAIN_BASE}`

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${fullDomain}&type=CNAME`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${dnsToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json() as {
      success: boolean
      result?: DnsRecord[]
      errors?: Array<{ message: string }>
    }

    if (!data.success) {
      return { error: data.errors?.[0]?.message || 'Failed to query DNS records' }
    }

    if (data.result && data.result.length > 0) {
      return { record: data.result[0] }
    }

    return {} // No record found
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * Create a proxied A record for Pages routing
 * Uses 192.0.2.1 (Cloudflare's placeholder) - Cloudflare routes to Pages based on domain registration
 */
async function createProxiedARecord(
  subdomain: string
): Promise<{ success: boolean; error?: string }> {
  const dnsToken = process.env.CF_DNS_API_TOKEN
  const zoneId = process.env.CF_DNS_ZONE_ID

  if (!dnsToken || !zoneId) {
    return { success: false, error: 'DNS credentials not configured' }
  }

  const fullDomain = `${subdomain}.${CUSTOM_DOMAIN_BASE}`

  try {
    console.log(`[Custom Domain] Creating proxied A record for: ${fullDomain}`)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dnsToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'A',
          name: subdomain,
          content: '192.0.2.1', // Cloudflare placeholder IP for proxied routing
          ttl: 1,
          proxied: true,
        }),
      }
    )

    const data = await response.json() as { success: boolean; errors?: Array<{ message: string; code: number }> }

    if (!data.success) {
      // Check if record already exists
      const alreadyExists = data.errors?.some(
        (e: { code: number }) => e.code === 81057 || e.code === 81058
      )
      if (alreadyExists) {
        console.log(`[Custom Domain] A record already exists for ${fullDomain}`)
        return { success: true }
      }

      const errorMsg = data.errors?.map((e: { message: string }) => e.message).join(', ') || 'Unknown error'
      console.error(`[Custom Domain] A record creation failed: ${errorMsg}`)
      return { success: false, error: errorMsg }
    }

    console.log(`[Custom Domain] Proxied A record created successfully`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Custom Domain] A record error:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a DNS record by ID
 */
async function deleteDnsRecord(
  recordId: string,
  subdomain: string
): Promise<{ success: boolean; error?: string }> {
  const dnsToken = process.env.CF_DNS_API_TOKEN
  const zoneId = process.env.CF_DNS_ZONE_ID

  if (!dnsToken || !zoneId) {
    return { success: false, error: 'DNS credentials not configured' }
  }

  const fullDomain = `${subdomain}.${CUSTOM_DOMAIN_BASE}`

  try {
    console.log(`[Custom Domain] Deleting DNS record for: ${fullDomain}`)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${dnsToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json() as { success: boolean; errors?: Array<{ message: string }> }

    if (!data.success) {
      const errorMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error'
      console.error(`[Custom Domain] DNS record deletion failed: ${errorMsg}`)
      return { success: false, error: errorMsg }
    }

    console.log(`[Custom Domain] DNS record deleted successfully`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Custom Domain] DNS delete error:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Update an existing DNS record
 * @deprecated - For domains on same Cloudflare account, DNS should be handled automatically
 */
async function updateDnsRecord(
  recordId: string,
  subdomain: string,
  pagesDevTarget: string
): Promise<{ success: boolean; error?: string }> {
  const dnsToken = process.env.CF_DNS_API_TOKEN
  const zoneId = process.env.CF_DNS_ZONE_ID

  if (!dnsToken || !zoneId) {
    return { success: false, error: 'DNS credentials not configured' }
  }

  const fullDomain = `${subdomain}.${CUSTOM_DOMAIN_BASE}`

  try {
    console.log(`[Custom Domain] Updating CNAME: ${fullDomain} -> ${pagesDevTarget}`)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${dnsToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: subdomain,
          content: pagesDevTarget,
          ttl: 1,
          proxied: true,
        }),
      }
    )

    const data = await response.json() as { success: boolean; errors?: Array<{ message: string }> }

    if (!data.success) {
      const errorMsg = data.errors?.map(e => e.message).join(', ') || 'Unknown error'
      console.error(`[Custom Domain] DNS record update failed: ${errorMsg}`)
      return { success: false, error: errorMsg }
    }

    console.log(`[Custom Domain] DNS record updated successfully`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Custom Domain] DNS update error:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Create or update a CNAME DNS record for the custom domain
 * Points subdomain.capsulethis.app -> projectName.pages.dev
 */
async function createOrUpdateDnsRecord(
  subdomain: string,
  pagesDevTarget: string
): Promise<{ success: boolean; error?: string }> {
  const dnsToken = process.env.CF_DNS_API_TOKEN
  const zoneId = process.env.CF_DNS_ZONE_ID

  if (!dnsToken || !zoneId) {
    console.warn('[Custom Domain] DNS token or zone ID not configured, skipping DNS record creation')
    return { success: false, error: 'DNS credentials not configured' }
  }

  const fullDomain = `${subdomain}.${CUSTOM_DOMAIN_BASE}`

  // First, check if a record already exists
  const existing = await getDnsRecord(subdomain)

  if (existing.record) {
    // Record exists - check if it points to the correct target
    if (existing.record.content === pagesDevTarget) {
      console.log(`[Custom Domain] DNS record already correct: ${fullDomain} -> ${pagesDevTarget}`)
      return { success: true }
    }

    // Record exists but points to wrong target - update it
    console.log(`[Custom Domain] DNS record exists but points to ${existing.record.content}, updating...`)
    return updateDnsRecord(existing.record.id, subdomain, pagesDevTarget)
  }

  // No existing record, create new one
  try {
    console.log(`[Custom Domain] Creating CNAME: ${fullDomain} -> ${pagesDevTarget}`)

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dnsToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'CNAME',
          name: subdomain,
          content: pagesDevTarget,
          ttl: 1,
          proxied: true,
        }),
      }
    )

    const data = await response.json() as { success: boolean; errors?: Array<{ message: string; code: number }> }

    if (!data.success) {
      // Check if record already exists (race condition)
      const alreadyExists = data.errors?.some(
        (e: { code: number }) => e.code === 81057 || e.code === 81058
      )
      if (alreadyExists) {
        console.log(`[Custom Domain] DNS record already exists for ${fullDomain}`)
        return { success: true }
      }

      const errorMsg = data.errors?.map((e: { message: string }) => e.message).join(', ') || 'Unknown DNS error'
      console.error(`[Custom Domain] DNS record creation failed: ${errorMsg}`)
      return { success: false, error: errorMsg }
    }

    console.log(`[Custom Domain] DNS record created successfully`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Custom Domain] DNS API error:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * List all custom domains for a Cloudflare Pages project
 */
async function listProjectDomains(
  projectName: string
): Promise<{ domains: string[]; error?: string }> {
  const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID

  if (!apiToken || !accountId) {
    return { domains: [], error: 'Credentials not configured' }
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json() as {
      success: boolean
      result?: Array<{ name: string; status: string }>
      errors?: Array<{ message: string }>
    }

    if (!data.success) {
      return { domains: [], error: data.errors?.[0]?.message }
    }

    const domains = data.result?.map(d => d.name) || []
    console.log(`[Custom Domain] Existing domains for ${projectName}:`, domains)
    return { domains }
  } catch (error: any) {
    return { domains: [], error: error.message }
  }
}

/**
 * Remove a custom domain from a Cloudflare Pages project
 */
async function removeProjectDomain(
  projectName: string,
  domain: string
): Promise<{ success: boolean; error?: string }> {
  const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID

  if (!apiToken || !accountId) {
    return { success: false, error: 'Credentials not configured' }
  }

  try {
    console.log(`[Custom Domain] Removing old domain: ${domain}`)
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains/${domain}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json() as {
      success: boolean
      errors?: Array<{ message: string }>
    }

    if (!data.success) {
      console.warn(`[Custom Domain] Failed to remove ${domain}:`, data.errors?.[0]?.message)
      return { success: false, error: data.errors?.[0]?.message }
    }

    console.log(`[Custom Domain] Successfully removed ${domain}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Add a custom domain to a Cloudflare Pages project
 *
 * Steps:
 * 1. List existing custom domains and remove old ones for capsulethis.app
 * 2. Create or update CNAME DNS record (subdomain -> project.pages.dev)
 * 3. Add custom domain to Pages project (or verify it exists)
 *
 * @param projectName - The Cloudflare Pages project name (e.g., "my-app-abc123")
 * @param subdomain - Optional custom subdomain (if different from projectName)
 * @returns Result with custom domain URL or error
 */
export async function addCustomDomain(
  projectName: string,
  subdomain?: string
): Promise<CustomDomainResult> {
  const apiToken = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
  const accountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID

  if (!apiToken) {
    console.warn('[Custom Domain] Skipping: CF_API_TOKEN not configured')
    return { success: false, error: 'Missing Cloudflare API token' }
  }

  if (!accountId) {
    console.warn('[Custom Domain] Skipping: CF_ACCOUNT_ID not configured')
    return { success: false, error: 'Missing Cloudflare account ID' }
  }

  // Use provided subdomain or fall back to projectName
  const effectiveSubdomain = subdomain || projectName
  const customDomain = `${effectiveSubdomain}.${CUSTOM_DOMAIN_BASE}`

  try {
    // Step 1: Delete any existing CNAME records pointing to pages.dev
    // These cause Error 1014 - Cloudflare handles routing internally for same-account domains
    console.log(`[Custom Domain] Step 1: Cleaning up old CNAME records for ${effectiveSubdomain}`)
    const existingDns = await getDnsRecord(effectiveSubdomain)

    if (existingDns.record && existingDns.record.content.endsWith('.pages.dev')) {
      console.log(`[Custom Domain] Deleting old CNAME to pages.dev (causes Error 1014)`)
      await deleteDnsRecord(existingDns.record.id, effectiveSubdomain)
    }

    // Step 2: Check existing domains on Pages project and remove old capsulethis.app domains
    console.log(`[Custom Domain] Step 2: Checking existing domains on Pages project ${projectName}`)
    const { domains: existingDomains } = await listProjectDomains(projectName)

    for (const domain of existingDomains) {
      // Remove old capsulethis.app domains that aren't the new one
      if (domain.endsWith(`.${CUSTOM_DOMAIN_BASE}`) && domain !== customDomain) {
        console.log(`[Custom Domain] Removing old domain from Pages: ${domain}`)
        await removeProjectDomain(projectName, domain)

        // Also delete any CNAME record for the old domain
        const oldSubdomain = domain.replace(`.${CUSTOM_DOMAIN_BASE}`, '')
        const oldDns = await getDnsRecord(oldSubdomain)
        if (oldDns.record && oldDns.record.content.endsWith('.pages.dev')) {
          console.log(`[Custom Domain] Deleting old DNS record for: ${domain}`)
          await deleteDnsRecord(oldDns.record.id, oldSubdomain)
        }
      }
    }

    // Check if the new domain already exists on the Pages project
    if (existingDomains.includes(customDomain)) {
      console.log(`[Custom Domain] Domain ${customDomain} already configured on project`)
      // Ensure CNAME exists pointing to the right target
      const pagesDevTarget = `${projectName}.pages.dev`
      await createOrUpdateDnsRecord(effectiveSubdomain, pagesDevTarget)
      return {
        success: true,
        customDomain,
        status: 'active'
      }
    }

    // Step 3: Add custom domain to Pages project FIRST
    // This authorizes the cross-account CNAME that we'll create next
    console.log(`[Custom Domain] Step 3: Adding ${customDomain} to Pages project ${projectName}`)

    const client = new Cloudflare({ apiToken })

    const result = await client.pages.projects.domains.create(projectName, {
      account_id: accountId,
      name: customDomain
    })

    console.log(`[Custom Domain] Successfully added ${customDomain}`)
    console.log(`[Custom Domain] Status: ${result.status}`)

    // Step 4: NOW create CNAME to pages.dev AFTER domain is on Pages
    // The domain is now authorized, so the cross-account CNAME is allowed
    const pagesDevTarget = `${projectName}.pages.dev`
    console.log(`[Custom Domain] Step 4: Creating CNAME ${customDomain} -> ${pagesDevTarget}`)
    const dnsResult = await createOrUpdateDnsRecord(effectiveSubdomain, pagesDevTarget)

    if (!dnsResult.success) {
      console.warn(`[Custom Domain] CNAME creation failed: ${dnsResult.error}`)
    }

    return {
      success: true,
      customDomain,
      status: result.status as CustomDomainResult['status']
    }
  } catch (error: any) {
    // Handle specific Cloudflare API errors
    const errorMessage = error.message || String(error)

    // Domain already exists on this project - treat as success
    if (error.status === 409 || errorMessage.includes('already exists')) {
      console.log(`[Custom Domain] Domain ${customDomain} already exists on project`)
      return {
        success: true,
        customDomain,
        status: 'active'
      }
    }

    // Domain in use by another project
    if (errorMessage.includes('already in use')) {
      console.warn(`[Custom Domain] Domain ${customDomain} is already in use by another project`)
      return { success: false, error: 'Domain already in use by another project' }
    }

    // Rate limiting
    if (error.status === 429) {
      console.warn('[Custom Domain] Rate limited by Cloudflare API')
      return { success: false, error: 'Rate limited - try again later' }
    }

    // Generic error
    console.error(`[Custom Domain] Failed to add ${customDomain}:`, errorMessage)
    console.error(`[Custom Domain] Full error:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Verify and fix custom domain configuration for an existing project
 * This is called on updates to ensure the domain is properly configured
 *
 * @param projectName - The Cloudflare Pages project name (e.g., "my-app-abc123")
 * @param subdomain - Optional custom subdomain to use (e.g., "swift-mountain"). If not provided, uses projectName.
 */
export async function verifyCustomDomain(
  projectName: string,
  subdomain?: string
): Promise<CustomDomainResult> {
  const effectiveSubdomain = subdomain || projectName
  console.log(`[Custom Domain] Verifying domain configuration for project ${projectName}, subdomain: ${effectiveSubdomain}`)

  // Re-run addCustomDomain which will:
  // 1. Delete old CNAME (clears error state)
  // 2. Add domain to Pages FIRST (authorizes CNAME)
  // 3. Create CNAME to pages.dev AFTER (now authorized)
  return addCustomDomain(projectName, effectiveSubdomain)
}

/**
 * Get the custom domain URL for a project name
 */
export function getCustomDomainUrl(projectName: string): string {
  return `https://${projectName}.${CUSTOM_DOMAIN_BASE}`
}
