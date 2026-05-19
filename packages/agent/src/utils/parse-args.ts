import * as fs from 'fs'
import type { ExecutorArgs } from '../types.js'

/**
 * Parses command line arguments into ExecutorArgs
 */
export function parseArgs(argv: string[]): ExecutorArgs {
  const args = argv.slice(2)

  const promptArg = args.find((arg) => arg.startsWith('--prompt='))
  const systemPromptArg = args.find((arg) => arg.startsWith('--system-prompt='))
  const systemPromptFileArg = args.find((arg) => arg.startsWith('--system-prompt-file='))
  const cwdArg = args.find((arg) => arg.startsWith('--cwd='))
  const modelArg = args.find((arg) => arg.startsWith('--model='))
  const imageUrlsArg = args.find((arg) => arg.startsWith('--image-urls='))
  const continueArg = args.find((arg) => arg.startsWith('--continue='))

  if (!promptArg) {
    throw new Error('--prompt argument is required')
  }

  // Use substring instead of split to handle '=' in values correctly
  const prompt = promptArg.substring('--prompt='.length)
  const cwd = cwdArg?.substring('--cwd='.length)
  const model = modelArg?.substring('--model='.length)

  // Load system prompt from file or command line
  let systemPrompt: string | undefined
  if (systemPromptFileArg) {
    const systemPromptFilePath = systemPromptFileArg.substring('--system-prompt-file='.length)
    try {
      if (fs.existsSync(systemPromptFilePath)) {
        systemPrompt = fs.readFileSync(systemPromptFilePath, 'utf8')
        console.log('Loaded system prompt from file:', systemPromptFilePath, '- Length:', systemPrompt.length)
      } else {
        console.error('System prompt file not found:', systemPromptFilePath)
      }
    } catch (err) {
      console.error('Failed to read system prompt file:', err)
    }
  } else if (systemPromptArg) {
    systemPrompt = systemPromptArg.substring('--system-prompt='.length)
    console.log('Using system prompt from command line - Length:', systemPrompt?.length || 0)
  }

  // Parse image URLs from command line argument
  let imageUrls: string[] = []
  if (imageUrlsArg) {
    try {
      const imageUrlsJson = imageUrlsArg.substring('--image-urls='.length)
      imageUrls = JSON.parse(imageUrlsJson)
      console.log('Parsed', imageUrls.length, 'image URLs')
    } catch (err) {
      console.error('Failed to parse --image-urls argument:', err)
    }
  }

  // Parse session ID for conversation resumption
  const sessionId = continueArg?.substring('--continue='.length) || undefined

  return {
    prompt,
    systemPrompt,
    cwd,
    model,
    imageUrls,
    sessionId,
  }
}
