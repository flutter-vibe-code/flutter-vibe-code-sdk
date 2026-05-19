#!/usr/bin/env npx tsx
/**
 * Test script that simulates what claude-code-service.ts does when passing
 * image arguments to the E2B sandbox.
 *
 * Run with: pnpm dlx tsx sandbox-templates/expo-template/test-e2b-image-args.ts
 */

import { Sandbox } from '@e2b/code-interpreter'

const TEST_IMAGE_URL = 'https://placehold.co/600x400.png'

async function main() {
  console.log('========================================')
  console.log('🧪 E2B Image Argument Test')
  console.log('========================================')

  // Step 1: Create sandbox
  console.log('\n📦 Creating E2B sandbox...')
  const sandbox = await Sandbox.create({
    template: 'sm3r39vktkmu37lna0qa', // expo template
    apiKey: process.env.E2B_API_KEY,
  })
  console.log(`✅ Sandbox created: ${sandbox.sandboxId}`)

  try {
    // Step 2: Build the exact same command as claude-code-service.ts (lines 135-147)
    const imageUrls = [TEST_IMAGE_URL]

    // This is EXACTLY what claude-code-service.ts does:
    const imageUrlsJson = JSON.stringify(imageUrls).replace(/"/g, '\\"')
    const imageUrlsArg = ` --image-urls="${imageUrlsJson}"`

    console.log('\n📋 Building command arguments...')
    console.log('Original URL:', TEST_IMAGE_URL)
    console.log('JSON stringified:', JSON.stringify(imageUrls))
    console.log('After escaping:', imageUrlsJson)
    console.log('Full argument:', imageUrlsArg)

    // Step 3: Create a test script in the sandbox that echoes what it receives
    const testScript = `
#!/bin/bash
echo "========================================="
echo "🔍 RECEIVED ARGUMENTS:"
echo "========================================="
echo "Number of args: $#"
echo ""
for i in $(seq 1 $#); do
  echo "Arg $i:"
  eval "echo \\\"\\\$${i}\\\""
  echo ""
done

echo "========================================="
echo "🔍 PARSING --image-urls:"
echo "========================================="
for arg in "$@"; do
  if [[ "$arg" == --image-urls=* ]]; then
    value="\${arg#--image-urls=}"
    echo "Raw value:"
    echo "$value"
    echo ""
    echo "Value length: \${#value}"
  fi
done
`

    console.log('\n📝 Writing test script to sandbox...')
    await sandbox.files.write('/tmp/test-args.sh', testScript)
    await sandbox.commands.run('chmod +x /tmp/test-args.sh')

    // Step 4: Run the test script with the exact command format
    const testPrompt = 'test prompt'
    const command = `/tmp/test-args.sh --prompt="${testPrompt}"${imageUrlsArg}`

    console.log('\n🚀 Executing command:')
    console.log(command)
    console.log('\n📤 Output:')

    const result = await sandbox.commands.run(command, { timeoutMs: 10000 })
    console.log(result.stdout)

    if (result.stderr) {
      console.log('\n⚠️ Stderr:')
      console.log(result.stderr)
    }

    console.log(`\n✅ Exit code: ${result.exitCode}`)

    // Step 5: Also test what bun/node receives
    console.log('\n========================================')
    console.log('🔍 Testing Node.js argument parsing')
    console.log('========================================')

    const nodeTestScript = `
const args = process.argv.slice(2);
console.log('Number of args:', args.length);
console.log('');
args.forEach((arg, i) => {
  console.log(\`Arg \${i + 1}:\`);
  console.log(arg);
  console.log(\`Length: \${arg.length}\`);
  console.log('');
});

const imageUrlsArg = args.find(a => a.startsWith('--image-urls='));
if (imageUrlsArg) {
  console.log('Found --image-urls argument');
  const jsonPart = imageUrlsArg.substring('--image-urls='.length);
  console.log('JSON part:', jsonPart);
  console.log('JSON length:', jsonPart.length);
  try {
    const parsed = JSON.parse(jsonPart);
    console.log('✅ JSON parse SUCCESS');
    console.log('Parsed:', parsed);
  } catch (e) {
    console.log('❌ JSON parse FAILED:', e.message);
  }
} else {
  console.log('❌ --image-urls argument NOT FOUND');
}
`
    await sandbox.files.write('/tmp/test-args.js', nodeTestScript)

    const nodeCommand = `node /tmp/test-args.js --prompt="${testPrompt}"${imageUrlsArg}`
    console.log('\n🚀 Executing Node.js test:')
    console.log(nodeCommand)
    console.log('\n📤 Output:')

    const nodeResult = await sandbox.commands.run(nodeCommand, { timeoutMs: 10000 })
    console.log(nodeResult.stdout)

    if (nodeResult.stderr) {
      console.log('\n⚠️ Stderr:')
      console.log(nodeResult.stderr)
    }

  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up sandbox...')
    await sandbox.kill()
    console.log('✅ Sandbox killed')
  }

  console.log('\n========================================')
  console.log('🧪 TEST COMPLETE')
  console.log('========================================')
}

main().catch(console.error)
