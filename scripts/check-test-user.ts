/**
 * Script to check if test user has any projects
 * Usage: bun run scripts/check-test-user.ts
 */

import { db } from '@/lib/db'
import { projects, user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-default'

async function checkTestUser() {
  console.log('🔍 Checking test user:', TEST_USER_ID)
  console.log('─'.repeat(60))

  // Check if user exists
  const [testUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, TEST_USER_ID))
    .limit(1)

  if (testUser) {
    console.log('✅ User exists:')
    console.log('  - ID:', testUser.id)
    console.log('  - Email:', testUser.email)
    console.log('  - Name:', testUser.name)
  } else {
    console.log('❌ User does not exist in database')
    console.log('   Creating test user...')

    // Create test user
    await db.insert(user).values({
      id: TEST_USER_ID,
      email: 'test@capsule.dev',
      name: 'Test User',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log('✅ Test user created')
  }

  console.log('─'.repeat(60))

  // Check projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, TEST_USER_ID))
    .orderBy(projects.updatedAt)

  console.log(`📦 Projects for test user: ${userProjects.length}`)

  if (userProjects.length > 0) {
    console.log('─'.repeat(60))
    userProjects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.title || 'Untitled'}`)
      console.log(`   ID: ${project.id}`)
      console.log(`   Status: ${project.status}`)
      console.log(`   Created: ${project.createdAt?.toISOString()}`)
      console.log(`   Updated: ${project.updatedAt?.toISOString()}`)
    })
  } else {
    console.log('\n⚠️  No projects found for test user')
    console.log('   You can create a project through the web interface at:')
    console.log('   http://localhost:3210')
  }

  console.log('\n' + '─'.repeat(60))
  process.exit(0)
}

checkTestUser().catch((error) => {
  console.error('❌ Error:', error)
  process.exit(1)
})
