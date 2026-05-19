// with image version
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import * as fs from 'fs'
import * as path from 'path'

interface ScriptArgs {
  prompt: string
  systemPrompt?: string
  cwd?: string
  model?: string
  imageUrls?: string[]
}

async function run() {
  console.log('Starting test script...')
  console.log('Raw process.argv:', process.argv)

  const args = process.argv.slice(2)
  console.log('Parsed args:', args)

  const promptArg = args.find((arg) => arg.startsWith('--prompt='))
  const systemPromptArg = args.find((arg) => arg.startsWith('--system-prompt='))
  const cwdArg = args.find((arg) => arg.startsWith('--cwd='))
  const modelArg = args.find((arg) => arg.startsWith('--model='))
  const imageUrlsArg = args.find((arg) => arg.startsWith('--image-urls='))

  console.log('Found arguments:', { promptArg, systemPromptArg, cwdArg, modelArg, imageUrlsArg })

  if (!promptArg) {
    console.error('--prompt argument is required')
    process.exit(1)
  }

  const prompt = promptArg.split('=')[1]
  const systemPrompt = systemPromptArg?.split('=')[1]
  const cwd = cwdArg?.split('=')[1] || '/home/user/app'
  const model = modelArg?.split('=')[1]

  // Parse image URLs from command line argument
  let imageUrls: string[] = []
  if (imageUrlsArg) {
    try {
      const imageUrlsJson = imageUrlsArg.substring('--image-urls='.length)
      imageUrls = JSON.parse(imageUrlsJson)
      console.log('Parsed image URLs:', imageUrls.length, 'images')
    } catch (err) {
      console.error('Failed to parse --image-urls argument:', err)
    }
  }

  console.log('Extracted values:', { prompt, systemPrompt, cwd, model, imageUrlsCount: imageUrls.length })

  // Load .env file explicitly
  try {
    const envPath = '/claude-sdk/.env'
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      const envLines = envContent.split('\n')
      for (const line of envLines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=')
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim()
          }
        }
      }
    }
  } catch (err) {
    console.log('Could not load .env file:', (err as Error).message)
  }

  // Debug environment
  console.log('Environment check:')
  console.log('- Working directory:', process.cwd())
  console.log('- ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)
  console.log(
    '- ANTHROPIC_API_KEY length:',
    process.env.ANTHROPIC_API_KEY?.length || 0,
  )

  // Check if target directory exists, create if not
  console.log('Checking target directory:', cwd)
  try {
    const fullPath = path.resolve(cwd)
    console.log('Full path:', fullPath)
    if (!fs.existsSync(fullPath)) {
      console.log('Creating directory:', fullPath)
      fs.mkdirSync(fullPath, { recursive: true })
    }
    console.log('Directory exists and is accessible')
  } catch (err) {
    console.error('Directory check failed:', err)
  }

  const messages: SDKMessage[] = []
  let completionDetected = false

  // Heartbeat to keep connection alive during long operations
  const heartbeatInterval = setInterval(() => {
    console.log('Streaming: [Heartbeat - Agent is working...]')
  }, 30000) // Every 30 seconds

  try {
    console.log('Starting Claude Code query...')
    // Stream a startup message for the UI
    console.log('Streaming: Initializing AI Code Agent...')

    // Build prompt with images if provided
    // If images are provided, create a content array with text and images
    let queryPrompt: string | Array<{ type: string; text?: string; source?: { type: string; url: string } }> = prompt

    if (imageUrls.length > 0) {
      console.log('Streaming: Processing request with', imageUrls.length, 'attached images...')
      queryPrompt = [
        { type: 'text', text: prompt },
        ...imageUrls.map((url) => ({
          type: 'image' as const,
          source: {
            type: 'url' as const,
            url,
          },
        })),
      ]
      console.log('Built content array with images:', JSON.stringify(queryPrompt).substring(0, 500))
    }

    for await (const message of query({
      prompt: queryPrompt as any,
      abortController: new AbortController(),
      options: {
        cwd,
        permissionMode: 'bypassPermissions',
        // Use Claude Code preset for system prompt to maintain coding assistant behavior
        systemPrompt: systemPrompt
          ? { type: 'preset' as const, preset: 'claude_code' as const, append: systemPrompt }
          : { type: 'preset' as const, preset: 'claude_code' as const },
        // Load project settings to maintain compatibility
        settingSources: ['project', 'local'],
        // Pass model selection if provided (e.g., claude-opus-4-5-20251101, claude-sonnet-4-5-20250929, claude-haiku-4-5-20251001)
        ...(model && { model }),
      },
    })) {
      messages.push(message)

      // Stream ALL messages to ensure UI updates properly
      // Stream the full message as JSON so the UI can parse and display it
      console.log(`Streaming: ${JSON.stringify(message)}`)

      // Also stream completion status separately for easier detection
      if (message.type === 'result') {
        if (message.subtype === 'success') {
          completionDetected = true
          console.log(`Streaming: Task completed successfully`)
          console.log(`Streaming: Cost: $${message.total_cost_usd.toFixed(4)}, Duration: ${(message.duration_ms / 1000).toFixed(2)}s`)
        } else {
          console.log(`Streaming: Task failed: ${message.subtype}`)
        }
      }
    }

    console.log('Query completed successfully')
    // Send explicit completion signal
    console.log('CLAUDE_CODE_COMPLETE')
    console.log(JSON.stringify({ success: true, messages }, null, 2))
  } catch (error) {
    console.error('Error occurred:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(
      JSON.stringify({ success: false, error: errorMessage }, null, 2),
    )
    process.exit(1)
  } finally {
    clearInterval(heartbeatInterval)
  }
}

run()
