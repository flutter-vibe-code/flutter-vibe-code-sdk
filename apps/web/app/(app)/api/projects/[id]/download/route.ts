import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { NextRequest } from 'next/server'
import { Sandbox } from '@e2b/code-interpreter'
import { connectSandbox } from '@/lib/sandbox-connect'
// archiver v8 dropped the callable default in favour of named class exports
// (Archiver, ZipArchive, TarArchive, JsonArchive). `archiver('zip', opts)`
// throws "f is not a function" at runtime under v8. We use ZipArchive directly.
// require() is used because turbopack's strict ESM rejects the no-default import.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ZipArchive } = require('archiver') as { ZipArchive: any }

export const maxDuration = 300

// Paths excluded from the archive. Substring match — keep both Flutter and
// generic web artefacts out (the project is Flutter today; web exclusions are
// kept for safety in case other templates land in /home/user/app).
const EXCLUDE_PATTERNS = [
  '/node_modules/', '/.git/', '/.next/', '/build/', '/dist/', '/.cache/',
  '/.dart_tool/', '/.idea/', '/.fvm/',
  '/android/.gradle/', '/android/build/', '/android/app/build/',
  '/ios/Pods/', '/ios/build/', '/ios/Flutter/Flutter.framework/',
  '/.DS_Store', '/Thumbs.db', '/.env.local',
]

function shouldExclude(path: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => path.includes(p))
}

async function listFiles(sandbox: Sandbox, dir: string): Promise<string[]> {
  const files: string[] = []
  try {
    const items = await sandbox.files.list(dir)
    for (const item of items) {
      const itemPath = (item as any).path ?? `${dir}/${(item as any).name}`
      if (shouldExclude(itemPath)) continue
      const isDir = (item as any).isDir ?? (item as any).type === 'dir'
      if (isDir) {
        files.push(...(await listFiles(sandbox, itemPath)))
      } else {
        files.push(itemPath)
      }
    }
  } catch (e) {
    console.warn('[Download API] List error in', dir, e)
  }
  return files
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  console.log('[Download API] Starting download request for project:', id)

  const { searchParams } = new URL(req.url)
  const userID = searchParams.get('userID')
  console.log('[Download API] UserID:', userID)

  if (!userID) {
    return new Response(
      JSON.stringify({ error: 'User ID is required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    console.log('[Download API] Fetching project from database...')
    const projectResults = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userID)))
      .limit(1)

    console.log('[Download API] Found projects:', projectResults.length)

    if (projectResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Project not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const project = projectResults[0]
    console.log(
      '[Download API] Project found:', project.id,
      'SandboxId:', project.sandboxId,
    )

    if (!project.sandboxId) {
      return new Response(
        JSON.stringify({
          error: 'Project has no sandbox',
          details: 'Cannot download a project without an active sandbox',
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    let sandbox: Sandbox
    try {
      console.log('[Download API] Connecting to sandbox:', project.sandboxId)
      sandbox = await connectSandbox(project.sandboxId)
      console.log('[Download API] Sandbox connected successfully')

      const ping = await sandbox.commands.run('echo pong', { timeoutMs: 10000 })
      if (ping.exitCode !== 0) {
        throw new Error('Sandbox ping returned non-zero exit code')
      }
      console.log('[Download API] Sandbox is alive and responsive')
    } catch (error: any) {
      console.error('[Download API] Failed to connect to sandbox:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to access project sandbox',
          details: error?.message || 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    try {
      console.log('[Download API] Listing files via Files API at /home/user/app...')
      const filePaths = await listFiles(sandbox, '/home/user/app')
      console.log('[Download API] Files found:', filePaths.length)

      if (filePaths.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Failed to create project archive',
            details: 'No files found in sandbox /home/user/app',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }

      // Build zip in memory with archiver v8 (no shell, no _layout.tsx hacks).
      const archive = new ZipArchive({ zlib: { level: 6 } })
      const chunks: Buffer[] = []
      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('warning', (w: any) =>
        console.warn('[Download API] archiver warning:', w),
      )

      const finished = new Promise<void>((resolve, reject) => {
        archive.on('end', () => resolve())
        archive.on('error', (err: any) => reject(err))
      })

      let appendedCount = 0
      let skippedCount = 0
      for (const filePath of filePaths) {
        try {
          const content = await sandbox.files.read(filePath, { format: 'bytes' as any })
          const buf = Buffer.from(content as Uint8Array)
          const archivePath = filePath.startsWith('/home/user/app/')
            ? filePath.slice('/home/user/app/'.length)
            : filePath.replace(/^\/+/, '')
          archive.append(buf, { name: archivePath })
          appendedCount++
        } catch (e) {
          skippedCount++
          if (skippedCount <= 5) {
            console.warn('[Download API] Skip unreadable file:', filePath, (e as any)?.message)
          }
        }
      }
      console.log(
        '[Download API] Archive: appended=', appendedCount,
        'skipped=', skippedCount,
      )

      archive.finalize()
      await finished

      const binaryData = Buffer.concat(chunks)
      console.log('[Download API] Final zip size:', binaryData.length, 'bytes')

      if (binaryData.length < 22) {
        // Empty zip is exactly 22 bytes (end-of-central-directory only).
        return new Response(
          JSON.stringify({
            error: 'Failed to create project archive',
            details: 'Archive is empty',
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const filename = `${(project.title || 'project').replace(/[^a-zA-Z0-9-_]/g, '_')}-${id}.zip`
      console.log('[Download API] Sending zip:', filename)
      return new Response(binaryData, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': binaryData.length.toString(),
        },
      })
    } catch (error: any) {
      console.error('[Download API] Error creating project archive:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to create project archive',
          details: error?.message || 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch (error: any) {
    console.error('[Download API] Error downloading project:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to download project',
        details: error?.message || 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
