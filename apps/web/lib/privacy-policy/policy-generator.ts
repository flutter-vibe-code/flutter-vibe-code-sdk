// Privacy Policy Generator
// Generates markdown policy from questionnaire answers

import { PolicyAnswers, NutritionLabel } from './types'

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function generatePolicy(answers: PolicyAnswers): string {
  const sections: string[] = []

  // Header
  sections.push(`# Privacy Policy for ${answers.app_name || 'Your App'}`)
  sections.push(`**Effective Date:** ${formatDate()}`)
  sections.push('')

  // Introduction
  sections.push('## Introduction')
  sections.push(
    `This Privacy Policy describes how ${answers.company_name || 'we'} ("we", "us", or "our") collects, uses, discloses, and protects your information when you use our mobile application ${answers.app_name ? `"${answers.app_name}"` : ''} (the "App").`
  )
  if (answers.app_description) {
    sections.push('')
    sections.push(`**About the App:** ${answers.app_description}`)
  }
  sections.push('')

  // No Data Collection Case
  if (answers.collect_data === false && answers.no_data_confirmation === true) {
    sections.push('## Data Collection')
    sections.push(
      'We do not collect, use, share, or track any personal or usage data through this App. The App operates entirely on your device without transmitting any information to external servers.'
    )
    sections.push('')
  } else {
    // Data Collection
    if (answers.data_categories && answers.data_categories.length > 0) {
      sections.push('## Information We Collect')
      sections.push(
        'We and/or third-party services integrated into the App may collect the following types of data:'
      )
      sections.push('')

      for (const category of answers.data_categories) {
        const details = answers.data_category_details?.[category]
        let categoryLine = `- **${category}**`

        if (details) {
          const notes: string[] = []
          if (details.linked_to_identity) {
            notes.push('linked to your identity')
          }
          if (details.used_for_tracking) {
            notes.push('used for tracking')
          }
          if (details.purposes && details.purposes.length > 0) {
            notes.push(`used for: ${details.purposes.join(', ')}`)
          }
          if (notes.length > 0) {
            categoryLine += ` (${notes.join('; ')})`
          }
        }
        sections.push(categoryLine)
      }
      sections.push('')
    }

    // How We Use Data
    sections.push('## How We Use Your Information')
    sections.push('We may use the collected information for the following purposes:')
    sections.push('')
    sections.push('- To provide and maintain the App functionality')
    sections.push('- To improve and personalize your experience')
    sections.push('- To analyze usage patterns and optimize performance')
    sections.push('- To communicate with you about updates or support')
    if (answers.tracking) {
      sections.push('- For advertising and marketing purposes')
    }
    sections.push('')

    // Tracking
    if (answers.tracking !== undefined) {
      sections.push('## Tracking')
      if (answers.tracking) {
        sections.push(
          'This App engages in tracking as defined by Apple. We may combine data collected from this App with data from other companies\' apps or websites for targeted advertising or to share with data brokers.'
        )
      } else {
        sections.push(
          'This App does not track you across other companies\' apps or websites for advertising purposes.'
        )
      }
      sections.push('')
    }
  }

  // AI Data Sharing
  if (answers.ai_sharing) {
    sections.push('## Third-Party AI Services')
    sections.push(
      'This App shares certain data with third-party artificial intelligence services for processing. We obtain explicit user consent before sharing any personal data with these AI services.'
    )
    if (answers.ai_sharing_details) {
      sections.push('')
      sections.push(`**Details:** ${answers.ai_sharing_details}`)
    }
    sections.push('')
  }

  // Third Parties
  if (answers.third_parties && answers.third_parties.length > 0) {
    sections.push('## Third-Party Services')
    sections.push(
      'We use the following third-party services that may collect information from you:'
    )
    sections.push('')

    for (const tp of answers.third_parties) {
      sections.push(`### ${tp.name}`)
      if (tp.purpose) sections.push(`- **Purpose:** ${tp.purpose}`)
      if (tp.data_shared) sections.push(`- **Data Shared:** ${tp.data_shared}`)
      if (tp.policy_link) sections.push(`- **Privacy Policy:** [${tp.name} Privacy Policy](${tp.policy_link})`)
      if (tp.ai_related) sections.push(`- *This service involves AI processing*`)
      sections.push('')
    }
  }

  // Data Retention
  if (answers.retention) {
    sections.push('## Data Retention')
    sections.push(answers.retention)
    sections.push('')
  }

  // Security
  if (answers.security) {
    sections.push('## Security')
    sections.push(answers.security)
    sections.push('')
  }

  // Children's Privacy
  sections.push("## Children's Privacy")
  if (answers.children) {
    sections.push(
      'This App is directed to or may collect data from children under 13. We comply with the Children\'s Online Privacy Protection Act (COPPA).'
    )
    if (answers.children_details) {
      sections.push('')
      sections.push(answers.children_details)
    }
  } else {
    sections.push(
      'This App is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.'
    )
  }
  sections.push('')

  // Regional Rights
  if (answers.regions && answers.regions.length > 0) {
    sections.push('## Your Privacy Rights')

    if (answers.regions.includes('EU/EEA/UK (GDPR)')) {
      sections.push('')
      sections.push('### For Users in the European Union, EEA, and UK (GDPR)')
      sections.push('Under the General Data Protection Regulation, you have the following rights:')
      sections.push('- **Right to Access:** Request a copy of your personal data')
      sections.push('- **Right to Rectification:** Request correction of inaccurate data')
      sections.push('- **Right to Erasure:** Request deletion of your personal data')
      sections.push('- **Right to Restrict Processing:** Request limitation of data processing')
      sections.push('- **Right to Data Portability:** Receive your data in a structured format')
      sections.push('- **Right to Object:** Object to processing based on legitimate interests')
      sections.push('- **Right to Withdraw Consent:** Withdraw consent at any time')
      sections.push('')
      sections.push('**Legal Bases for Processing:** We process your data based on consent, contract performance, legal obligations, or legitimate interests.')
    }

    if (answers.regions.includes('California (CCPA/CPRA)')) {
      sections.push('')
      sections.push('### For California Residents (CCPA/CPRA)')
      sections.push('Under the California Consumer Privacy Act and California Privacy Rights Act, you have the right to:')
      sections.push('- **Know** what personal information we collect and how it is used')
      sections.push('- **Delete** your personal information')
      sections.push('- **Opt-out** of the sale or sharing of your personal information')
      sections.push('- **Non-discrimination** for exercising your privacy rights')
      sections.push('- **Correct** inaccurate personal information')
      sections.push('- **Limit** use of sensitive personal information')
      sections.push('')
      sections.push('We do not sell your personal information as defined by the CCPA/CPRA.')
    }

    if (answers.regions.includes('Brazil (LGPD)')) {
      sections.push('')
      sections.push('### For Users in Brazil (LGPD)')
      sections.push('Under the Lei Geral de Proteao de Dados, you have rights to access, correct, delete, and port your personal data.')
    }

    if (answers.regions.includes('Canada (PIPEDA)')) {
      sections.push('')
      sections.push('### For Users in Canada (PIPEDA)')
      sections.push('Under the Personal Information Protection and Electronic Documents Act, you have the right to access and correct your personal information.')
    }

    sections.push('')
  }

  // International Transfers
  if (answers.international_transfers) {
    sections.push('## International Data Transfers')
    sections.push(
      'Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data.'
    )
    if (answers.international_transfers_details) {
      sections.push('')
      sections.push(answers.international_transfers_details)
    }
    sections.push('')
  }

  // Changes to Policy
  sections.push('## Changes to This Privacy Policy')
  sections.push(
    'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top.'
  )
  if (answers.changes) {
    sections.push('')
    sections.push(`**Notification Method:** ${answers.changes}`)
  }
  sections.push('')

  // Contact
  sections.push('## Contact Us')
  sections.push('If you have any questions about this Privacy Policy, please contact us:')
  sections.push('')
  if (answers.contact_email) {
    sections.push(`- **Email:** ${answers.contact_email}`)
  }
  if (answers.website) {
    sections.push(`- **Website:** ${answers.website}`)
  }
  if (answers.privacy_policy_url) {
    sections.push(`- **Privacy Policy URL:** ${answers.privacy_policy_url}`)
  }
  sections.push('')

  return sections.join('\n')
}

export function generateNutritionLabel(answers: PolicyAnswers): NutritionLabel {
  const label: NutritionLabel = {
    dataUsedToTrackYou: [],
    dataLinkedToYou: [],
    dataNotLinkedToYou: [],
  }

  if (!answers.data_categories || answers.data_categories.length === 0) {
    return label
  }

  for (const category of answers.data_categories) {
    const details = answers.data_category_details?.[category]
    if (!details) continue

    const entry = {
      type: category,
      purposes: details.purposes || [],
    }

    if (details.used_for_tracking) {
      label.dataUsedToTrackYou.push(entry)
    } else if (details.linked_to_identity) {
      label.dataLinkedToYou.push(entry)
    } else {
      label.dataNotLinkedToYou.push(entry)
    }
  }

  return label
}
