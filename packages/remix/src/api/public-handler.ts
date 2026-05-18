import { eq } from 'drizzle-orm'
import type { PublicProject, ApiError } from '../types'

/**
 * Fetch public project information without authentication
 * Returns 404 if project is not public
 */
export async function getPublicProject(params: {
  projectId: string
  db: any
  projects: any
  user: any
}): Promise<
  | { success: true; data: { project: PublicProject } }
  | { success: false; error: ApiError; status: number }
> {
  const { projectId, db, projects, user } = params

  try {
    // Fetch project with user information
    const projectResults = await db
      .select({
        id: projects.id,
        title: projects.title,
        userId: projects.userId,
        sandboxId: projects.sandboxId,
        sandboxUrl: projects.sandboxUrl,
        e2bUrl: projects.e2bUrl,
        deployedUrl: projects.deployedUrl,
        template: projects.template,
        status: projects.status,
        isPublic: projects.isPublic,
        forkedFrom: projects.forkedFrom,
        forkCount: projects.forkCount,
        screenshotMobile: projects.screenshotMobile,
        screenshotDesktop: projects.screenshotDesktop,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        userName: user.name,
        userImage: user.image,
      })
      .from(projects)
      .leftJoin(user, eq(projects.userId, user.id))
      .where(eq(projects.id, projectId))
      .limit(1)

    if (projectResults.length === 0) {
      return {
        success: false,
        error: { error: 'Project not found' },
        status: 404,
      }
    }

    const project = projectResults[0]

    // Check if project is public
    if (!project.isPublic) {
      return {
        success: false,
        error: { error: 'This project is not public' },
        status: 404,
      }
    }

    return {
      success: true,
      data: { project: project as PublicProject },
    }
  } catch (error) {
    console.error('Error fetching public project:', error)
    return {
      success: false,
      error: {
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      status: 500,
    }
  }
}
