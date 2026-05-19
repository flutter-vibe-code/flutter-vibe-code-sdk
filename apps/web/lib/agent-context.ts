import { db } from '@/lib/db'
import { projects } from '@flutter-vibe-code/database'
import { eq } from 'drizzle-orm'

export interface AgentContextEntry {
  timestamp: string
  userMessage: string
  summary: string
  filesModified: string[]
  toolCalls: Array<{
    tool: string
    filePath?: string
    commandPreview?: string
    success: boolean
  }>
}

export interface AgentContext {
  version: number
  entries: AgentContextEntry[]
  lastUpdated: string
}

const MAX_ENTRIES = 20 // Keep last 20 turns to avoid excessive context

/**
 * Save agent context to the database for cross-sandbox resumption.
 * Appends a new entry to the existing context.
 */
export async function saveAgentContext(
  projectId: string,
  entry: Omit<AgentContextEntry, 'timestamp'>,
): Promise<void> {
  try {
    // Fetch existing context
    const [project] = await db
      .select({ agentContext: projects.agentContext })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    const existing: AgentContext = (project?.agentContext as AgentContext) || {
      version: 1,
      entries: [],
      lastUpdated: new Date().toISOString(),
    }

    const newEntry: AgentContextEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    // Append and trim
    const updatedEntries = [...existing.entries, newEntry].slice(-MAX_ENTRIES)

    const updatedContext: AgentContext = {
      version: existing.version,
      entries: updatedEntries,
      lastUpdated: new Date().toISOString(),
    }

    await db
      .update(projects)
      .set({
        agentContext: updatedContext,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    console.log(`[AgentContext] Saved context for project ${projectId}, ${updatedEntries.length} entries`)
  } catch (error) {
    console.error(`[AgentContext] Failed to save context for project ${projectId}:`, error)
    // Non-fatal — don't fail the agent if DB save fails
  }
}

/**
 * Load agent context from the database.
 * Returns null if no context exists.
 */
export async function getAgentContext(projectId: string): Promise<AgentContext | null> {
  try {
    const [project] = await db
      .select({ agentContext: projects.agentContext })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1)

    if (!project?.agentContext) {
      return null
    }

    return project.agentContext as AgentContext
  } catch (error) {
    console.error(`[AgentContext] Failed to load context for project ${projectId}:`, error)
    return null
  }
}

/**
 * Format agent context as a string for injection into the system prompt.
 */
export function formatAgentContext(context: AgentContext | null): string {
  if (!context || context.entries.length === 0) {
    return ''
  }

  const lines: string[] = [
    '\n\n--- PREVIOUS WORK CONTEXT ---',
    `You have previously worked on this project (${context.entries.length} turn${context.entries.length > 1 ? 's' : ''}). Here is the context:`,
  ]

  for (const entry of context.entries) {
    lines.push(`\n[${new Date(entry.timestamp).toLocaleString()}] User: "${entry.userMessage.substring(0, 120)}${entry.userMessage.length > 120 ? '...' : ''}"`)
    lines.push(`Summary: ${entry.summary}`)
    if (entry.filesModified && entry.filesModified.length > 0) {
      lines.push(`Files modified: ${entry.filesModified.join(', ')}`)
    }
    if (entry.toolCalls && entry.toolCalls.length > 0) {
      const successful = entry.toolCalls.filter(t => t.success)
      lines.push(`Tools used: ${successful.length} successful`)
    }
  }

  lines.push('\n--- END PREVIOUS CONTEXT ---')

  return lines.join('\n')
}

/**
 * Clear agent context (useful when user explicitly wants a fresh start).
 */
export async function clearAgentContext(projectId: string): Promise<void> {
  try {
    await db
      .update(projects)
      .set({
        agentContext: null,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))

    console.log(`[AgentContext] Cleared context for project ${projectId}`)
  } catch (error) {
    console.error(`[AgentContext] Failed to clear context for project ${projectId}:`, error)
  }
}
