import type { Sandbox } from '@e2b/code-interpreter'

const FIFO = '/home/user/.fvc-flutter.fifo'
const KILL_SH = '/home/user/.fvc-flutter-kill.sh'
const LAUNCH_SH = '/home/user/.fvc-flutter-launch.sh'

/**
 * Hot-restart the Flutter dev server inside the sandbox.
 *
 * Two paths:
 *  - FAST (~2s): if a FIFO is wired to the flutter run stdin and the process
 *    is alive, write "R\n" — that triggers an in-process hot restart, which
 *    keeps the dart_tool incremental cache warm.
 *  - SLOW (~30s): otherwise, kill any stale flutter processes, relaunch with
 *    a FIFO attached this time, so the NEXT restart can take the fast path.
 *
 * Why FIFO + `tail -f`:
 *  - `flutter run -d web-server` listens on stdin for keys (r=reload, R=restart,
 *    q=quit). We need a bidirectional stdin we can write to from outside the
 *    process.
 *  - A named pipe (mkfifo) opens for write by another process at any time.
 *  - `tail -f $FIFO | flutter run ...` keeps the pipe open and forwards bytes.
 *  - Without `tail -f`, the pipe EOFs as soon as the first writer closes,
 *    flutter sees EOF on stdin and ignores subsequent writers.
 */
export async function restartFlutterServer(
  sandbox: Sandbox,
  opts: { port?: number; onLog?: (msg: string) => void } = {},
): Promise<{ ok: boolean; durationMs: number; mode: 'hot' | 'cold' | 'failed'; error?: string }> {
  const port = opts.port ?? 3000
  const log = opts.onLog ?? ((m: string) => console.log('[Flutter HotRestart]', m))
  const start = Date.now()

  // FAST PATH: existing fifo + alive flutter → just write "R\n"
  try {
    const probe = await sandbox.commands.run(
      `test -p ${FIFO} && pgrep -f flutter_tools.snapshot >/dev/null && echo alive || echo dead`,
      { timeoutMs: 5_000 },
    )
    if (probe.stdout?.trim() === 'alive') {
      log('fast path: writing R to fifo for hot restart…')
      await sandbox.commands.run(`printf 'R\\n' > ${FIFO}`, { timeoutMs: 5_000 })
      const durationMs = Date.now() - start
      log(`✓ hot restart issued in ${durationMs}ms`)
      return { ok: true, durationMs, mode: 'hot' }
    }
  } catch (e) {
    log(`fast-path probe failed (falling back): ${e instanceof Error ? e.message : String(e)}`)
  }

  // SLOW PATH: cold relaunch with fifo wired in
  try {
    log('cold path: killing existing flutter run…')
    const killScript = [
      '#!/bin/bash',
      `lsof -ti:${port} 2>/dev/null | xargs -r kill -9`,
      'pgrep -f frontend_server_aot 2>/dev/null | xargs -r kill -9',
      'pgrep -f dds_aot.dart.snapshot 2>/dev/null | xargs -r kill -9',
      'pgrep -f flutter_tools.snapshot 2>/dev/null | xargs -r kill -9',
      `pgrep -f 'tail -f ${FIFO}' 2>/dev/null | xargs -r kill -9`,
      'sleep 2',
      `rm -f ${FIFO}`,
      'echo killdone',
      '',
    ].join('\n')
    await sandbox.files.write(KILL_SH, killScript)
    const kill = await sandbox.commands.run(`bash ${KILL_SH}`, { timeoutMs: 20_000 })
    if (kill.exitCode !== 0) {
      log(`kill exit ${kill.exitCode} (continuing): ${kill.stderr?.slice(0, 200) || ''}`)
    }

    log('cold path: relaunching flutter run with FIFO stdin…')
    const launchScript = [
      '#!/bin/bash',
      'export PATH=/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:$PATH',
      'cd /home/user/app',
      'rm -f /tmp/flutter.log',
      `mkfifo ${FIFO} 2>/dev/null || true`,
      // tail -f keeps fifo open even when no writer is connected; its stdout
      // is piped to flutter's stdin, so we can write keys to fifo from outside.
      `nohup bash -c "tail -f ${FIFO} | flutter run -d web-server --web-hostname 0.0.0.0 --web-port ${port}" > /tmp/flutter.log 2>&1 &`,
      'disown',
      'echo "launched pid=$!"',
    ].join('\n')
    await sandbox.files.write(LAUNCH_SH, launchScript)
    const launch = await sandbox.commands.run(
      `su - user -c 'bash ${LAUNCH_SH}'`,
      { timeoutMs: 15_000 },
    )
    log(`launch: ${launch.stdout?.trim().slice(0, 200)}`)

    const durationMs = Date.now() - start
    log(`✓ cold restart issued in ${durationMs}ms — subsequent restarts will use fast path`)
    return { ok: true, durationMs, mode: 'cold' }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    log(`✗ restart failed: ${error}`)
    return { ok: false, durationMs: Date.now() - start, mode: 'failed', error }
  }
}
