import { Sandbox } from '@e2b/code-interpreter'
import { Client } from 'pg'

const INACTIVITY_MS = 2 * 60 * 60 * 1000 // 2 hours (was 30 min)
const BATCH_SIZE = 10

const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://vibe_flutter:vibe_flutter_dev@localhost:5432/vibe_code_flutter',
})

async function cleanup() {
  console.log('[Cleanup] Starting sandbox cleanup job...')
  await db.connect()

  const cutoff = new Date(Date.now() - INACTIVITY_MS)

  const result = await db.query(
    `SELECT id, sandbox_id, updated_at
     FROM projects
     WHERE sandbox_id IS NOT NULL
       AND sandbox_id != 'local-flutter-sandbox'
       AND status = 'active'
       AND updated_at < $1
     LIMIT $2`,
    [cutoff, BATCH_SIZE]
  )

  console.log(`[Cleanup] Found ${result.rows.length} stale sandboxes`)

  for (const project of result.rows) {
    if (!project.sandbox_id) continue

    try {
      console.log(`[Cleanup] Killing sandbox ${project.sandbox_id} for project ${project.id}`)
      await Sandbox.kill(project.sandbox_id)
      console.log(`[Cleanup] Killed sandbox ${project.sandbox_id}`)
    } catch (err: any) {
      if (err.message?.includes('not found') || err.status === 404) {
        console.log(`[Cleanup] Sandbox ${project.sandbox_id} already dead`)
      } else {
        console.error(`[Cleanup] Error killing sandbox ${project.sandbox_id}:`, err.message)
      }
    }

    // Only clear sandbox_id, DO NOT archive - user can reconnect later
    try {
      await db.query(
        `UPDATE projects SET sandbox_id = NULL, updated_at = NOW() WHERE id = $1`,
        [project.id]
      )
      console.log(`[Cleanup] Cleared sandbox_id for project ${project.id}`)
    } catch (err: any) {
      console.error(`[Cleanup] Error updating project ${project.id}:`, err.message)
    }
  }

  await db.end()
  console.log('[Cleanup] Done')
  process.exit(0)
}

cleanup().catch((err) => {
  console.error('[Cleanup] Fatal error:', err)
  process.exit(1)
})
