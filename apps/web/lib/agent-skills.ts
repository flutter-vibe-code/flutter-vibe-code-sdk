import * as fs from 'fs/promises'
import * as path from 'path'
import type { Sandbox } from '@e2b/code-interpreter'

// archiver v8: callable form is gone, use the named class export.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TarArchive } = require('archiver') as { TarArchive: any }

const SANDBOX_SKILLS_DIR = '/home/user/.claude/skills'
const SANDBOX_MARKER = `${SANDBOX_SKILLS_DIR}/.fvc-skills-uploaded`

/** In-memory cache of all skill markdowns; populated on first call. */
let skillsCache: { name: string; content: string }[] | null = null

/**
 * Resolve the marketplace directory. Next.js `process.cwd()` is the monorepo
 * root in some setups and `apps/web` in others, so try multiple candidates.
 */
async function findMarketplaceDir(): Promise<string> {
  const candidates = [
    path.join(process.cwd(), 'apps/web/lib/skills/marketplace'),
    path.join(process.cwd(), 'lib/skills/marketplace'),
    '/var/www/flutter-vibe-code/ide/apps/web/lib/skills/marketplace',
  ]
  for (const c of candidates) {
    try {
      await fs.access(c)
      return c
    } catch {}
  }
  throw new Error('Could not locate skills marketplace dir')
}

async function loadAllSkills(): Promise<{ name: string; content: string }[]> {
  if (skillsCache) return skillsCache
  const dir = await findMarketplaceDir()
  const files = await fs.readdir(dir)
  const mdFiles = files.filter((f) => f.endsWith('.md') && f !== 'README.md')
  const skills = await Promise.all(
    mdFiles.map(async (filename) => {
      const content = await fs.readFile(path.join(dir, filename), 'utf-8')
      const name = filename.replace(/\.md$/, '')
      return { name, content }
    }),
  )
  skillsCache = skills
  return skills
}

interface UploadOpts {
  onLog?: (msg: string) => void
  /** When true, force re-upload even if the marker is present. */
  force?: boolean
}

/**
 * Bundle the marketplace markdowns into a tar.gz and upload them to
 * /home/user/.claude/skills/ inside the sandbox so the Claude Agent SDK
 * auto-discovers them. Idempotent: marker file skips re-upload on warm sandbox.
 */
export async function uploadSkillsToSandbox(
  sandbox: Sandbox,
  opts: UploadOpts = {},
): Promise<{ uploaded: number; sizeKb: number; skipped: boolean }> {
  const log = opts.onLog || ((m: string) => console.log('[Agent Skills]', m))

  // Idempotency: marker file says we already uploaded.
  if (!opts.force) {
    try {
      const check = await sandbox.commands.run(`test -f ${SANDBOX_MARKER}`, { timeoutMs: 5000 })
      if (check.exitCode === 0) {
        log('skills already present in sandbox, skipping upload')
        return { uploaded: 0, sizeKb: 0, skipped: true }
      }
    } catch {
      // fallthrough — proceed with upload
    }
  }

  const skills = await loadAllSkills()
  if (skills.length === 0) {
    log('no skills found in marketplace dir, nothing to upload')
    return { uploaded: 0, sizeKb: 0, skipped: true }
  }

  log(`bundling ${skills.length} skills into tar.gz…`)

  const archive = new TarArchive({ gzip: true, gzipOptions: { level: 6 } })
  const chunks: Buffer[] = []
  archive.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<void>((resolve, reject) => {
    archive.on('end', () => resolve())
    archive.on('error', (e: any) => reject(e))
  })

  for (const skill of skills) {
    // Claude Agent SDK convention: each skill is a directory containing SKILL.md.
    archive.append(skill.content, { name: `${skill.name}/SKILL.md` })
  }
  archive.finalize()
  await done

  const tarball = Buffer.concat(chunks)
  const sizeKb = Math.round(tarball.length / 1024)
  log(`uploading ${sizeKb} KB tarball to sandbox…`)

  await sandbox.files.write('/tmp/fvc-agent-skills.tar.gz', tarball as any)

  // mkdir + extract + marker + permission fix in one shot, as root (sandbox.commands.run default user).
  const cmd =
    `mkdir -p ${SANDBOX_SKILLS_DIR} && ` +
    `tar -xzf /tmp/fvc-agent-skills.tar.gz -C ${SANDBOX_SKILLS_DIR} && ` +
    `touch ${SANDBOX_MARKER} && ` +
    `chown -R user:user /home/user/.claude && ` +
    `rm -f /tmp/fvc-agent-skills.tar.gz`
  const exec = await sandbox.commands.run(cmd, { timeoutMs: 60_000 })
  if (exec.exitCode !== 0) {
    throw new Error(`tar extract failed: ${exec.stderr || exec.stdout || 'unknown error'}`)
  }

  log(`✓ ${skills.length} skills installed at ${SANDBOX_SKILLS_DIR}`)
  return { uploaded: skills.length, sizeKb, skipped: false }
}
