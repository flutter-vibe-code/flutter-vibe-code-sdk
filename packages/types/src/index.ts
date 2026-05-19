// Template Types
export interface TemplateConfig {
  name: string
  lib: string[]
  file: string
  instructions: string
  port?: number
}

export type Templates = Record<string, TemplateConfig>

// Common project types
export type ProjectStatus = 'active' | 'paused' | 'completed'
export type SandboxStatus = 'active' | 'paused' | 'destroyed'
export type ServerStatus = 'running' | 'closed'

// Message types
export type MessageRole = 'user' | 'assistant' | 'system'

// Subscription plans
export type SubscriptionPlan = 'free' | 'start' | 'pro' | 'senior'

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// File types
export interface FileChange {
  path: string
  type: 'added' | 'modified' | 'deleted'
  content?: string
}

// Common utility types
export type Nullable<T> = T | null
export type Optional<T> = T | undefined
