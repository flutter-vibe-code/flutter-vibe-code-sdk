/**
 * Skills Module
 *
 * This module exports skills from the shared configuration.
 * All skill definitions come from ./config.ts to ensure
 * frontend and backend stay in sync.
 */

import {
  SKILL_CONFIGS,
  getSkillConfig,
  getSkillConfigs,
  isValidSkillId,
  validateSkillIds,
  type SkillConfig
} from './config'

// Re-export the type with the legacy name for backwards compatibility
export type AISkill = SkillConfig

// Export all skills from the shared configuration
export const AI_SKILLS: AISkill[] = SKILL_CONFIGS

// Re-export utility functions
export function getSkillById(id: string): AISkill | undefined {
  return getSkillConfig(id)
}

export function getSkillsByIds(ids: string[]): AISkill[] {
  return getSkillConfigs(ids)
}

// Export validation utilities
export { isValidSkillId, validateSkillIds }

// Export skill templates
export { skillTemplates, getSkillTemplate, getSkillFilePath } from './templates'

// Re-export config types and functions
export {
  SKILL_CONFIGS,
  SKILL_ID_MAP,
  getSkillConfig,
  getSkillConfigs,
  type SkillConfig,
} from './config'
