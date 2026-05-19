/**
 * Polar payment integration types
 */

export interface UsageEvent {
  name: string
  externalCustomerId: string
  metadata: {
    [key: string]: any
  }
  timestamp?: Date
}

export interface Plan {
  name: string
  slug: string
  price: number
  originalPrice: number
  period: string
  features: string[]
  productId?: string
  popular?: boolean
  messageLimit: number
}

export type PlanName = 'free' | 'start' | 'pro' | 'senior'

export interface SubscriptionStatus {
  isSubscribed: boolean
  subscriptionId?: string
  planName?: string
  hasSubscription: boolean
  currentPlan: PlanName | string
  status: string
  messageLimit: number
  messagesUsed: number
  resetDate: string | null
  subscribedAt: string | null
  expiresAt: string | null
  customerId: string | null
}

export interface MessageUsage {
  messageLimit: number
  usageCount: number
  remainingMessages: number
  hasActiveSubscription: boolean
  currentPlan: string
  currentMonth: string
}

export interface CanSendMessageResult {
  canSend: boolean
  reason?: string
  usage: MessageUsage
}

export interface IncrementUsageResult {
  success: boolean
  newUsageCount: number
  remainingMessages: number
}

export interface UsageMetrics {
  tokensUsed: number
  projectsGenerated: number
  codeGenerations: number
}

export interface RateLimitInfo {
  reason: string
  usageCount: number
  messageLimit: number
}

// Webhook event types
export type PolarWebhookEventType =
  | 'checkout.created'
  | 'checkout.updated'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.active'
  | 'subscription.canceled'
  | 'subscription.revoked'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
