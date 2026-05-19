import { useLocalStorage } from './use-local-storage'
import {
  DEFAULT_CLAUDE_MODEL,
  CLAUDE_MODEL_STORAGE_KEY,
} from '@/lib/claude-models'

/**
 * Hook to manage Claude model selection with localStorage persistence
 */
export function useClaudeModel() {
  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    CLAUDE_MODEL_STORAGE_KEY,
    DEFAULT_CLAUDE_MODEL
  )

  return {
    selectedModel,
    setSelectedModel,
  }
}
