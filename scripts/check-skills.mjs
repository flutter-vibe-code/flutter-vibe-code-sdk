#!/usr/bin/env node

/**
 * Check what skills are currently configured
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Read the config file
const configPath = join(rootDir, 'lib/skills/config.ts')
const configContent = readFileSync(configPath, 'utf-8')

// Extract skill IDs using regex
const skillIdMatches = configContent.matchAll(/id:\s*'([^']+)'/g)
const skillIds = Array.from(skillIdMatches).map(match => match[1])

console.log('╔══════════════════════════════════════╗')
console.log('║  Current Skills Configuration        ║')
console.log('╚══════════════════════════════════════╝')
console.log('')
console.log('Skills that should appear in mentions:')
console.log('')

skillIds.forEach((id, index) => {
  console.log(`  ${index + 1}. ${id}`)
})

console.log('')
console.log('If you\'re seeing different skills in the UI:')
console.log('  1. Clear your browser cache (Cmd+Shift+R on Mac)')
console.log('  2. Or restart the dev server: pnpm run dev:3210')
console.log('')
