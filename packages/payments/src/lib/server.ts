/**
 * Server-side exports for @flutter-vibe-code/payments
 * Import from '@flutter-vibe-code/payments/server'
 */

// Stripe client
export { 
  getStripeClient, 
  createCheckoutSession, 
  createPortalSession, 
  getOrCreateCustomer,
  getActiveSubscription,
} from './stripe-client'

// Webhook handling
export { 
  constructWebhookEvent, 
  handleWebhookEvent,
  getPlanFromPriceId,
} from './stripe-webhook-handler'

// Subscription management
export { 
  getUserSubscriptionStatus, 
  ensureUserSubscription, 
  updateSubscription, 
  cancelSubscription,
  getUserMessageUsage,
  canUserSendMessage,
  incrementMessageUsage,
  getUserUsageHistory,
  getUserUsageMetrics,
} from './subscription'

// Usage tracking
export { UsageTracker } from './usage-tracker'

// Config
export { 
  PAYMENTS_CONFIG, 
  PLANS, 
  getMessageLimitForPlan, 
  getNextResetDate, 
  getCurrentMonth 
} from './config'
