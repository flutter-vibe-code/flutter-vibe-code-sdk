/**
 * Catalog of Anthropic-compatible providers for the Claude Agent SDK.
 *
 * The SDK reads these env vars (verified by inspecting cli.js):
 *   - ANTHROPIC_API_KEY
 *   - ANTHROPIC_AUTH_TOKEN
 *   - ANTHROPIC_BASE_URL
 *   - ANTHROPIC_MODEL
 *   - ANTHROPIC_DEFAULT_OPUS_MODEL
 *   - ANTHROPIC_DEFAULT_SONNET_MODEL
 *   - ANTHROPIC_DEFAULT_HAIKU_MODEL
 *   - CLAUDE_CODE_SUBAGENT_MODEL
 *   - CLAUDE_CODE_EFFORT_LEVEL  ("min" | "low" | "medium" | "high" | "max")
 *
 * Supported Anthropic-compat endpoints (verified against each provider's docs as of April 2026):
 *   - anthropic    native, no override
 *   - deepseek     https://api.deepseek.com/anthropic
 *   - minimax      https://api.minimax.io/anthropic
 *   - moonshot     https://api.moonshot.ai/anthropic   (Kimi)
 *   - openrouter   https://openrouter.ai/api           (NB: ANTHROPIC_API_KEY must be "")
 */

export type ProviderId = 'anthropic' | 'deepseek' | 'minimax' | 'moonshot' | 'openrouter'

export type EffortLevel = 'min' | 'low' | 'medium' | 'high' | 'max'

export interface ModelCapabilities {
  /** Supports a thinking / reasoning mode (extended chain-of-thought). */
  thinking?: boolean
  /** Accepts images / vision. */
  multimodal?: boolean
  /** Coding-focused / strong on code. */
  coding?: boolean
  /** Optimised for throughput (>=60 tok/s). */
  highSpeed?: boolean
  /** Supports native tool use / function calling. */
  toolUse?: boolean
}

export interface ProviderModel {
  id: string
  name: string
  description?: string
  isDefault?: boolean
  /** Context window in tokens. */
  contextTokens?: number
  /** Max output in tokens. */
  maxOutputTokens?: number
  capabilities?: ModelCapabilities
}

export interface AnthropicCompatProvider {
  id: ProviderId
  name: string
  /** Override for ANTHROPIC_BASE_URL. Undefined = use SDK default (api.anthropic.com). */
  baseURL?: string
  /** Name of the env var on the Next process that holds the server-side fallback key. */
  apiKeyEnv: string
  /** Send the key in ANTHROPIC_AUTH_TOKEN. */
  requiresAuthToken: boolean
  /**
   * If true, ANTHROPIC_API_KEY is forced to "" — required by OpenRouter so the
   * SDK doesn't fall back to api.anthropic.com when the key looks valid.
   */
  emptyApiKey?: boolean
  /** ANTHROPIC_MODEL — primary model the SDK uses. */
  primaryModel?: string
  opusModel?: string
  sonnetModel?: string
  haikuModel?: string
  subagentModel?: string
  effortLevel?: EffortLevel
  /** Effort levels the provider claims to support. Used by the UI to expose a slider. */
  effortLevels?: EffortLevel[]
  /** Documentation link shown in the UI. */
  docsUrl?: string
  models: ProviderModel[]
  defaultModel: string
}

const COMMON_EFFORTS: EffortLevel[] = ['min', 'low', 'medium', 'high', 'max']

export const PROVIDERS: Record<ProviderId, AnthropicCompatProvider> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    requiresAuthToken: false,
    effortLevels: COMMON_EFFORTS,
    docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    models: [
      // Latest + previous only.
      { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', description: 'Current flagship — best reasoning + agentic coding', contextTokens: 200_000, maxOutputTokens: 64_000, isDefault: true, capabilities: { thinking: true, multimodal: true, coding: true, toolUse: true } },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', description: 'Previous flagship — balanced for general coding', contextTokens: 200_000, maxOutputTokens: 64_000, capabilities: { thinking: true, multimodal: true, coding: true, toolUse: true } },
    ],
    defaultModel: 'claude-opus-4-7',
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/anthropic',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    requiresAuthToken: true,
    primaryModel: 'deepseek-v4-pro',
    opusModel: 'deepseek-v4-pro',
    sonnetModel: 'deepseek-v4-pro',
    haikuModel: 'deepseek-v4-flash',
    subagentModel: 'deepseek-v4-flash',
    effortLevel: 'max',
    effortLevels: COMMON_EFFORTS,
    docsUrl: 'https://api-docs.deepseek.com/',
    models: [
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', description: 'Advanced reasoning + coding flagship (1M ctx)', contextTokens: 1_000_000, maxOutputTokens: 384_000, isDefault: true, capabilities: { thinking: true, coding: true, toolUse: true } },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', description: 'Cheaper/faster — used for subagents (1M ctx)', contextTokens: 1_000_000, maxOutputTokens: 384_000, capabilities: { thinking: true, coding: true, toolUse: true, highSpeed: true } },
    ],
    defaultModel: 'deepseek-v4-pro',
  },

  minimax: {
    id: 'minimax',
    name: 'MiniMax',
    baseURL: 'https://api.minimax.io/anthropic',
    apiKeyEnv: 'MINIMAX_API_KEY',
    requiresAuthToken: true,
    primaryModel: 'MiniMax-M2.7',
    opusModel: 'MiniMax-M2.7',
    sonnetModel: 'MiniMax-M2.7',
    haikuModel: 'MiniMax-M2.5',
    subagentModel: 'MiniMax-M2.5',
    effortLevel: 'max',
    effortLevels: COMMON_EFFORTS,
    docsUrl: 'https://platform.minimax.io/docs/api-reference/text-anthropic-api',
    models: [
      { id: 'MiniMax-M2.7', name: 'MiniMax M2.7', description: 'Current flagship — recursive self-improvement', contextTokens: 204_800, isDefault: true, capabilities: { thinking: true, coding: true, toolUse: true } },
      { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', description: 'Previous flagship — peak performance / value', contextTokens: 204_800, capabilities: { thinking: true, coding: true, toolUse: true } },
    ],
    defaultModel: 'MiniMax-M2.7',
  },

  moonshot: {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseURL: 'https://api.moonshot.ai/anthropic',
    apiKeyEnv: 'MOONSHOT_API_KEY',
    requiresAuthToken: true,
    primaryModel: 'kimi-k2.6',
    opusModel: 'kimi-k2.6',
    sonnetModel: 'kimi-k2.6',
    haikuModel: 'kimi-k2.5',
    subagentModel: 'kimi-k2.5',
    effortLevel: 'max',
    effortLevels: COMMON_EFFORTS,
    docsUrl: 'https://platform.kimi.ai/docs/',
    models: [
      { id: 'kimi-k2.6', name: 'Kimi K2.6', description: 'Current flagship — multimodal, agentic, coding (256K)', contextTokens: 262_144, isDefault: true, capabilities: { thinking: true, multimodal: true, coding: true, toolUse: true } },
      { id: 'kimi-k2.5', name: 'Kimi K2.5', description: 'Previous flagship — multimodal, thinking, agent (256K)', contextTokens: 262_144, capabilities: { thinking: true, multimodal: true, coding: true, toolUse: true } },
    ],
    defaultModel: 'kimi-k2.6',
  },

  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    requiresAuthToken: true,
    /**
     * OpenRouter REQUIRES ANTHROPIC_API_KEY to be empty so the SDK doesn't try
     * to authenticate against api.anthropic.com. The real key goes only into
     * ANTHROPIC_AUTH_TOKEN. See:
     * https://openrouter.ai/docs/guides/coding-agents/claude-code-integration
     */
    emptyApiKey: true,
    primaryModel: 'anthropic/claude-opus-4.7',
    opusModel: 'anthropic/claude-opus-4.7',
    sonnetModel: 'anthropic/claude-sonnet-4.6',
    haikuModel: 'anthropic/claude-sonnet-4.6',
    subagentModel: 'anthropic/claude-sonnet-4.6',
    effortLevel: 'max',
    effortLevels: COMMON_EFFORTS,
    docsUrl: 'https://openrouter.ai/docs/guides/coding-agents/claude-code-integration',
    models: [
      { id: 'anthropic/claude-opus-4.7', name: 'Claude Opus 4.7 (via OpenRouter)', description: 'Current flagship via OpenRouter', contextTokens: 200_000, isDefault: true, capabilities: { thinking: true, multimodal: true, coding: true, toolUse: true } },
      { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6 (via OpenRouter)', description: 'Previous flagship via OpenRouter', contextTokens: 200_000, capabilities: { thinking: true, multimodal: true, coding: true, toolUse: true } },
    ],
    defaultModel: 'anthropic/claude-opus-4.7',
  },
}

export const PROVIDER_LIST: AnthropicCompatProvider[] = Object.values(PROVIDERS)

/**
 * Resolve a provider id (or legacy agentType alias) to its catalog entry.
 * Falls back to anthropic when unknown.
 *
 * Backwards compat: agentType 'kimi-k2' is silently mapped to provider 'moonshot'.
 */
export function resolveProvider(id?: string | null): AnthropicCompatProvider {
  if (!id) return PROVIDERS.anthropic
  if (id === 'kimi-k2') return PROVIDERS.moonshot
  if (id in PROVIDERS) return PROVIDERS[id as ProviderId]
  return PROVIDERS.anthropic
}

/**
 * Build the Anthropic env-var bag the Claude Agent SDK expects for the given provider.
 * Honours per-model overrides when modelId is supplied.
 */
export function buildProviderEnv(
  provider: AnthropicCompatProvider,
  apiKey: string,
  modelId?: string,
  effort?: EffortLevel,
): Record<string, string> {
  // OpenRouter requires ANTHROPIC_API_KEY="" so the SDK doesn't auth at api.anthropic.com.
  const env: Record<string, string> = {
    ANTHROPIC_API_KEY: provider.emptyApiKey ? '' : apiKey,
  }
  if (provider.requiresAuthToken) env.ANTHROPIC_AUTH_TOKEN = apiKey
  if (provider.baseURL) env.ANTHROPIC_BASE_URL = provider.baseURL

  // Per-request model override beats provider default.
  const primary = modelId || provider.primaryModel
  if (primary) env.ANTHROPIC_MODEL = primary
  if (provider.opusModel) env.ANTHROPIC_DEFAULT_OPUS_MODEL = provider.opusModel
  if (provider.sonnetModel) env.ANTHROPIC_DEFAULT_SONNET_MODEL = provider.sonnetModel
  if (provider.haikuModel) env.ANTHROPIC_DEFAULT_HAIKU_MODEL = provider.haikuModel
  if (provider.subagentModel) env.CLAUDE_CODE_SUBAGENT_MODEL = provider.subagentModel

  const effortToUse = effort || provider.effortLevel
  if (effortToUse) env.CLAUDE_CODE_EFFORT_LEVEL = effortToUse

  return env
}

/**
 * Render env vars as a `.env`-style file (one KEY=VALUE per line).
 * Empty values are emitted as `KEY=` so OpenRouter's required empty
 * ANTHROPIC_API_KEY survives the loadEnvFile reader in the sandbox.
 */
export function renderProviderEnvFile(envs: Record<string, string>): string {
  const lines: string[] = []
  for (const [k, v] of Object.entries(envs)) {
    if (/[\n\r]/.test(v)) throw new Error(`Provider env value for ${k} contains a newline`)
    lines.push(`${k}=${v}`)
  }
  return lines.join('\n') + '\n'
}

/**
 * Resolve the API key to use for the request, in order of preference:
 *   1. BYOK key explicitly provided in the request (per-provider record).
 *   2. Legacy single-field BYOK (anthropicKey / moonshotKey).
 *   3. Server-side env var configured for the provider.
 */
export function resolveProviderApiKey(
  provider: AnthropicCompatProvider,
  opts: {
    byokKeys?: Record<string, string>
    anthropicKey?: string
    moonshotKey?: string
  },
): string {
  const byok = opts.byokKeys?.[provider.id]
  if (byok) return byok
  if (provider.id === 'anthropic' && opts.anthropicKey) return opts.anthropicKey
  if (provider.id === 'moonshot' && opts.moonshotKey) return opts.moonshotKey
  return globalThis.process?.env?.[provider.apiKeyEnv] || ''
}

/**
 * Lookup a single model in the catalog (across all providers).
 * Returns the matching {provider, model} or null when not found.
 */
export function findModel(modelId: string): { provider: AnthropicCompatProvider; model: ProviderModel } | null {
  for (const provider of PROVIDER_LIST) {
    const model = provider.models.find((m) => m.id === modelId)
    if (model) return { provider, model }
  }
  return null
}
