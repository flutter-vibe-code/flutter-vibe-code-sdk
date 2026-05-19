import * as fs from 'fs'
import * as https from 'https'
import * as http from 'http'

/**
 * Downloads an image from a URL and saves it to a local file
 * Returns the local file path
 */
export async function downloadImage(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(destPath)

    protocol.get(url, (response) => {
      // Handle redirects
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
        reject(new Error(`Failed to download image: HTTP ${response.statusCode}`))
        return
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve(destPath)
      })
    }).on('error', (err) => {
      file.close()
      fs.unlinkSync(destPath)
      reject(err)
    })
  })
}
