#!/usr/bin/env npx tsx
// Test script to debug the EXACT shell escaping used in claude-code-service.ts

const imageUrl = 'https://placehold.co/600x400.png'

console.log('========================================')
console.log('🧪 TEST: Shell Escaping Debug')
console.log('========================================')

// Simulate EXACTLY what claude-code-service.ts does (lines 135-145)
const imageUrls = [imageUrl]

// This is the exact code from claude-code-service.ts:139
const imageUrlsJson = JSON.stringify(imageUrls).replace(/"/g, '\\"')

// This is the exact code from claude-code-service.ts:140
const imageUrlsArg = ` --image-urls="${imageUrlsJson}"`

console.log('\n📋 Step 1: Original URL')
console.log('URL:', imageUrl)

console.log('\n📋 Step 2: JSON.stringify')
console.log('JSON.stringify result:', JSON.stringify(imageUrls))

console.log('\n📋 Step 3: After .replace(/"/g, \'\\\\"\')')
console.log('Escaped JSON:', imageUrlsJson)

console.log('\n📋 Step 4: Final argument string')
console.log('imageUrlsArg:', imageUrlsArg)

console.log('\n📋 Step 5: Full command that would be run')
const command = `cd /claude-sdk && bun start -- --prompt="test" --system-prompt="test"${imageUrlsArg}`
console.log('Full command:')
console.log(command)

// Now simulate what the shell does when parsing this command
console.log('\n========================================')
console.log('🔍 Simulating Shell Parsing')
console.log('========================================')

// When the shell sees: --image-urls="[\"https://...\"]"
// The shell strips the outer quotes and un-escapes the \" to "
// So process.argv would contain: --image-urls=["https://..."]

console.log('\n📋 What the shell would pass to process.argv:')
// The outer quotes are removed by the shell
// The \" becomes "
const shellParsedArg = `--image-urls=${JSON.stringify(imageUrls)}`
console.log('Shell-parsed arg:', shellParsedArg)

console.log('\n📋 What claude-executor.ts extracts:')
// claude-executor.ts line 47: imageUrlsArg.substring('--image-urls='.length)
const extracted = shellParsedArg.substring('--image-urls='.length)
console.log('Extracted after substring:', extracted)

try {
  const parsed = JSON.parse(extracted)
  console.log('✅ Parse successful!')
  console.log('Parsed result:', parsed)
} catch (e) {
  console.log('❌ Parse FAILED:', e)
}

// But wait - let's check what ACTUALLY happens in E2B sandbox
console.log('\n========================================')
console.log('🔍 The REAL Problem')
console.log('========================================')

console.log('\nThe issue might be that in E2B sandbox, the shell doesn\'t')
console.log('properly unescape the backslash-quote sequences.')
console.log('')
console.log('Possible solutions:')
console.log('1. Use base64 encoding for the JSON')
console.log('2. Write the JSON to a temp file and read it')
console.log('3. Use single quotes instead of double quotes')
console.log('4. Pass as environment variable')

// Test alternative: single quotes
console.log('\n📋 Alternative: Using single quotes')
const singleQuoteArg = ` --image-urls='${JSON.stringify(imageUrls)}'`
console.log('Single quote arg:', singleQuoteArg)

// Test alternative: base64
console.log('\n📋 Alternative: Using base64')
const base64Encoded = Buffer.from(JSON.stringify(imageUrls)).toString('base64')
const base64Arg = ` --image-urls-base64=${base64Encoded}`
console.log('Base64 arg:', base64Arg)
console.log('Decoded:', Buffer.from(base64Encoded, 'base64').toString('utf8'))

// Test alternative: URL encoding
console.log('\n📋 Alternative: Using encodeURIComponent')
const urlEncoded = encodeURIComponent(JSON.stringify(imageUrls))
const urlEncodedArg = ` --image-urls-encoded=${urlEncoded}`
console.log('URL encoded arg:', urlEncodedArg)
console.log('Decoded:', decodeURIComponent(urlEncoded))

console.log('\n========================================')
console.log('🧪 TEST COMPLETE')
console.log('========================================')
