// Convex integration types

export type ConvexProject = {
  token: string
  deploymentName: string
  deploymentUrl: string
  projectSlug: string
  teamSlug: string
}

export type ConvexTeam = {
  id: string
  name: string
  slug: string
  referralCode?: string
}

// Connection state stored in database
export type ConvexProjectState =
  | {
      kind: 'connected'
      projectSlug: string
      teamSlug: string
      deploymentUrl: string
      deploymentName: string
      warningMessage?: string
    }
  | {
      kind: 'connecting'
    }
  | {
      kind: 'failed'
      errorMessage: string
    }

// Response from create_project API
export interface CreateProjectResponse {
  projectSlug: string
  projectId: number
  teamSlug: string
  deploymentName: string
  prodUrl: string // Actually the dev URL
  adminKey: string
  projectsRemaining: number
}

// Response from OAuth token exchange
export interface OAuthTokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in?: number
  refresh_token?: string
}

// Response from deployment provision API
export interface DeploymentProvisionResponse {
  deploymentName: string
  url: string
  adminKey: string
}

// OAuth authorize request params
export interface OAuthAuthorizeParams {
  accessToken: string
  projectId: number
  clientId: string
  clientSecret: string
}

// Environment variable structure
export interface ConvexEnvVar {
  name: string
  value: string
}
