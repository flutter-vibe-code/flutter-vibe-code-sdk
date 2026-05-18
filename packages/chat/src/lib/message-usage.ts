/**
 * Message usage tracking
 * 
 * Usage is now tracked via getUserSubscriptionStatus() which returns
 * messagesUsed from the prompt_messages table.
 * 
 * For message limit checks, use the subscription status from:
 *   import { getUserSubscriptionStatus } from '@flutter-vibe-code/payments/server'
 * 
 * Example:
 *   const status = await getUserSubscriptionStatus(userId)
 *   const canSend = status.messagesUsed < status.messageLimit
 */

export { getUserSubscriptionStatus } from '@flutter-vibe-code/payments/server'
