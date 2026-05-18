// Privacy Policy Generator Questions
// Based on Apple App Privacy Details (nutrition label) requirements
// Updated December 2025

import { Question, QuestionId } from './types'

export const QUESTION_ORDER: QuestionId[] = [
  'q_app_info',
  'q_collect_data',
  'q_data_categories',
  'q_ai_sharing',
  'q_tracking',
  'q_third_parties',
  'q_retention',
  'q_security',
  'q_children',
  'q_regions',
  'q_international_transfers',
  'q_changes',
]

export const DATA_CATEGORIES = [
  'Name',
  'Email Address',
  'Phone Number',
  'Physical Address',
  'Other Contact Info',
  'Health',
  'Fitness',
  'Payment Info',
  'Credit Info',
  'Other Financial Info',
  'Precise Location',
  'Coarse Location',
  'Sensitive Info',
  'Contacts',
  'Photos or Videos',
  'Audio Data',
  'Gameplay Content',
  'Customer Support',
  'Other User Content',
  'Browsing History',
  'Search History',
  'User ID',
  'Device ID',
  'Purchase History',
  'Product Interaction',
  'Advertising Data',
  'Usage Data',
  'Crash Data',
  'Performance Data',
  'Other Diagnostic Data',
  'Emails or Text Messages',
  'Other Data',
] as const

export const DATA_PURPOSES = [
  'App Functionality',
  'Analytics',
  'Developer Advertising',
  'Third-Party Advertising',
  'Personalization',
  'Other',
] as const

export const REGIONS = [
  'EU/EEA/UK (GDPR)',
  'California (CCPA/CPRA)',
  'Other US States (e.g., Virginia, Colorado)',
  'Brazil (LGPD)',
  'Canada (PIPEDA)',
  'Global/Other',
] as const

export const questions: Record<QuestionId, Question> = {
  q_app_info: {
    id: 'q_app_info',
    text: 'Provide basic information about your app.',
    type: 'object',
    fields: [
      { key: 'app_name', label: 'App Name', type: 'text', required: true },
      { key: 'company_name', label: 'Company/Developer Name', type: 'text', required: true },
      { key: 'contact_email', label: 'Privacy Contact Email', type: 'text', required: true },
      { key: 'website', label: 'Company Website (optional)', type: 'text' },
      { key: 'app_description', label: 'Brief App Description', type: 'textarea' },
    ],
    next: 'q_collect_data',
  },

  q_collect_data: {
    id: 'q_collect_data',
    text: 'Does the app (or any integrated third-party SDKs) collect, use, or share any data from users? (Include analytics, ads, crash reporting, etc.)',
    type: 'boolean',
    options: { yes: 'q_data_categories', no: 'q_no_data_confirmation' },
  },

  q_no_data_confirmation: {
    id: 'q_no_data_confirmation',
    text: 'Confirm: No data is collected, used for tracking, or shared (even anonymized diagnostics if linked or tracked). Third-party SDKs collect nothing independently.',
    type: 'boolean',
    next: 'q_third_parties_minimal',
  },

  q_data_categories: {
    id: 'q_data_categories',
    text: 'Select all data types that may be collected (by you or third-parties). Based on Apple\'s current categories for nutrition labels.',
    type: 'multi_select_with_subquestions',
    options: [...DATA_CATEGORIES],
    subquestions_per_category: [
      { key: 'linked_to_identity', text: 'Is this data linked to the user\'s identity? (e.g., via account, device, or not de-identified/anonymized)', type: 'boolean' },
      { key: 'used_for_tracking', text: 'Is this data used for tracking across apps/websites?', type: 'boolean' },
      { key: 'purposes', text: 'Purposes for collection (select all):', type: 'multi_select', options: [...DATA_PURPOSES] },
    ],
    next: 'q_ai_sharing',
  },

  q_ai_sharing: {
    id: 'q_ai_sharing',
    text: 'Does the app share any personal data with third-party AI models/services (e.g., for processing with external LLMs)? (Per November 2025 guidelines: Requires explicit user consent and clear disclosure.)',
    type: 'boolean_with_details',
    details_if_yes: 'Describe the AI services, data shared, and how explicit consent is obtained.',
    next: 'q_tracking',
  },

  q_tracking: {
    id: 'q_tracking',
    text: 'Beyond selected categories, does the app engage in tracking as defined by Apple (combining data from this app with other apps/websites for targeted ads or data broker sharing)?',
    type: 'boolean',
    next: 'q_third_parties',
  },

  q_third_parties: {
    id: 'q_third_parties',
    text: 'List all third-party SDKs/services used (e.g., Firebase, AdMob, OpenAI). For each, specify purpose, data shared, and privacy policy link.',
    type: 'list_of_objects',
    fields: [
      { key: 'name', label: 'Service/SDK Name' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'data_shared', label: 'Data Types Shared' },
      { key: 'policy_link', label: 'Their Privacy Policy URL' },
      { key: 'ai_related', label: 'Involves third-party AI?', type: 'boolean' },
    ],
    next: 'q_retention',
  },

  q_third_parties_minimal: {
    id: 'q_third_parties_minimal',
    text: 'Even for no-data apps, list any third-party SDKs (some may collect independently).',
    type: 'list_of_objects',
    fields: [
      { key: 'name', label: 'Service/SDK Name' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'data_shared', label: 'Data Types Shared' },
      { key: 'policy_link', label: 'Their Privacy Policy URL' },
      { key: 'ai_related', label: 'Involves third-party AI?', type: 'boolean' },
    ],
    next: 'q_retention',
  },

  q_retention: {
    id: 'q_retention',
    text: 'Describe data retention policy (how long data is kept) and deletion process (how users can request deletion).',
    type: 'textarea',
    next: 'q_security',
  },

  q_security: {
    id: 'q_security',
    text: 'Describe security measures (e.g., encryption, access controls, breach response).',
    type: 'textarea',
    next: 'q_children',
  },

  q_children: {
    id: 'q_children',
    text: 'Is the app directed to children under 13 (or collects data from known children)? If yes, describe COPPA compliance and verifiable parental consent process.',
    type: 'boolean_with_details',
    next: 'q_regions',
  },

  q_regions: {
    id: 'q_regions',
    text: 'Select regions where users may reside (to include relevant legal sections):',
    type: 'multi_select',
    options: [...REGIONS],
    next: 'q_international_transfers',
  },

  q_international_transfers: {
    id: 'q_international_transfers',
    text: 'Does data transfer occur internationally? If yes, describe safeguards (e.g., Standard Contractual Clauses for GDPR).',
    type: 'boolean_with_details',
    next: 'q_changes',
  },

  q_changes: {
    id: 'q_changes',
    text: 'How will users be notified of policy changes? (e.g., in-app notification, email)',
    type: 'textarea',
    next: 'end',
  },
}

export function getNextQuestion(currentId: QuestionId, answers: Record<string, unknown>): QuestionId | 'end' {
  const question = questions[currentId]

  // Handle boolean questions with conditional navigation
  if (question.type === 'boolean' && typeof question.options === 'object' && 'yes' in question.options) {
    const answer = answers[currentId.replace('q_', '')]
    if (answer === true) {
      return question.options.yes as QuestionId
    } else if (answer === false) {
      return question.options.no as QuestionId
    }
  }

  // Handle special case for no_data_confirmation leading to minimal third parties
  if (currentId === 'q_no_data_confirmation') {
    return 'q_third_parties_minimal'
  }

  // Handle special case: skip data categories questions if no data collected
  if (currentId === 'q_collect_data' && answers.collect_data === false) {
    return 'q_third_parties_minimal'
  }

  // Default: use the next field or find in order
  if (question.next) {
    return question.next as QuestionId | 'end'
  }

  const currentIndex = QUESTION_ORDER.indexOf(currentId)
  if (currentIndex >= 0 && currentIndex < QUESTION_ORDER.length - 1) {
    return QUESTION_ORDER[currentIndex + 1]
  }

  return 'end'
}

export function getQuestionProgress(currentId: QuestionId): { current: number; total: number } {
  const currentIndex = QUESTION_ORDER.indexOf(currentId)
  return {
    current: currentIndex + 1,
    total: QUESTION_ORDER.length,
  }
}
