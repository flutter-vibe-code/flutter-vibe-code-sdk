// Convex environment variable management
// Utilities for reading and writing environment variables to Convex deployments

import type { ConvexProject, ConvexEnvVar } from './types'

/**
 * Query a single environment variable from a Convex deployment
 */
export async function queryEnvVariable(
  project: ConvexProject,
  name: string
): Promise<string | null> {
  const response = await fetch(`${project.deploymentUrl}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Convex ${project.token}`,
    },
    body: JSON.stringify({
      path: '_system/cli/queryEnvironmentVariables:get',
      format: 'convex_encoded_json',
      args: [{ name }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to query environment variable: ${response.status}`)
  }

  const respJSON: any = await response.json()

  if (respJSON.status !== 'success') {
    throw new Error(`Failed to query environment variable: ${JSON.stringify(respJSON)}`)
  }

  const udfResult = respJSON.value
  return udfResult && udfResult.value
}

/**
 * Set multiple environment variables on a Convex deployment
 */
export async function setEnvVariables(
  project: ConvexProject,
  variables: Record<string, string>
): Promise<void> {
  const response = await fetch(`${project.deploymentUrl}/api/update_environment_variables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Convex ${project.token}`,
    },
    body: JSON.stringify({
      changes: Object.entries(variables).map(([name, value]) => ({
        name,
        value,
      })),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to set environment variables: ${response.status} ${errorText}`)
  }
}

/**
 * Query environment variable with automatic retries
 */
export async function queryEnvVariableWithRetries(
  project: ConvexProject,
  name: string,
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<string | null> {
  return withRetries(() => queryEnvVariable(project, name), maxRetries, retryDelay)
}

/**
 * Set environment variables with automatic retries
 */
export async function setEnvVariablesWithRetries(
  project: ConvexProject,
  variables: Record<string, string>,
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<void> {
  return withRetries(() => setEnvVariables(project, variables), maxRetries, retryDelay)
}

/**
 * Generic retry wrapper
 */
async function withRetries<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 500
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }
  // TypeScript requires this even though it's unreachable
  throw new Error('Max retries exceeded')
}

/**
 * Initialize Convex Auth for a project
 * Generates JWKS and JWT private key if not already set
 */
export async function initializeConvexAuth(
  project: ConvexProject,
  siteUrl: string = 'http://127.0.0.1:5173'
): Promise<void> {
  const SITE_URL = await queryEnvVariableWithRetries(project, 'SITE_URL')
  const JWKS = await queryEnvVariableWithRetries(project, 'JWKS')
  const JWT_PRIVATE_KEY = await queryEnvVariableWithRetries(project, 'JWT_PRIVATE_KEY')

  const newEnv: Record<string, string> = {}

  if (!SITE_URL) {
    newEnv.SITE_URL = siteUrl
  }

  if (!JWKS || !JWT_PRIVATE_KEY) {
    const keys = await generateAuthKeys()
    newEnv.JWKS = JSON.stringify(keys.JWKS)
    newEnv.JWT_PRIVATE_KEY = keys.JWT_PRIVATE_KEY
  }

  if (Object.entries(newEnv).length > 0) {
    await setEnvVariablesWithRetries(project, newEnv)
  }
}

/**
 * Generate JWT keys for Convex Auth
 */
async function generateAuthKeys(): Promise<{
  JWT_PRIVATE_KEY: string
  JWKS: { keys: Array<any> }
}> {
  // Use the Web Crypto API (available in Node.js 15+)
  const { subtle } = globalThis.crypto

  // Generate RSA key pair
  const keyPair = await subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  )

  // Export private key as PKCS8
  const privateKeyBuffer = await subtle.exportKey('pkcs8', keyPair.privateKey)
  const privateKeyBase64 = Buffer.from(privateKeyBuffer).toString('base64')
  const privateKeyPEM =
    `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`

  // Export public key as JWK
  const publicKeyJWK = await subtle.exportKey('jwk', keyPair.publicKey)

  // Create JWKS
  const jwks = {
    keys: [
      {
        use: 'sig',
        kty: publicKeyJWK.kty,
        n: publicKeyJWK.n,
        e: publicKeyJWK.e,
        alg: 'RS256',
      },
    ],
  }

  return {
    JWT_PRIVATE_KEY: privateKeyPEM.trimEnd().replace(/\n/g, ' '),
    JWKS: jwks,
  }
}
