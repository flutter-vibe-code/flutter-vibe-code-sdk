#!/usr/bin/env npx tsx
/**
 * Test the claude-executor.ts in isolation to verify image download works
 *
 * Run with: pnpm dlx tsx sandbox-templates/expo-template/test-executor-isolation.ts
 */

import { Sandbox } from '@e2b/code-interpreter'

const TEST_IMAGE_URL = 'https://placehold.co/600x400.png'

async function main() {
  console.log('========================================')
  console.log('🧪 Claude Executor Isolation Test')
  console.log('========================================')

  // Step 1: Create sandbox from the expo template
  console.log('\n📦 Creating E2B sandbox from expo template...')
  const sandbox = await Sandbox.create({
    template: 'sm3r39vktkmu37lna0qa', // expo template
    apiKey: process.env.E2B_API_KEY,
  })
  console.log(`✅ Sandbox created: ${sandbox.sandboxId}`)

  try {
    // Step 2: First check if index.ts exists and what version it is
    console.log('\n🔍 Checking Claude SDK installation...')
    const checkResult = await sandbox.commands.run('ls -la /claude-sdk/ && head -70 /claude-sdk/index.ts', { timeoutMs: 10000 })
    console.log('SDK check result:')
    console.log(checkResult.stdout)
    if (checkResult.stderr) {
      console.log('stderr:', checkResult.stderr)
    }

    // Step 3: Build the command exactly like claude-code-service.ts does
    const imageUrls = [TEST_IMAGE_URL]
    const imageUrlsJson = JSON.stringify(imageUrls).replace(/"/g, '\\"')
    const imageUrlsArg = ` --image-urls="${imageUrlsJson}"`

    const prompt = 'Test prompt with image'
    const cwd = '/home/user/app'

    console.log('\n📋 Building command arguments...')
    console.log('Image URLs JSON:', JSON.stringify(imageUrls))
    console.log('Escaped JSON:', imageUrlsJson)
    console.log('Full argument:', imageUrlsArg)

    // Step 4: Test just the image download part by creating a mini test script
    const downloadTestScript = `
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

async function downloadImage(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          file.close()
          fs.unlinkSync(destPath)
          downloadImage(redirectUrl, destPath).then(resolve).catch(reject)
          return
        }
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlinkSync(destPath)
        reject(new Error(\`Failed to download image: HTTP \${response.statusCode}\`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(destPath)
      })
    }).on('error', (err) => {
      file.close()
      try { fs.unlinkSync(destPath) } catch {}
      reject(err)
    })
  })
}

async function main() {
  const url = '${TEST_IMAGE_URL}'
  const imagesDir = '/tmp/attached-images'

  console.log('🖼️ Testing image download...')
  console.log('URL:', url.substring(0, 80) + '...')

  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
    console.log('✅ Created images directory:', imagesDir)
  }

  const destPath = path.join(imagesDir, 'test-image.png')
  console.log('Destination:', destPath)

  try {
    await downloadImage(url, destPath)
    console.log('✅ Download successful!')

    // Check file exists and get size
    const stats = fs.statSync(destPath)
    console.log('File size:', stats.size, 'bytes')

    // List the directory
    const files = fs.readdirSync(imagesDir)
    console.log('Files in', imagesDir + ':', files)

  } catch (err) {
    console.error('❌ Download failed:', err)
  }
}

main()
`

    console.log('\n🚀 Writing and running download test...')
    await sandbox.files.write('/claude-sdk/test-download.ts', downloadTestScript)

    const testResult = await sandbox.commands.run('cd /claude-sdk && npx tsx test-download.ts', { timeoutMs: 60000 })
    console.log('\n📤 Download test output:')
    console.log(testResult.stdout)
    if (testResult.stderr) {
      console.log('\n⚠️ stderr:')
      console.log(testResult.stderr)
    }
    console.log('Exit code:', testResult.exitCode)

    // Step 5: Now test the full executor with a simple prompt (no API call, just test argument parsing)
    console.log('\n========================================')
    console.log('🧪 Testing full executor argument parsing')
    console.log('========================================')

    // Create a modified executor that just tests argument parsing without calling Claude
    const testExecutorScript = `
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'

async function downloadImage(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location
        if (redirectUrl) {
          file.close()
          fs.unlinkSync(destPath)
          downloadImage(redirectUrl, destPath).then(resolve).catch(reject)
          return
        }
      }

      if (response.statusCode !== 200) {
        file.close()
        try { fs.unlinkSync(destPath) } catch {}
        reject(new Error(\`Failed to download image: HTTP \${response.statusCode}\`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(destPath)
      })
    }).on('error', (err) => {
      file.close()
      try { fs.unlinkSync(destPath) } catch {}
      reject(err)
    })
  })
}

async function main() {
  console.log('========================================')
  console.log('🚀 EXECUTOR ARGUMENT TEST')
  console.log('========================================')
  console.log('Raw process.argv:', process.argv)

  const args = process.argv.slice(2)
  console.log('Parsed args:', args)

  const promptArg = args.find((arg) => arg.startsWith('--prompt='))
  const imageUrlsArg = args.find((arg) => arg.startsWith('--image-urls='))

  console.log('Found arguments:', { promptArg: !!promptArg, imageUrlsArg: !!imageUrlsArg })

  if (!promptArg) {
    console.error('--prompt argument is required')
    process.exit(1)
  }

  const prompt = promptArg.split('=').slice(1).join('=') // Handle = in value

  // Parse image URLs
  let imageUrls: string[] = []
  if (imageUrlsArg) {
    console.log('🖼️ IMAGE URLS ARG FOUND')
    console.log('Full arg:', imageUrlsArg)
    try {
      const imageUrlsJson = imageUrlsArg.substring('--image-urls='.length)
      console.log('JSON part:', imageUrlsJson)
      imageUrls = JSON.parse(imageUrlsJson)
      console.log('✅ Successfully parsed', imageUrls.length, 'image URLs')
      imageUrls.forEach((url, idx) => console.log(\`🖼️ Image \${idx + 1}:\`, url.substring(0, 80)))
    } catch (err) {
      console.error('❌ Failed to parse --image-urls argument:', err)
      console.error('Raw arg was:', imageUrlsArg)
    }
  } else {
    console.log('📝 No image URLs provided')
  }

  // Test image download
  const downloadedImagePaths: string[] = []

  if (imageUrls.length > 0) {
    console.log('\\n========================================')
    console.log('🖼️ DOWNLOADING IMAGES')
    console.log('========================================')

    const imagesDir = '/tmp/attached-images'
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i]
      const urlPath = new URL(url).pathname
      const ext = path.extname(urlPath) || '.png'
      const filename = \`image-\${i + 1}\${ext}\`
      const destPath = path.join(imagesDir, filename)

      console.log(\`🖼️ Downloading image \${i + 1}/\${imageUrls.length}...\`)
      try {
        await downloadImage(url, destPath)
        downloadedImagePaths.push(destPath)
        console.log(\`✅ Image \${i + 1} saved to: \${destPath}\`)
      } catch (err) {
        console.error(\`❌ Failed to download image \${i + 1}:\`, err)
      }
    }
  }

  // Build final prompt
  let finalPrompt = prompt

  if (downloadedImagePaths.length > 0) {
    const imageInstructions = downloadedImagePaths
      .map((imgPath, i) => \`- Image \${i + 1}: \${imgPath}\`)
      .join('\\n')

    finalPrompt = \`The user has attached \${downloadedImagePaths.length} image(s) for reference. Please read and analyze these images to understand the context:
\${imageInstructions}

User request:
\${prompt}\`
  }

  console.log('\\n========================================')
  console.log('📝 FINAL PROMPT')
  console.log('========================================')
  console.log(finalPrompt)

  console.log('\\n✅ TEST COMPLETE')
}

main().catch(console.error)
`

    await sandbox.files.write('/claude-sdk/test-executor.ts', testExecutorScript)

    // Run with the full command like claude-code-service.ts would
    const fullCommand = `cd /claude-sdk && npx tsx test-executor.ts --prompt="${prompt}"${imageUrlsArg}`
    console.log('\n🚀 Running command:')
    console.log(fullCommand)

    const fullResult = await sandbox.commands.run(fullCommand, { timeoutMs: 120000 })
    console.log('\n📤 Full executor test output:')
    console.log(fullResult.stdout)
    if (fullResult.stderr) {
      console.log('\n⚠️ stderr:')
      console.log(fullResult.stderr)
    }
    console.log('Exit code:', fullResult.exitCode)

  } finally {
    console.log('\n🧹 Cleaning up sandbox...')
    await sandbox.kill()
    console.log('✅ Sandbox killed')
  }

  console.log('\n========================================')
  console.log('🧪 TEST COMPLETE')
  console.log('========================================')
}

main().catch(console.error)
