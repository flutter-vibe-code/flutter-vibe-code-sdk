import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CloudflareTunnel {
  url: string
  pid: number
  port: number
}

const activeTunnels = new Map<string, CloudflareTunnel>()

export async function startCloudflareTunnel(port: number, identifier: string): Promise<string> {
  await stopCloudflareTunnel(identifier)

  const cmd = `cloudflared tunnel --url http://localhost:${port} --metrics localhost:0`
  console.log(`[CloudflareTunnel] Starting: ${cmd}`)

  const child = exec(cmd, {
    timeout: 30000,
    env: { ...process.env, NO_AUTOUPDATE: 'true' },
  })

  const pid = child.pid!
  console.log(`[CloudflareTunnel] Started with PID ${pid}`)

  let tunnelUrl: string | null = null

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('Cloudflare tunnel startup timed out'))
    }, 30000)

    const checkOutput = (data: string) => {
      if (tunnelUrl) return
      const match = data.match(/(https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com)/)
      if (match) {
        tunnelUrl = match[1]
        clearTimeout(timeout)
        activeTunnels.set(identifier, { url: tunnelUrl, pid, port })
        console.log(`[CloudflareTunnel] URL ready: ${tunnelUrl}`)
        resolve(tunnelUrl)
      }
    }

    child.stdout?.on('data', checkOutput)
    child.stderr?.on('data', checkOutput)

    child.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    child.on('exit', (code) => {
      if (!tunnelUrl) {
        clearTimeout(timeout)
        reject(new Error(`Cloudflare tunnel exited with code ${code}`))
      }
    })
  })
}

export async function stopCloudflareTunnel(identifier: string): Promise<void> {
  const tunnel = activeTunnels.get(identifier)
  if (!tunnel) return

  try {
    process.kill(tunnel.pid, 'SIGTERM')
    console.log(`[CloudflareTunnel] Killed PID ${tunnel.pid}`)
  } catch (e) {
    // Already dead
  }

  activeTunnels.delete(identifier)
}

export async function checkCloudflareTunnel(url: string): Promise<{ isAlive: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
    })
    return { isAlive: response.ok }
  } catch (error: any) {
    return { isAlive: false, error: error.message }
  }
}

export function getTunnelUrl(identifier: string): string | undefined {
  return activeTunnels.get(identifier)?.url
}

