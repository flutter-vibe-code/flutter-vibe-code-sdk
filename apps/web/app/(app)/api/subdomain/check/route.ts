import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { eq, and, ne, or } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')
    const projectId = searchParams.get('projectId')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain is required' },
        { status: 400 }
      )
    }

    // Sanitize the subdomain the same way cloudflare-deploy.ts does
    const sanitizedDomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!sanitizedDomain) {
      return NextResponse.json(
        { available: false, error: 'Invalid subdomain format' },
        { status: 400 }
      )
    }

    // Check if this subdomain is already used by another project
    // Check both cloudflareProjectName (deployed projects) and customDomainUrl (reserved domains)
    const domainMatch = or(
      eq(projects.cloudflareProjectName, sanitizedDomain),
      eq(projects.customDomainUrl, sanitizedDomain)
    )

    const query = projectId
      ? and(ne(projects.id, projectId), domainMatch)
      : domainMatch

    const existingProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(query)
      .limit(1)

    const available = existingProjects.length === 0

    return NextResponse.json({
      available,
      sanitizedDomain,
      message: available
        ? 'Subdomain is available'
        : 'Subdomain is already taken',
    })
  } catch (error) {
    console.error('[Subdomain Check] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check subdomain availability' },
      { status: 500 }
    )
  }
}
