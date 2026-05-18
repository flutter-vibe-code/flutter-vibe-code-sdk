/**
 * Skill Templates Module
 *
 * This module maps skill IDs to their template functions.
 * It includes validation to ensure templates stay in sync with skill definitions.
 */

import { anthropicChatSkillTemplate } from './anthropic-chat'
import { openaiO3SkillTemplate } from './openai-o3'
import { openaiDalle3SkillTemplate } from './openai-dalle-3'
import { googleSearchSkillTemplate } from './google-search'
import { openaiWhisperSkillTemplate } from './openai-whisper'
import { exaPeopleSearchTemplate } from './exa-people-search'
import { SKILL_CONFIGS, isValidSkillId, getSkillConfig } from '../config'

export const skillTemplates: Record<string, (prodUrl: string, displayName: string, description: string) => string> = {
  'anthropic-chat': anthropicChatSkillTemplate,
  'openai-o3': openaiO3SkillTemplate,
  'openai-dalle-3': openaiDalle3SkillTemplate,
  'google-search': googleSearchSkillTemplate,
  'openai-whisper': openaiWhisperSkillTemplate,
  'exa-people-search': exaPeopleSearchTemplate,
}

// Validate that all templates have corresponding skill definitions
if (process.env.NODE_ENV === 'development') {
  const templateIds = Object.keys(skillTemplates)
  const skillIds = SKILL_CONFIGS.map(s => s.id)

  // Check for templates without skill definitions
  const templatesWithoutSkills = templateIds.filter(id => !isValidSkillId(id))
  if (templatesWithoutSkills.length > 0) {
    console.warn(
      '[Skills] Warning: The following templates do not have corresponding skill definitions:',
      templatesWithoutSkills,
      '\nAdd them to config.ts'
    )
  }

  // Check for skills without templates
  const skillsWithoutTemplates = skillIds.filter(id => !templateIds.includes(id))
  if (skillsWithoutTemplates.length > 0) {
    console.warn(
      '[Skills] Warning: The following skills do not have corresponding templates:',
      skillsWithoutTemplates,
      '\nCreate template files in templates/'
    )
  }

  if (templatesWithoutSkills.length === 0 && skillsWithoutTemplates.length === 0) {
    console.log('[Skills] ✓ All skills and templates are in sync')
  }
}

export function getSkillTemplate(skillId: string, prodUrl: string): string | null {
  const templateFn = skillTemplates[skillId]
  if (!templateFn) {
    console.warn(`[Skills] Template not found for skill ID: ${skillId}`)
    return null
  }

  // Get the display name and description from config to ensure consistency
  const skillConfig = getSkillConfig(skillId)
  const displayName = skillConfig?.name || skillId
  const description = skillConfig?.description || ''

  return templateFn(prodUrl, displayName, description)
}

export function getSkillFilePath(skillId: string): string {
  return `.claude/skills/${skillId}/SKILL.md`
}
