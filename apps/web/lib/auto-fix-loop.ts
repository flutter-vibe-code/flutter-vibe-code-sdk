import type { Sandbox } from '@e2b/code-interpreter'
import { runFlutterAnalyze, buildFixPrompt } from './flutter-analyze'

interface RunAutoFixLoopOpts {
  sandbox: Sandbox
  sessionId?: string | null
  systemPromptArg: string
  modelArg: string
  providerEnvs: Record<string, string>
  sandboxTimeoutMs: number
  maxIterations: number
  onMessage: (text: string) => void
}

/**
 * After the primary agent run finishes, runs `flutter analyze` and, while
 * there are errors, re-invokes the same agent (with --session=<sameId> so it
 * keeps memory) with a "fix these errors" prompt. Loops up to maxIterations.
 *
 * All progress is reported via `onMessage(text)` — the caller is expected to
 * wrap that text into the SlimMessage JSON the UI already understands.
 *
 * Skipped entirely when maxIterations <= 0.
 */
export async function runAutoFixLoop(opts: RunAutoFixLoopOpts): Promise<void> {
  const {
    sandbox,
    sessionId,
    systemPromptArg,
    modelArg,
    providerEnvs,
    sandboxTimeoutMs,
    maxIterations,
    onMessage,
  } = opts

  if (maxIterations <= 0) return

  onMessage('🔍 Running flutter analyze on the generated project…')
  let result = await runFlutterAnalyze(sandbox)

  if (result.failedToRun) {
    onMessage(`⚠️ flutter analyze did not run (${result.failedToRun}). Skipping auto-fix.`)
    return
  }

  if (result.pass) {
    const w = result.warnings.length
    const i = result.info.length
    onMessage(
      `✅ flutter analyze passed — no errors${w || i ? ` (${w} warning${w === 1 ? '' : 's'}, ${i} info)` : ''}.`,
    )
    return
  }

  for (let iter = 1; iter <= maxIterations; iter++) {
    onMessage(
      `⚠️ flutter analyze found **${result.errors.length} error(s)**. Auto-fix iteration ${iter}/${maxIterations}…`,
    )

    const fixPrompt = buildFixPrompt(result, iter)
    const sessArg = sessionId ? ` --session=${sessionId}` : ''
    // POSIX single-quote escape: literal text inside single quotes, ending the
    // string + escaping any literal ' as '\''. Survives $, `, ", newlines, etc.
    const safe = "'" + fixPrompt.replace(/'/g, "'\\''") + "'"
    const fixCommand =
      `cd /claude-sdk && bun start -- ` +
      `--prompt=${safe}` +
      `${systemPromptArg}${sessArg}${modelArg}`

    let lineBuffer = ''
    const handle = await sandbox.commands.run(fixCommand, {
      background: true as const,
      envs: { ...providerEnvs },
      timeoutMs: sandboxTimeoutMs,
      onStdout: (data: string) => {
        lineBuffer += data
        const lines = lineBuffer.split('\n')
        lineBuffer = lines.pop() ?? ''
        for (const line of lines) {
          const t = line.trim()
          if (!t || !t.startsWith('Streaming:')) continue
          // Relay streamed agent SlimMessages to the client as-is.
          onMessage(t.replace(/^Streaming:\s*/, ''))
        }
      },
      onStderr: (data: string) => {
        // Don't spam — only first 200 chars on each chunk
        if (data) onMessage(`Error: ${data.slice(0, 200)}`)
      },
    })

    try {
      await handle.wait({ timeoutMs: sandboxTimeoutMs })
    } catch (e) {
      onMessage(`⚠️ Auto-fix run #${iter} failed to complete: ${(e as Error).message}`)
      return
    }

    onMessage('🔍 Re-running flutter analyze…')
    result = await runFlutterAnalyze(sandbox)

    if (result.failedToRun) {
      onMessage(`⚠️ flutter analyze failed: ${result.failedToRun}.`)
      return
    }

    if (result.pass) {
      onMessage(`✅ All errors fixed after ${iter} iteration${iter === 1 ? '' : 's'}.`)
      return
    }
  }

  const sample = result.errors
    .slice(0, 10)
    .map((e) => `  - ${e.file}:${e.line} — ${e.message}`)
    .join('\n')
  onMessage(
    `⚠️ After ${maxIterations} auto-fix iteration(s) there are still **${result.errors.length} error(s)**:\n\n${sample}\n\nYou can ask me to keep fixing them.`,
  )
}
