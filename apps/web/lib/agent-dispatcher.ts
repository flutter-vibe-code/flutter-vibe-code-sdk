import { handleClaudeCodeGeneration } from './claude-code-handler'
import type { ClaudeCodeHandlerRequest, ClaudeCodeStreamCallbacks } from './claude-code-handler'

export type AgentType = 'claude-code'

export interface AgentHandlerRequest extends ClaudeCodeHandlerRequest {
  agentType?: AgentType | string
}

/**
 * Single agent pipeline. Multi-provider routing is handled by the
 * Anthropic-compatible baseURL on each provider (anthropic / openrouter /
 * deepseek / moonshot / minimax) via lib/anthropic-providers.ts.
 *
 * Legacy agentType values ('opencode', 'kimi-k2') are accepted from older
 * clients but ignored — everything goes through Claude Agent SDK.
 */
export async function dispatchToAgent(
  request: AgentHandlerRequest,
  callbacks: ClaudeCodeStreamCallbacks,
): Promise<void> {
  console.log('[Agent Dispatcher] Routed via Claude Agent SDK · Anthropic-compat')
  return handleClaudeCodeGeneration(request, callbacks)
}
