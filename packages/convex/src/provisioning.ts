// Convex provisioning service
// Handles OAuth flow and project creation via Convex APIs

import type {
  CreateProjectResponse,
  OAuthTokenResponse,
  DeploymentProvisionResponse,
  OAuthAuthorizeParams,
  ConvexProject,
} from './types'

const PROVISION_HOST = process.env.PROVISION_HOST || 'https://api.convex.dev'
const DASHBOARD_HOST = process.env.DASHBOARD_HOST || 'https://dashboard.convex.dev'

/**
 * Exchange OAuth authorization code for access token
 */
export async function exchangeOAuthCode(params: {
  code: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<OAuthTokenResponse> {
  const response = await fetch(`${PROVISION_HOST}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to exchange OAuth code: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Create a new Convex project
 */
export async function createConvexProject(params: {
  accessToken: string
  teamSlug: string
  projectName: string
  deploymentType?: 'dev' | 'prod'
}): Promise<CreateProjectResponse> {
  const response = await fetch(`${PROVISION_HOST}/api/create_project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      team: params.teamSlug,
      projectName: params.projectName,
      deploymentType: params.deploymentType || 'dev',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()

    // Try to parse error for better message
    try {
      const errorData = JSON.parse(errorText)
      if (errorData.code === 'SSORequired') {
        throw new Error('You must log in with Single Sign-on to access this team.')
      }
      if (errorData.code === 'ProjectQuotaReached') {
        throw new Error(`Failed to create project: ${errorData.message || 'Project quota reached'}`)
      }
    } catch (e) {
      // If parsing fails, use generic error
    }

    throw new Error(`Failed to create Convex project: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Get project deploy key via OAuth authorization
 */
export async function authorizeProjectAccess(params: OAuthAuthorizeParams): Promise<{ accessToken: string }> {
  const response = await fetch(`${PROVISION_HOST}/api/dashboard/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`,
    },
    body: JSON.stringify({
      authn_token: params.accessToken,
      projectId: params.projectId,
      oauthApp: {
        clientId: params.clientId,
        clientSecret: params.clientSecret,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (errorText.includes('SSORequired')) {
      throw new Error('You must log in with Single Sign-on to access this team.')
    }
    throw new Error(`Failed to authorize project access: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Provision and get deployment credentials
 */
export async function provisionDeployment(params: {
  projectDeployKey: string
  deploymentType?: 'dev' | 'prod'
}): Promise<DeploymentProvisionResponse> {
  const response = await fetch(`${PROVISION_HOST}/api/deployment/provision_and_authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Convex-Client': 'capsule-ide-0.1.0',
      Authorization: `Bearer ${params.projectDeployKey}`,
    },
    body: JSON.stringify({
      teamSlug: null, // Not needed when using project deploy key
      projectSlug: null,
      deploymentType: params.deploymentType || 'dev',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to provision deployment: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Complete Convex project provisioning flow
 * This orchestrates all the API calls needed to fully provision a project
 */
export async function provisionConvexProject(params: {
  accessToken: string
  teamSlug: string
  projectName: string
  clientId: string
  clientSecret: string
}): Promise<ConvexProject> {
  // Step 1: Create the project
  const projectData = await createConvexProject({
    accessToken: params.accessToken,
    teamSlug: params.teamSlug,
    projectName: params.projectName,
    deploymentType: 'dev',
  })

  // Step 2: Authorize access to get deploy key
  const authData = await authorizeProjectAccess({
    accessToken: params.accessToken,
    projectId: projectData.projectId,
    clientId: params.clientId,
    clientSecret: params.clientSecret,
  })

  // Step 3: Format the project deploy key
  const projectDeployKey = `project:${params.teamSlug}:${projectData.projectSlug}|${authData.accessToken}`

  // Step 4: Provision the deployment to get deployment URL
  const deploymentData = await provisionDeployment({
    projectDeployKey,
    deploymentType: 'dev',
  })

  return {
    token: projectDeployKey,
    deploymentName: deploymentData.deploymentName,
    deploymentUrl: deploymentData.url,
    projectSlug: projectData.projectSlug,
    teamSlug: params.teamSlug,
  }
}

/**
 * Get OAuth authorization URL
 */
export function getOAuthAuthorizeUrl(params: {
  clientId: string
  redirectUri: string
  state?: string
  scope?: string
}): string {
  const url = new URL(`${DASHBOARD_HOST}/oauth/authorize/project`)
  url.searchParams.set('client_id', params.clientId)
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('response_type', 'code')

  if (params.state) {
    url.searchParams.set('state', params.state)
  }

  if (params.scope) {
    url.searchParams.set('scope', params.scope)
  }

  return url.toString()
}
