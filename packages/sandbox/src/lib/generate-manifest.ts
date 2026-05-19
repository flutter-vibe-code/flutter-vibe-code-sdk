/**
 * Generate Expo manifest.json for mobile app static bundle
 * Based on mobile/scripts/generateManifest.js but adapted for server-side use
 */

import crypto from 'crypto'

interface LaunchAsset {
  hash: string
  key: string
  contentType: string
  url: string
}

interface Asset {
  hash: string
  key: string
  contentType: string
  fileExtension: string
  url: string
}

interface Manifest {
  id: string
  createdAt: string
  runtimeVersion: string
  launchAsset: LaunchAsset
  assets: Asset[]
  metadata: {
    bundler: string
    version: string
    platform: string
    assetsCount: string
  }
}

interface AssetMapEntry {
  httpServerLocation?: string
  type?: string
  [key: string]: any
}

interface AssetMap {
  [key: string]: AssetMapEntry
}

/**
 * Generate SHA256 hash in base64url encoding (RFC 4648 section 5)
 */
function generateHash(content: Buffer | string): string {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Get content type for file extension
 */
function getContentType(extension: string): string {
  // Remove leading dot if present
  const ext = extension.startsWith('.') ? extension : `.${extension}`

  const contentTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }

  return contentTypes[ext] || 'application/octet-stream'
}

interface GenerateManifestOptions {
  projectId: string
  commitId: string
  bundleContent: string | Buffer
  bundleUrl: string // Vercel Blob URL
  assetMap: AssetMap
  assetsData: Array<{
    filename: string
    content: Buffer
    url: string // Vercel Blob URL
  }>
  runtimeVersion?: string
  metadata?: {
    bundler?: string
    version?: string | number
  }
}

/**
 * Generate manifest for mobile app static bundle
 */
export async function generateManifest(
  options: GenerateManifestOptions
): Promise<Manifest> {
  const {
    projectId,
    commitId,
    bundleContent,
    bundleUrl,
    assetMap,
    assetsData,
    runtimeVersion = '1.0.0',
    metadata = {},
  } = options

  // Generate hash for bundle
  const bundleHash = generateHash(bundleContent)

  // Create launch asset (main JS bundle)
  const launchAsset: LaunchAsset = {
    hash: bundleHash,
    key: 'index',
    contentType: 'application/javascript',
    url: bundleUrl,
  }

  // Process assets
  const assets: Asset[] = []

  for (const assetData of assetsData) {
    const assetHash = generateHash(assetData.content)
    const assetInfo = assetMap[assetData.filename]

    // Get file extension from asset map or filename
    let extension = assetInfo?.type || ''
    if (!extension && assetData.filename.includes('.')) {
      extension = assetData.filename.split('.').pop() || ''
    }

    const asset: Asset = {
      hash: assetHash,
      key: assetData.filename,
      contentType: getContentType(extension),
      fileExtension: extension,
      url: assetData.url,
    }

    assets.push(asset)
  }

  // Generate manifest
  const manifest: Manifest = {
    id: commitId,
    createdAt: new Date().toISOString(),
    runtimeVersion: runtimeVersion,
    launchAsset: launchAsset,
    assets: assets,
    metadata: {
      bundler: metadata.bundler || 'metro',
      version: (metadata.version || 0).toString(),
      platform: 'ios',
      assetsCount: assets.length.toString(),
    },
  }

  return manifest
}

/**
 * Validate manifest structure
 */
export function validateManifest(manifest: Manifest): boolean {
  if (!manifest.id || !manifest.createdAt || !manifest.runtimeVersion) {
    return false
  }

  if (!manifest.launchAsset || !manifest.launchAsset.hash || !manifest.launchAsset.url) {
    return false
  }

  if (!Array.isArray(manifest.assets)) {
    return false
  }

  // Validate each asset has required fields
  for (const asset of manifest.assets) {
    if (!asset.hash || !asset.key || !asset.url) {
      return false
    }
  }

  return true
}
