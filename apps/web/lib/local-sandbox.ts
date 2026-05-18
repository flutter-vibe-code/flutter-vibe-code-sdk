import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

const HOST_WORKSPACE = '/var/www/flutter-vibe-code/examples'
const CONTAINER_NAME = 'flutter-sandbox-demo'

/**
 * Lightweight local sandbox abstraction for the Flutter Docker container.
 * Mimics the E2B Sandbox interface enough for sandbox/route.ts usage.
 */
export class LocalFlutterSandbox {
  sandboxId = 'local-flutter-sandbox'

  files = {
    write: async (filePath: string, content: string) => {
      let rel = filePath
      // Strip container workspace prefixes
      if (rel.startsWith('/workspace/')) {
        rel = rel.slice('/workspace/'.length)
      }
      if (rel.startsWith('/home/user/app/')) {
        rel = rel.slice('/home/user/app/'.length)
      }
      // Ensure we write inside the demo project folder
      if (!rel.startsWith('demo/')) {
        rel = `demo/${rel}`
      }
      const hostPath = path.join(HOST_WORKSPACE, rel)
      await fs.mkdir(path.dirname(hostPath), { recursive: true })
      await fs.writeFile(hostPath, content, 'utf-8')
      console.log(`[LocalSandbox] Wrote ${hostPath}`)
    },
  }

  commands = {
    run: async (cmd: string, opts?: any) => {
      let dockerCmd = cmd
      // Translate old RN-style paths to Flutter container paths
      dockerCmd = dockerCmd.replace(/\/home\/user\/app\//g, '/workspace/demo/')
      dockerCmd = dockerCmd.replace(/\/home\/user\//g, '/workspace/')
      const fullCmd = `docker exec ${CONTAINER_NAME} bash -lc '${dockerCmd.replace(/'/g, "'\"'\"'")}'`
      const timeout = opts?.timeoutMs || 30000
      console.log(`[LocalSandbox] Executing: ${fullCmd}`)
      const { stdout, stderr } = await execAsync(fullCmd, { timeout })
      return { stdout, stderr }
    },
  }

  getHost(port: number) {
    // For Flutter web the container maps 8080 -> host 8100
    if (port === 8080 || port === 80) {
      return '192.168.41.34:8100'
    }
    return `192.168.41.34:${port}`
  }
}
