import * as schema from './schema'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

// Lazy initialization to avoid errors during Next.js build phase
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _pool: Pool | null = null

function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL })
    _db = drizzle(_pool, {
      schema,
      logger: false,
    })
  }
  return _db
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return getDb()[prop as keyof typeof _db]
  },
})

export type Database = typeof db
