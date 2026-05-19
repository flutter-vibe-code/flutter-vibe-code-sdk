// Export database client
export { db, type Database } from './client'

// Export all schema definitions
export * from './schema'

// Re-export drizzle operators for convenience
export { eq, and, or, not, desc, asc, lt, gt, lte, gte, sql } from 'drizzle-orm'
