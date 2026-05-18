import { getPusherServer } from '@flutter-vibe-code/pusher/server'
import type { ErrorBuffer, ErrorNotification } from '../shared/types'
import {
  EXPO_ERROR_PATTERNS,
  CONVEX_ERROR_PATTERNS,
  CONVEX_SUCCESS_PATTERNS,
  SENSITIVE_PATTERNS,
} from '../shared/patterns'

// Buffer for accumulating multi-line error messages
const errorBuffers = new Map<string, ErrorBuffer>()

/**
 * Clean ANSI color codes from log data
 */
function cleanAnsiCodes(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '').trim()
}

/**
 * Check if error contains sensitive information that shouldn't be sent to client
 */
function containsSensitiveInfo(message: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Get Pusher channel name for error notifications
 */
export function getErrorChannelName(projectId: string): string {
  return `${projectId}-errors`
}

/**
 * Get Pusher event name for error notifications
 */
export function getErrorEventName(): string {
  return 'error-notification'
}

/**
 * Send error notification via Pusher
 */
async function sendErrorNotification(
  projectId: string,
  message: string,
  type: ErrorNotification['type'],
  source: ErrorNotification['source']
): Promise<void> {
  // Skip if message contains sensitive information
  if (containsSensitiveInfo(message)) {
    console.log('[Error Manager] Skipping notification with sensitive info')
    return
  }

  const channelName = getErrorChannelName(projectId)
  const eventName = getErrorEventName()

  console.log(`[Error Manager] Sending error notification to channel: ${channelName}`)
  console.log(`[Error Manager] Error preview: ${message.substring(0, 150)}...`)

  try {
    const pusherServer = getPusherServer()
    await pusherServer.trigger(channelName, eventName, {
      message,
      timestamp: new Date().toISOString(),
      projectId,
      type,
      source,
    } satisfies ErrorNotification)

    console.log(`[Error Manager] Error notification sent successfully to channel: ${channelName}`)
  } catch (error) {
    console.error('[Error Manager] Failed to send error notification:', error)
  }
}

/**
 * Buffer and send error with delay to accumulate multi-line errors
 */
function bufferAndSendError(
  projectId: string,
  logData: string,
  type: ErrorNotification['type'],
  source: ErrorNotification['source'],
  bufferDelayMs: number = 500
): void {
  // Get or create error buffer for this project
  let bufferData = errorBuffers.get(projectId)
  if (!bufferData) {
    bufferData = { buffer: '', timeout: null }
    errorBuffers.set(projectId, bufferData)
  }

  // Clear existing timeout if any
  if (bufferData.timeout) {
    clearTimeout(bufferData.timeout)
  }

  // Append to buffer (accumulate multi-line errors)
  bufferData.buffer += logData + '\n'

  // Set timeout to send accumulated error after delay of no new error lines
  bufferData.timeout = setTimeout(() => {
    const cleanError = cleanAnsiCodes(bufferData!.buffer)

    if (cleanError.length > 0) {
      sendErrorNotification(projectId, cleanError, type, source)
    }

    // Clear buffer after sending
    bufferData!.buffer = ''
    bufferData!.timeout = null
  }, bufferDelayMs)
}

/**
 * Detects React/Expo runtime errors in server logs and sends notifications
 */
export function detectAndNotifyRuntimeError(
  logData: string,
  projectId?: string
): void {
  if (!projectId) {
    console.log(
      '[Error Manager] detectAndNotifyRuntimeError called WITHOUT projectId, skipping'
    )
    return
  }

  // Check if this log line contains an error pattern
  const hasError = EXPO_ERROR_PATTERNS.some((pattern) => pattern.test(logData))

  if (hasError) {
    console.log('[Error Manager] Runtime error detected in Expo server logs')
    console.log('[Error Manager] ProjectId:', projectId)
    console.log('[Error Manager] Error preview:', logData.substring(0, 200))

    bufferAndSendError(projectId, logData, 'runtime-error', 'expo-server')
  }
}

/**
 * Detects Convex errors and sends notifications
 */
export function detectAndNotifyConvexError(
  logData: string,
  projectId?: string
): void {
  if (!projectId) return

  // Skip common non-error messages
  const isSuccessMessage = CONVEX_SUCCESS_PATTERNS.some((pattern) =>
    pattern.test(logData)
  )
  if (isSuccessMessage) {
    return
  }

  // Check if this log line contains an error pattern
  const hasError = CONVEX_ERROR_PATTERNS.some((pattern) => pattern.test(logData))

  if (hasError) {
    console.log('[Error Manager] Convex error detected:', logData.substring(0, 200))

    bufferAndSendError(projectId, logData, 'convex-error', 'convex-dev')
  }
}

/**
 * Send a custom error notification
 */
export async function sendCustomErrorNotification(
  projectId: string,
  message: string,
  type: ErrorNotification['type'] = 'custom',
  source: ErrorNotification['source'] = 'custom'
): Promise<void> {
  await sendErrorNotification(projectId, message, type, source)
}

/**
 * Clear error buffer for a project
 */
export function clearErrorBuffer(projectId: string): void {
  const bufferData = errorBuffers.get(projectId)
  if (bufferData) {
    if (bufferData.timeout) {
      clearTimeout(bufferData.timeout)
    }
    errorBuffers.delete(projectId)
  }
}
