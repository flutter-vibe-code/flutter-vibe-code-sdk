import { NextRequest, NextResponse } from "next/server"
import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { Sandbox } from '@e2b/code-interpreter'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { customAlphabet } from 'nanoid'
import { eq } from 'drizzle-orm'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 7)

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) + '-' + nanoid()
}

function extractRepoInfo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 2) {
      return { owner: pathParts[0], repo: pathParts[1].replace(/\.git$/, '') }
    }
  } catch {
    // Try regex fallback
    const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (match) {
      return { owner: match[1], repo: match[2] }
    }
  }
  return null
}

export const maxDuration = 300 // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { repoUrl, title, template = 'flutter' } = body

    if (!repoUrl) {
      return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 })
    }

    const repoInfo = extractRepoInfo(repoUrl)
    if (!repoInfo) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
    }

    const projectTitle = title || `${repoInfo.owner}-${repoInfo.repo}`
    const projectId = crypto.randomUUID()

    // Create project in database
    const newProject = await db
      .insert(projects)
      .values({
        id: projectId,
        title: generateSlug(projectTitle),
        template,
        userId: session.user.id,
        status: 'active',
        isPublic: true,
        githubRepo: `${repoInfo.owner}/${repoInfo.repo}`,
        forkCount: '0',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    // Create E2B sandbox
    let sandbox: Sandbox
    try {
      sandbox = await Sandbox.create({
        template: process.env.E2B_TEMPLATE_ID || 'sce6zutko6kvhyhza4n8',
        timeoutMs: 3600000,
      })
    } catch (error) {
      console.error('[GitHub Import] Failed to create sandbox:', error)
      return NextResponse.json(
        { error: 'Failed to create sandbox', details: error instanceof Error ? error.message : 'Unknown' },
        { status: 500 }
      )
    }

    // Clone repository into sandbox
    const cloneScript = `#!/bin/bash
set -e
cd /home/user/app

# Remove default template files to avoid conflicts
rm -rf * .[^.]* 2>/dev/null || true

# Clone the repository
git clone "${repoUrl}" .

echo "Repository cloned successfully"
ls -la
`

    try {
      const execution = await sandbox.commands.run(cloneScript, { timeoutMs: 120000 })
      if (execution.exitCode !== 0) {
        console.error('[GitHub Import] Git clone failed:', execution.stderr)
        return NextResponse.json(
          { error: 'Failed to clone repository', details: execution.stderr },
          { status: 500 }
        )
      }
      console.log('[GitHub Import] Clone output:', execution.stdout)
    } catch (error) {
      console.error('[GitHub Import] Clone error:', error)
      return NextResponse.json(
        { error: 'Failed to clone repository', details: error instanceof Error ? error.message : 'Unknown' },
        { status: 500 }
      )
    }

    // Update project with sandbox ID
    await db
      .update(projects)
      .set({
        sandboxId: sandbox.sandboxId,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    return NextResponse.json({
      success: true,
      project: newProject[0],
      sandboxId: sandbox.sandboxId,
    })
  } catch (error) {
    console.error('[GitHub Import] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
