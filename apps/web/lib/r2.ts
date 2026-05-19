import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET = process.env.R2_BUCKET || ''
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

const isConfigured = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET

const r2Client = isConfigured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null

function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`
  }
  return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`
}

/**
 * Upload a file to Cloudflare R2
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
): Promise<string> {
  if (!r2Client) {
    throw new Error('R2 is not configured. Check R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.')
  }

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    }),
  )

  return getPublicUrl(key)
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  if (!r2Client) {
    throw new Error('R2 is not configured')
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  )
}

/**
 * List objects in R2 with a given prefix
 */
export async function listR2Objects(prefix: string): Promise<Array<{ key: string; size: number; url: string }>> {
  if (!r2Client) {
    throw new Error('R2 is not configured')
  }

  const result = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
    }),
  )

  return (result.Contents || []).map((obj) => ({
    key: obj.Key || '',
    size: obj.Size || 0,
    url: getPublicUrl(obj.Key || ''),
  }))
}

/**
 * Upload from a fetch response directly to R2
 */
export async function uploadFromUrlToR2(key: string, url: string, contentType?: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  return uploadToR2(key, buffer, contentType || response.headers.get('content-type') || undefined)
}

export { isConfigured as isR2Configured }
