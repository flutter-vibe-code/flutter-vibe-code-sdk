/**
 * Chat configuration settings
 *
 * These settings control chat behavior and message loading
 */

/**
 * Maximum number of messages to load from chat history
 *
 * This limits the number of messages fetched on initial load and page refresh
 * to improve performance with large chat histories.
 *
 * Lower values = faster load times, less memory usage
 * Higher values = more context available, but slower performance
 *
 * Default: 10 messages
 *
 * Set via environment variable: CHAT_HISTORY_LIMIT
 */
export const CHAT_HISTORY_LIMIT = parseInt(
  process.env.CHAT_HISTORY_LIMIT || '10',
  10
)

// Validate the configuration
if (isNaN(CHAT_HISTORY_LIMIT) || CHAT_HISTORY_LIMIT < 1) {
  console.warn(
    `Invalid CHAT_HISTORY_LIMIT: ${process.env.CHAT_HISTORY_LIMIT}. Using default value of 10.`
  )
}


/**
 * Client-side constant for chat history limit
 * This can be used in client components that need to know the limit
 */
export function getChatHistoryLimit(): number {
  return CHAT_HISTORY_LIMIT
}
