import { put } from '@vercel/blob'

interface TwitterMedia {
  media_key: string
  type: 'photo' | 'video' | 'animated_gif'
  url?: string
  preview_image_url?: string
}

interface TweetWithAttachments {
  id: string
  text: string
  attachments?: {
    media_keys?: string[]
  }
}

/**
 * Extract media URLs from a tweet and its includes
 *
 * @param tweet - The tweet object with potential attachments
 * @param mediaIncludes - The media includes from the Twitter API response
 * @returns Array of media URLs (photos only)
 */
export function extractMediaUrls(
  tweet: TweetWithAttachments,
  mediaIncludes?: TwitterMedia[]
): string[] {
  if (!tweet.attachments?.media_keys || !mediaIncludes) {
    return []
  }

  const urls: string[] = []

  for (const mediaKey of tweet.attachments.media_keys) {
    const media = mediaIncludes.find((m) => m.media_key === mediaKey)
    if (media && media.type === 'photo' && media.url) {
      urls.push(media.url)
    }
  }

  return urls
}

/**
 * Download images from URLs and upload to Vercel Blob
 *
 * @param tweetId - The tweet ID (used for organizing blobs)
 * @param mediaUrls - Array of image URLs to download
 * @returns Array of Vercel Blob URLs
 */
export async function downloadAndStoreTweetImages(
  tweetId: string,
  mediaUrls: string[]
): Promise<string[]> {
  if (mediaUrls.length === 0) {
    return []
  }

  const blobUrls: string[] = []

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i]

    try {
      // Download the image
      const response = await fetch(url)

      if (!response.ok) {
        console.error(`Failed to download image from ${url}: ${response.status}`)
        continue
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const buffer = await response.arrayBuffer()

      // Determine file extension from content type
      let extension = 'jpg'
      if (contentType.includes('png')) {
        extension = 'png'
      } else if (contentType.includes('gif')) {
        extension = 'gif'
      } else if (contentType.includes('webp')) {
        extension = 'webp'
      }

      // Upload to Vercel Blob
      const blob = await put(
        `tweet-images/${tweetId}/${i + 1}.${extension}`,
        Buffer.from(buffer),
        {
          access: 'public',
          contentType,
        }
      )

      blobUrls.push(blob.url)
      console.log(`Uploaded tweet image to: ${blob.url}`)
    } catch (error) {
      console.error(`Error processing image from ${url}:`, error)
      // Continue with other images even if one fails
    }
  }

  return blobUrls
}

/**
 * Convert Vercel Blob URLs to base64 data URIs for use with AI
 * This is needed because the AI expects base64 image data
 *
 * @param blobUrls - Array of Vercel Blob URLs
 * @returns Array of base64 data URIs
 */
export async function blobUrlsToBase64(blobUrls: string[]): Promise<string[]> {
  const base64Images: string[] = []

  for (const url of blobUrls) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Failed to fetch blob: ${url}`)
        continue
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const dataUri = `data:${contentType};base64,${base64}`

      base64Images.push(dataUri)
    } catch (error) {
      console.error(`Error converting blob to base64: ${url}`, error)
    }
  }

  return base64Images
}
