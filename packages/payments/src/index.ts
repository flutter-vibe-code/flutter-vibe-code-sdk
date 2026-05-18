/**
 * @flutter-vibe-code/payments - Stripe payment integration for Flutter Vibe Code
 *
 * This package provides all the functionality needed for subscription management,
 * usage tracking, and payment processing with Stripe.
 *
 * Usage:
 *
 * Server-side (API routes, server components):
 * ```ts
 * import { getUserSubscriptionStatus, canUserSendMessage } from '@flutter-vibe-code/payments/server'
 * ```
 *
 * Client-side (React components):
 * ```ts
 * import { createStripeUtils } from '@flutter-vibe-code/payments/client'
 * ```
 *
 * Components:
 * ```ts
 * import { SubscriptionModal, RateLimitCard } from '@flutter-vibe-code/payments/components'
 * ```
 *
 * Hooks:
 * ```ts
 * import { useSubscriptionStatusBase } from '@flutter-vibe-code/payments/hooks'
 * ```
 *
 * Config:
 * ```ts
 * import { PAYMENTS_CONFIG, PLANS } from '@flutter-vibe-code/payments/config'
 * ```
 */

// Re-export types
export type {
  UsageEvent,
  Plan,
  PlanName,
  SubscriptionStatus,
  MessageUsage,
  CanSendMessageResult,
  IncrementUsageResult,
  UsageMetrics,
  RateLimitInfo,
} from './types'

// Re-export config
export { PAYMENTS_CONFIG, PLANS, getMessageLimitForPlan, getNextResetDate, getCurrentMonth } from './lib/config'
