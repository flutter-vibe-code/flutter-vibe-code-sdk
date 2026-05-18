import * as fs from 'fs'

/**
 * Loads environment variables from a file
 */
export function loadEnvFile(envPath: string): void {
  try {
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
}
