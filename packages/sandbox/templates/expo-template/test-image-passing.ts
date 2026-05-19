#!/usr/bin/env npx tsx
// Test script to debug image URL passing to claude-executor

const imageUrl = 'https://placehold.co/600x400.png'

console.log('========================================')
console.log('🧪 TEST: Image URL Passing Debug')
console.log('========================================')

// Test 1: Build the JSON for image URLs
const imageUrls = [imageUrl]
const imageUrlsJson = JSON.stringify(imageUrls)
console.log('\n📋 Test 1: JSON Serialization')
console.log('Original URL:', imageUrl)
console.log('JSON array:', imageUrlsJson)
console.log('JSON length:', imageUrlsJson.length)

// Test 2: Build the command line argument
const commandArg = `--image-urls=${imageUrlsJson}`
console.log('\n📋 Test 2: Command Line Argument')
console.log('Full argument:', commandArg)
console.log('Argument length:', commandArg.length)

// Test 3: Parse it back (simulating what claude-executor does)
console.log('\n📋 Test 3: Parsing Back')
const extracted = commandArg.substring('--image-urls='.length)
console.log('Extracted JSON:', extracted)
try {
  const parsed = JSON.parse(extracted)
  console.log('✅ Parse successful!')
  console.log('Parsed array:', parsed)
  console.log('First URL:', parsed[0])
} catch (err) {
  console.log('❌ Parse failed:', err)
}

// Test 4: Build the content array structure for Claude SDK
console.log('\n📋 Test 4: Claude SDK Content Structure')
const prompt = 'Describe this image'
const contentArray = [
  { type: 'text', text: prompt },
  ...imageUrls.map((url) => ({
    type: 'image' as const,
    source: {
      type: 'url' as const,
      url,
    },
  })),
]
console.log('Content array structure:')
console.log(JSON.stringify(contentArray, null, 2))

// Test 5: Simulate the full command that would be run
console.log('\n📋 Test 5: Full Command Simulation')
const fullCommand = [
  'npx', 'tsx', 'claude-executor.ts',
  '--prompt=Describe this image',
  `--image-urls=${imageUrlsJson}`,
  '--cwd=/home/user/app'
].join(' ')
console.log('Full command:')
console.log(fullCommand)
console.log('\nCommand length:', fullCommand.length)

// Test 6: Check if URL encoding might be an issue
console.log('\n📋 Test 6: URL Encoding Check')
console.log('URL contains special chars:')
console.log('  - @ symbol:', imageUrl.includes('@'))
console.log('  - % symbol:', imageUrl.includes('%'))
console.log('  - space (encoded):', imageUrl.includes('%20'))

// Test 7: Test with encodeURIComponent (in case that's needed)
console.log('\n📋 Test 7: URL Encoding Test')
const encodedUrl = encodeURIComponent(imageUrl)
console.log('Encoded URL:', encodedUrl)
console.log('Would need decoding in executor:', encodedUrl !== imageUrl)

// Test 8: Check what the args array would look like
console.log('\n📋 Test 8: Process.argv Simulation')
const simulatedArgv = [
  '/usr/local/bin/node',
  '/path/to/claude-executor.ts',
  '--prompt=Describe this image',
  `--image-urls=${imageUrlsJson}`,
  '--cwd=/home/user/app'
]
console.log('Simulated process.argv:')
simulatedArgv.forEach((arg, i) => {
  console.log(`  [${i}]: ${arg.substring(0, 100)}${arg.length > 100 ? '...' : ''}`)
})

// Test 9: Find and parse the arg
console.log('\n📋 Test 9: Arg Finding Test')
const args = simulatedArgv.slice(2)
const imageUrlsArg = args.find((arg) => arg.startsWith('--image-urls='))
console.log('Found imageUrlsArg:', imageUrlsArg ? 'YES' : 'NO')
if (imageUrlsArg) {
  console.log('Arg value:', imageUrlsArg.substring(0, 150))
  const jsonPart = imageUrlsArg.substring('--image-urls='.length)
  console.log('JSON part:', jsonPart.substring(0, 150))
  try {
    const parsed = JSON.parse(jsonPart)
    console.log('✅ Successfully parsed:', parsed.length, 'URLs')
  } catch (e) {
    console.log('❌ Failed to parse:', e)
  }
}

console.log('\n========================================')
console.log('🧪 TEST COMPLETE')
console.log('========================================')
