import type { Sandbox } from '@e2b/code-interpreter'

export interface AnalyzeIssue {
  severity: 'error' | 'warning' | 'info'
  file: string
  line: number
  col: number
  message: string
  rule?: string
}

export interface AnalyzeResult {
  pass: boolean
  errors: AnalyzeIssue[]
  warnings: AnalyzeIssue[]
  info: AnalyzeIssue[]
  rawOutput: string
  durationMs: number
  failedToRun?: string
}

/**
 * Run `flutter analyze` inside the sandbox and parse the output.
 *
 * Notes:
 *   - Sandbox commands.run defaults to root; flutter refuses → wrap in `su - user -c`.
 *   - `--no-fatal-warnings --no-fatal-infos` makes exit=0 the moment there are no
 *     errors; we still parse + return warnings/info for reporting.
 *   - pass = no errors. Warnings/info do not block.
 */
export async function runFlutterAnalyze(sandbox: Sandbox): Promise<AnalyzeResult> {
  const start = Date.now()
  try {
    const exec = await sandbox.commands.run(
      `su - user -c 'export PATH=/opt/flutter/bin:$PATH && cd /home/user/app && flutter analyze --no-pub --no-fatal-warnings --no-fatal-infos 2>&1'`,
      { timeoutMs: 180_000 },
    )
    const raw = (exec.stdout || '') + (exec.stderr || '')
    const issues = parseAnalyzeOutput(raw)
    const errors = issues.filter((i) => i.severity === 'error')
    const warnings = issues.filter((i) => i.severity === 'warning')
    const info = issues.filter((i) => i.severity === 'info')
    return {
      pass: errors.length === 0,
      errors,
      warnings,
      info,
      rawOutput: raw.slice(0, 8000),
      durationMs: Date.now() - start,
    }
  } catch (e) {
    return {
      pass: false,
      errors: [],
      warnings: [],
      info: [],
      rawOutput: '',
      durationMs: Date.now() - start,
      failedToRun: e instanceof Error ? e.message : String(e),
    }
  }
}

/**
 * Default flutter analyze line format:
 *   "   error • <message> • <path>:<line>:<col> • <rule>"
 * (3+ spaces, bullet •, optional rule at the end)
 */
function parseAnalyzeOutput(raw: string): AnalyzeIssue[] {
  const lines = raw.split('\n')
  const issues: AnalyzeIssue[] = []
  const re = /^\s*(error|warning|info)\s*•\s*(.+?)\s*•\s*(.+?):(\d+):(\d+)(?:\s*•\s*(\S+))?\s*$/i
  for (const line of lines) {
    const m = re.exec(line)
    if (!m) continue
    issues.push({
      severity: m[1].toLowerCase() as 'error' | 'warning' | 'info',
      message: m[2],
      file: m[3],
      line: parseInt(m[4], 10),
      col: parseInt(m[5], 10),
      rule: m[6],
    })
  }
  return issues
}

/**
 * Build a fix prompt to send back to the same agent session. Caps to the first
 * 25 errors to keep the prompt small enough for the agent to focus.
 */
export function buildFixPrompt(result: AnalyzeResult, iteration: number): string {
  const cap = 25
  const shown = result.errors.slice(0, cap)
  const lines: string[] = []
  lines.push(
    `[AUTO-FIX iteration ${iteration}] flutter analyze reportó ${result.errors.length} error(es) que rompen el build.`,
  )
  lines.push('')
  lines.push('Arreglalos uno por uno sin cambiar la funcionalidad pedida por el usuario.')
  lines.push('No agregues features nuevas. Tocá solo los archivos listados.')
  lines.push('')
  lines.push('Errores:')
  for (const e of shown) {
    lines.push(`- ${e.file}:${e.line}:${e.col} — ${e.message}${e.rule ? ` (${e.rule})` : ''}`)
  }
  if (result.errors.length > cap) {
    lines.push(`... y ${result.errors.length - cap} más. Atacá primero estos ${cap}.`)
  }
  lines.push('')
  lines.push('Después de aplicar los cambios, terminá el turno con un breve resumen.')
  return lines.join('\n')
}
