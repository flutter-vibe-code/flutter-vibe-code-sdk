// Types for the Privacy Policy Generator

export interface QuestionField {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'boolean'
  required?: boolean
}

export interface SubQuestion {
  key: string
  text: string
  type: 'boolean' | 'multi_select'
  options?: string[]
}

export interface Question {
  id: string
  text: string
  type: 'object' | 'boolean' | 'boolean_with_details' | 'multi_select' | 'multi_select_with_subquestions' | 'textarea' | 'list_of_objects' | 'same_as_above'
  fields?: QuestionField[]
  options?: string[] | { yes: string; no: string }
  subquestions_per_category?: SubQuestion[]
  details_if_yes?: string
  next?: string
}

export interface PolicyAnswers {
  // App info
  app_name?: string
  company_name?: string
  contact_email?: string
  privacy_policy_url?: string
  website?: string
  app_description?: string

  // Data collection
  collect_data?: boolean
  no_data_confirmation?: boolean
  data_categories?: string[]
  data_category_details?: Record<string, {
    linked_to_identity?: boolean
    used_for_tracking?: boolean
    purposes?: string[]
  }>

  // AI sharing
  ai_sharing?: boolean
  ai_sharing_details?: string

  // Tracking
  tracking?: boolean

  // Third parties
  third_parties?: Array<{
    name: string
    purpose: string
    data_shared: string
    policy_link: string
    ai_related?: boolean
  }>

  // Retention
  retention?: string

  // Security
  security?: string

  // Children
  children?: boolean
  children_details?: string

  // Regions
  regions?: string[]

  // International transfers
  international_transfers?: boolean
  international_transfers_details?: string

  // Changes notification
  changes?: string
}

export interface NutritionLabel {
  dataUsedToTrackYou: Array<{
    type: string
    purposes: string[]
  }>
  dataLinkedToYou: Array<{
    type: string
    purposes: string[]
  }>
  dataNotLinkedToYou: Array<{
    type: string
    purposes: string[]
  }>
}

export type QuestionId =
  | 'q_app_info'
  | 'q_collect_data'
  | 'q_no_data_confirmation'
  | 'q_data_categories'
  | 'q_ai_sharing'
  | 'q_tracking'
  | 'q_third_parties'
  | 'q_third_parties_minimal'
  | 'q_retention'
  | 'q_security'
  | 'q_children'
  | 'q_regions'
  | 'q_international_transfers'
  | 'q_changes'
