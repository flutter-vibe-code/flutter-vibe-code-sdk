import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { eq, desc } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { corsHeaders, handleCorsOptions } from '@/lib/cors'

export async function OPTIONS() {
  return handleCorsOptions()
}

export async function POST(req: NextRequest) {
  try {
    const { id, title, template, userID } = await req.json()

    if (!id || !title || !template || !userID) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: id, title, template, userID',
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      )
    }

    // All projects are public by default
    // Free users: always public
    // Paid users: can choose to make private via settings
    const isPublic = true

    const newProject = await db
      .insert(projects)
      .values({
        id,
        title,
        template,
        userId: userID,
        status: 'active',
        isPublic, // Set based on subscription
        forkCount: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return new Response(JSON.stringify({ project: newProject[0] }), { headers: corsHeaders })
  } catch (error) {
    console.error('Error creating project:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userID = searchParams.get('userID')
  const search = searchParams.get('search')

  if (!userID) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  try {
    // Fetch all user projects first
    const userProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        template: projects.template,
        status: projects.status,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        e2bUrl: projects.e2bUrl,
      })
      .from(projects)
      .where(eq(projects.userId, userID))
      .orderBy(desc(projects.updatedAt))
      .limit(100)

    // Filter if search is provided - match both hyphenated and space versions
    const filteredProjects = search
      ? userProjects.filter((project) => {
          const title = (project.title || '').toLowerCase()
          const query = search.toLowerCase()
          // Check exact match, spaces-to-hyphens, and hyphens-to-spaces
          return (
            title.includes(query) ||
            title.includes(query.replace(/ /g, '-')) ||
            title.replace(/-/g, ' ').includes(query.replace(/-/g, ' '))
          )
        })
      : userProjects.slice(0, 50)

    return new Response(JSON.stringify({ projects: filteredProjects }), { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
}
