// Convex Management API service
// Handles platform-managed Convex projects using team-scoped tokens
// This is different from OAuth - projects are created in the platform's Convex team

import type {
  CreateProjectResponse,
  DeploymentProvisionResponse,
  ConvexProject,
} from './types'

const PROVISION_HOST = process.env.PROVISION_HOST || 'https://api.convex.dev'

/**
 * Create a new managed Convex project using team-scoped token
 */
export async function createManagedProject(params: {
  teamScopedToken: string
  teamSlug: string
  projectName: string
  deploymentType?: 'dev' | 'prod'
}): Promise<CreateProjectResponse> {
  const response = await fetch(`${PROVISION_HOST}/api/create_project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.teamScopedToken}`,
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
      if (errorData.code === 'ProjectQuotaReached') {
        throw new Error(`Failed to create project: ${errorData.message || 'Project quota reached'}`)
      }
    } catch (e) {
      // If parsing fails, use generic error
    }

    throw new Error(`Failed to create managed Convex project: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Provision deployment using team-scoped token
 * For managed projects, we use the team-scoped token directly
 */
export async function provisionManagedDeployment(params: {
  teamScopedToken: string
  teamSlug: string
  projectSlug: string
  deploymentType?: 'dev' | 'prod'
}): Promise<DeploymentProvisionResponse> {
  const response = await fetch(`${PROVISION_HOST}/api/deployment/provision_and_authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Convex-Client': 'capsule-ide-0.1.0',
      Authorization: `Bearer ${params.teamScopedToken}`,
    },
    body: JSON.stringify({
      teamSlug: params.teamSlug,
      projectSlug: params.projectSlug,
      deploymentType: params.deploymentType || 'dev',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to provision managed deployment: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Complete managed Convex project provisioning flow
 * Creates project in platform's team and returns credentials
 */
export async function provisionManagedConvexProject(params: {
  teamScopedToken: string
  teamSlug: string
  projectName: string
}): Promise<ConvexProject> {
  // Step 1: Create the project in platform's team
  const projectData = await createManagedProject({
    teamScopedToken: params.teamScopedToken,
    teamSlug: params.teamSlug,
    projectName: params.projectName,
    deploymentType: 'dev',
  })

  // Step 2: Provision the deployment using team-scoped token
  const deploymentData = await provisionManagedDeployment({
    teamScopedToken: params.teamScopedToken,
    teamSlug: params.teamSlug,
    projectSlug: projectData.projectSlug,
    deploymentType: 'dev',
  })

  // Step 3: Format the admin key (team-scoped token can be used directly)
  // Format: project:teamSlug:projectSlug|token
  const adminKey = `project:${params.teamSlug}:${projectData.projectSlug}|${params.teamScopedToken}`

  return {
    token: adminKey,
    deploymentName: deploymentData.deploymentName,
    deploymentUrl: deploymentData.url,
    projectSlug: projectData.projectSlug,
    teamSlug: params.teamSlug,
  }
}

/**
 * Delete a managed Convex project
 */
export async function deleteManagedProject(params: {
  teamScopedToken: string
  projectId: number
}): Promise<void> {
  const response = await fetch(`${PROVISION_HOST}/api/projects/${params.projectId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.teamScopedToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to delete managed project: ${response.status} ${errorText}`)
  }
}

/**
 * Get project ID from project slug and team slug
 */
export async function getManagedProjectId(params: {
  teamScopedToken: string
  teamSlug: string
  projectSlug: string
}): Promise<number> {
  // Fetch team projects to find the project ID
  const response = await fetch(`${PROVISION_HOST}/api/dashboard/teams`, {
    headers: {
      Authorization: `Bearer ${params.teamScopedToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to fetch teams: ${response.status} ${errorText}`)
  }

  const teams = await response.json()
  const team = teams.find((t: any) => t.slug === params.teamSlug)

  if (!team) {
    throw new Error(`Team ${params.teamSlug} not found`)
  }

  // Now fetch projects for this team
  const projectsResponse = await fetch(`${PROVISION_HOST}/api/dashboard/teams/${team.id}/projects`, {
    headers: {
      Authorization: `Bearer ${params.teamScopedToken}`,
    },
  })

  if (!projectsResponse.ok) {
    const errorText = await projectsResponse.text()
    throw new Error(`Failed to fetch projects: ${projectsResponse.status} ${errorText}`)
  }

  const projects = await projectsResponse.json()
  const project = projects.find((p: any) => p.slug === params.projectSlug)

  if (!project) {
    throw new Error(`Project ${params.projectSlug} not found in team ${params.teamSlug}`)
  }

  return project.id
}
