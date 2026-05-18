import { NextRequest } from 'next/server'
import { connectSandbox } from '@/lib/sandbox-connect'

export const maxDuration = 600 // 10 minutes for build+submit process

// Global map to store running PTY process PIDs keyed by sandboxId
// so the input endpoint can write to stdin.
// Attach to globalThis so it survives HMR reloads in development.
const globalForProcesses = globalThis as typeof globalThis & {
  __easRunningProcesses?: Map<string, { pid: number; sandboxId: string }>
}
if (!globalForProcesses.__easRunningProcesses) {
  globalForProcesses.__easRunningProcesses = new Map()
}
const runningProcesses = globalForProcesses.__easRunningProcesses

// Export for use by the input route
export { runningProcesses }

export async function POST(request: NextRequest) {
  try {
    const {
      sandboxId,
      projectId,
      appName,
      bundleId,
      appleId,
      applePassword,
      expoToken,
    } = await request.json()

    if (!sandboxId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Sandbox ID and Project ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!expoToken) {
      return new Response(
        JSON.stringify({ error: 'Expo token is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Connect to the sandbox
    const sbx = await connectSandbox(sandboxId)
    if (!sbx) {
      return new Response(
        JSON.stringify({ error: 'Failed to connect to sandbox' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let submissionUrl: string | null = null
        let overallSuccess = false

        function sendEvent(event: Record<string, unknown>) {
          try {
            controller.enqueue(
              encoder.encode(JSON.stringify(event) + '\n')
            )
          } catch {
            // Stream may already be closed
          }
        }

        try {
          // Phase 0: Patch app.json to avoid interactive prompts
          sendEvent({
            type: 'log',
            data: '[Setup] Configuring app for production build...',
          })

          // Sanitize appName for Xcode target compatibility:
          // expo.name and expo.slug must be lowercase alphanumeric so that
          // expo prebuild and EAS "Configure Xcode project" derive the same target name.
          // CFBundleDisplayName preserves the user-facing display name on device.
          const sanitizedName = appName
            ? appName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'app'
            : ''

          const patchScript = `
            const fs = require('fs');
            const configPath = '/home/user/app/app.json';
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (!config.expo) config.expo = {};
            if (!config.expo.ios) config.expo.ios = {};
            if (!config.expo.ios.infoPlist) config.expo.ios.infoPlist = {};
            config.expo.ios.infoPlist.ITSAppUsesNonExemptEncryption = false;
            ${appName ? `config.expo.name = ${JSON.stringify(sanitizedName)};` : ''}
            ${appName ? `config.expo.slug = ${JSON.stringify(sanitizedName)};` : ''}
            ${appName ? `config.expo.ios.infoPlist.CFBundleDisplayName = ${JSON.stringify(appName)};` : ''}
            ${bundleId ? `config.expo.ios.bundleIdentifier = ${JSON.stringify(bundleId)};` : ''}
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('app.json patched successfully');
          `.trim()

          await sbx.commands.run(
            `node -e ${shellEscape(patchScript)}`,
            {
              cwd: '/home/user/app',
              timeoutMs: 10_000,
              onStdout: (data: string) => sendEvent({ type: 'log', data }),
              onStderr: (data: string) => sendEvent({ type: 'log', data }),
            }
          )

          // Phase 0b: Remove stale native dirs so EAS runs a fresh prebuild
          // on its servers using the patched app.json. This ensures the Xcode
          // target name matches the current expo.name/slug (see EAS CLI #1357).
          sendEvent({
            type: 'log',
            data: '[Setup] Removing stale native directories...',
          })

          await sbx.commands.run(
            `rm -rf /home/user/app/ios /home/user/app/android /home/user/app/.expo`,
            {
              cwd: '/home/user/app',
              timeoutMs: 10_000,
              onStdout: (data: string) => sendEvent({ type: 'log', data }),
              onStderr: (data: string) => sendEvent({ type: 'log', data }),
            }
          )

          // Phase 1: Initialize EAS project (non-interactive is fine here)
          sendEvent({
            type: 'log',
            data: '[Phase 1] Initializing EAS project...',
          })

          const initCmd = `export EXPO_TOKEN=${shellEscape(expoToken)} && npx eas-cli@latest init --force --non-interactive`

          const initResult = await sbx.commands.run(initCmd, {
            cwd: '/home/user/app',
            timeoutMs: 120_000,
            onStdout: (data: string) => sendEvent({ type: 'log', data }),
            onStderr: (data: string) => sendEvent({ type: 'log', data }),
          })

          if (initResult.exitCode !== 0) {
            sendEvent({
              type: 'log',
              data: `[Phase 1] EAS init failed with exit code ${initResult.exitCode}`,
            })
            sendEvent({
              type: 'done',
              success: false,
              submissionUrl: null,
            })
            controller.close()
            return
          }

          sendEvent({
            type: 'log',
            data: '[Phase 1] EAS project initialized successfully.',
          })

          // Phase 2: Build and submit using PTY for interactive Apple auth
          sendEvent({
            type: 'log',
            data: '[Phase 2] Starting EAS build + submit...',
          })

          const envExports = [
            `export EXPO_TOKEN=${shellEscape(expoToken)}`,
            `export EAS_BUILD_NO_EXPO_GO_WARNING=true`,
            `export EAS_NO_VCS=1`,
            appleId ? `export EXPO_APPLE_ID=${shellEscape(appleId)}` : '',
            applePassword ? `export EXPO_APPLE_PASSWORD=${shellEscape(applePassword)}` : '',
          ].filter(Boolean).join(' && ')

          const buildCmd = `${envExports} && cd /home/user/app && npx eas-cli@latest build -p ios --profile production --auto-submit`

          // Helper to send input to the PTY process
          let ptyPid: number | undefined

          const autoRespond = async (input: string) => {
            try {
              if (ptyPid !== undefined) {
                await sbx.pty.sendInput(
                  ptyPid,
                  new TextEncoder().encode(input + '\n')
                )
              }
            } catch {
              // Best effort – process may have already exited
            }
          }

          // Rolling buffer of recent PTY output so we can detect prompts
          // that arrive split across multiple onData chunks.
          let outputBuffer = ''
          // Track which prompts we already fired to avoid duplicates
          let firedMethod = false
          let firedCode = false

          // Use PTY for the build command – this gives us a real terminal
          // so EAS CLI's interactive credential & 2FA prompts work properly
          const ptyHandle = await sbx.pty.create({
            cols: 120,
            rows: 40,
            cwd: '/home/user/app',
            timeoutMs: 540_000, // 9 minutes
            onData: (rawData: Uint8Array) => {
              const text = new TextDecoder().decode(rawData)
              // Strip ANSI escape codes for cleaner log display
              let cleanText = stripAnsi(text)
              if (!cleanText.trim()) return

              // Mask credentials in output
              if (expoToken) cleanText = cleanText.replaceAll(expoToken, '***')
              if (applePassword) cleanText = cleanText.replaceAll(applePassword, '***')

              // Skip terminal prompt lines (e.g. "user@e2b:~/app$")
              if (/^\d*;?user@e2b/.test(cleanText.trim())) return
              // Skip lines that are just the export command being echoed
              if (cleanText.includes('export EXPO_TOKEN=') || cleanText.includes('export EXPO_APPLE_')) return

              // Append to rolling buffer (keep last 1000 chars to match across chunks)
              outputBuffer += cleanText
              if (outputBuffer.length > 1000) {
                outputBuffer = outputBuffer.slice(-1000)
              }

              handleOutput(cleanText, sendEvent, submissionUrl, (url) => {
                submissionUrl = url
              }, autoRespond, outputBuffer, {
                firedMethod,
                firedCode,
                setFiredMethod: () => { firedMethod = true },
                setFiredCode: () => { firedCode = true },
              })
            },
          })

          ptyPid = ptyHandle.pid

          // Store process info for stdin access from input route
          runningProcesses.set(sandboxId, {
            pid: ptyHandle.pid,
            sandboxId,
          })

          // Send the build command to the PTY
          await sbx.pty.sendInput(
            ptyHandle.pid,
            new TextEncoder().encode(buildCmd + '\n')
          )

          // Wait for the PTY process to complete
          try {
            const result = await ptyHandle.wait()
            overallSuccess = result.exitCode === 0
          } catch (err: any) {
            overallSuccess = false
            sendEvent({
              type: 'log',
              data: `Build process error: ${err.message || 'Unknown error'}`,
            })
          }

          // Clean up
          runningProcesses.delete(sandboxId)

          sendEvent({
            type: 'done',
            success: overallSuccess,
            submissionUrl,
          })
        } catch (err: any) {
          runningProcesses.delete(sandboxId)
          sendEvent({
            type: 'log',
            data: `Error: ${err.message || 'Unknown error'}`,
          })
          sendEvent({
            type: 'done',
            success: false,
            submissionUrl: null,
          })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Build-and-submit error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to start build and submit',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Process output lines from the EAS CLI and detect notable events.
 * Uses both the current chunk and a rolling buffer to detect prompts
 * that may arrive split across multiple PTY data events.
 */
function handleOutput(
  data: string,
  sendEvent: (event: Record<string, unknown>) => void,
  currentSubmissionUrl: string | null,
  setSubmissionUrl: (url: string) => void,
  autoRespond?: (input: string) => Promise<void>,
  outputBuffer?: string,
  promptState?: {
    firedMethod: boolean
    firedCode: boolean
    setFiredMethod: () => void
    setFiredCode: () => void
  },
) {
  // Always send the raw log
  sendEvent({ type: 'log', data })

  const lower = data.toLowerCase()
  // Check both the current chunk and the rolling buffer for pattern matches
  const bufferLower = (outputBuffer || data).toLowerCase()

  // Check for login failure
  if (data.includes('Invalid username and password combination')) {
    sendEvent({ type: 'prompt', prompt: 'credentials_failed' })
    return
  }

  // Detect Apple 2FA / two-step verification – method selection
  if (!promptState?.firedMethod) {
    if (
      lower.includes('two-factor') ||
      lower.includes('two-step') ||
      lower.includes('verify your identity') ||
      lower.includes('how do you want to verify') ||
      lower.includes('how would you like to') ||
      lower.includes('trusted phone') ||
      lower.includes('sms to')
    ) {
      promptState?.setFiredMethod()
      sendEvent({ type: 'prompt', prompt: '2fa_method' })
      return
    }
  }

  // Detect 2FA code entry prompt – check both current chunk AND buffer
  // because the prompt text often arrives split across multiple PTY chunks
  if (!promptState?.firedCode) {
    const codeDetected =
      // Current chunk matches
      (lower.includes('enter the') && (lower.includes('digit code') || lower.includes('verification code'))) ||
      /code\s*:\s*$/i.test(data.trim()) ||
      lower.includes('please enter') && lower.includes('code') ||
      lower.includes('security code') ||
      lower.includes('type your verification') ||
      // Buffer matches (catches prompts split across chunks)
      (bufferLower.includes('enter the') && (bufferLower.includes('digit code') || bufferLower.includes('verification code'))) ||
      /code\s*:\s*$/i.test((outputBuffer || '').trim()) ||
      (bufferLower.includes('please enter') && bufferLower.includes('code') && !bufferLower.includes('how do you want'))

    if (codeDetected) {
      promptState?.setFiredCode()
      sendEvent({ type: 'prompt', prompt: '2fa_code' })
      return
    }
  }

  // Auto-respond to EAS interactive prompts
  if (autoRespond) {
    // Any (Y/n) prompt – the capital Y means Yes is the default, safe to auto-accept
    if (/\(Y\/n\)\s*$/.test(data.trim())) {
      autoRespond('Y')
      return
    }
  }

  // Check for submission/build URL
  const urlMatch = data.match(/(https:\/\/expo\.dev\/accounts\/[^\s]+)/)
  if (urlMatch) {
    setSubmissionUrl(urlMatch[1])
  }
}

/**
 * Strip ANSI escape codes from terminal output.
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '')
}

/**
 * Escape a string for safe use in a shell command.
 */
function shellEscape(str: string): string {
  return "'" + str.replace(/'/g, "'\\''") + "'"
}
