// Re-export everything from @flutter-vibe-code/database
export * from '@flutter-vibe-code/database'

// Import what we need for app-specific functions
import { db, projects, chat, message, eq, desc, and, lt } from '@flutter-vibe-code/database'
import { Message } from 'ai'
import crypto from 'node:crypto'

// Get or create chat for a project
export async function getOrCreateProjectChat(
  projectId: string,
  userId: string,
) {
  console.log('[getOrCreateProjectChat] Called with:', { projectId, userId })
  
  // First, try to get existing project with chat
  const project = await db
    .select({
      id: projects.id,
      chatId: projects.chatId,
      title: projects.title,
    })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  console.log('[getOrCreateProjectChat] Found project:', project.length > 0 ? project[0] : 'NO PROJECT FOUND')

  if (project.length === 0) {
    console.error('[getOrCreateProjectChat] Project not found!')
    throw new Error('Project not found')
  }

  const projectData = project[0]

  // If project already has a chat, return it
  if (projectData.chatId) {
    console.log('[getOrCreateProjectChat] Project already has chatId:', projectData.chatId)
    return projectData.chatId
  }

  console.log('[getOrCreateProjectChat] Creating new chat for project')
  // Create new chat for this project
  const newChat = await db
    .insert(chat)
    .values({
      title: projectData.title,
      userId: userId,
      createdAt: new Date(),
      visibility: 'private',
    })
    .returning({ id: chat.id })

  const chatId = newChat[0].id
  console.log('[getOrCreateProjectChat] Created new chat with ID:', chatId)

  // Update project with chatId
  await db.update(projects).set({ chatId }).where(eq(projects.id, projectId))
  console.log('[getOrCreateProjectChat] Updated project with chatId')

  return chatId
}

// Get chat messages for a project
export async function getProjectMessages(
  projectId: string,
  userId: string,
  limit: number = 30,
): Promise<Message[]> {
  try {
    console.log('Getting project messages for:', { projectId, userId, limit })
    const chatId = await getOrCreateProjectChat(projectId, userId)
    console.log('Got chatId:', chatId)

    // Get last N messages by ordering descending and applying limit
    const messages = await db
      .select({
        id: message.id,
        role: message.role,
        parts: message.parts,
        attachments: message.attachments,
        createdAt: message.createdAt,
      })
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(desc(message.createdAt))
      .limit(limit)

    console.log('Raw messages from DB:', messages.length)

    // Reverse to get chronological order (oldest to newest)
    messages.reverse()

    // Convert database messages to AI SDK format
    const formattedMessages = messages.map((msg) => {
      // Extract original ID from attachments if available
      const attachments = msg.attachments as any[]
      const originalIdAttachment = attachments?.find((a: any) => a.type === 'originalId')
      const originalId = originalIdAttachment?.id || msg.id

      // Filter out the originalId and imageAttachments from annotations
      const annotations = attachments?.filter((a: any) => a.type !== 'originalId' && a.type !== 'imageAttachments') || []

      // Extract image attachments
      const imageAttachment = attachments?.find((a: any) => a.type === 'imageAttachments')
      const experimental_attachments = imageAttachment?.images || []

      return {
        id: originalId, // Use original ID if available
        role: msg.role as 'user' | 'assistant',
        content: Array.isArray(msg.parts)
          ? msg.parts.map((part: any) => part.text || part).join('')
          : String(msg.parts),
        createdAt: msg.createdAt,
        // Restore annotations from attachments (excluding originalId and imageAttachments)
        ...(annotations.length > 0 ? { annotations } : {}),
        // Restore image attachments
        ...(experimental_attachments.length > 0 ? { experimental_attachments } : {}),
      }
    })

    console.log('Formatted messages:', formattedMessages.length)
    return formattedMessages
  } catch (error) {
    console.error('Error in getProjectMessages:', error)
    // If project doesn't exist, return empty array instead of throwing
    if (error instanceof Error && error.message === 'Project not found') {
      console.log('Project not found, returning empty messages array')
      return []
    }
    throw error
  }
}

// Get chat messages with cursor-based pagination
export async function getProjectMessagesPaginated(
  projectId: string,
  userId: string,
  limit: number = 30,
  cursor?: Date,
): Promise<{ messages: Message[]; hasMore: boolean; nextCursor?: Date }> {
  try {
    console.log('Getting paginated project messages for:', { projectId, userId, limit, cursor })
    const chatId = await getOrCreateProjectChat(projectId, userId)
    console.log('Got chatId:', chatId)

    // Build query with cursor if provided
    const query = db
      .select({
        id: message.id,
        role: message.role,
        parts: message.parts,
        attachments: message.attachments,
        createdAt: message.createdAt,
      })
      .from(message)
      .where(
        cursor
          ? and(eq(message.chatId, chatId), lt(message.createdAt, cursor))
          : eq(message.chatId, chatId)
      )
      .orderBy(desc(message.createdAt))
      .limit(limit + 1) // Fetch one extra to check if there are more

    const messages = await query

    console.log('Raw messages from DB:', messages.length)

    // Check if there are more messages
    const hasMore = messages.length > limit
    const messagesToReturn = hasMore ? messages.slice(0, limit) : messages

    // Get next cursor (oldest message's createdAt in this batch)
    const nextCursor = hasMore && messagesToReturn.length > 0
      ? messagesToReturn[messagesToReturn.length - 1].createdAt
      : undefined

    // Reverse to get chronological order (oldest to newest)
    messagesToReturn.reverse()

    // Convert database messages to AI SDK format
    const formattedMessages = messagesToReturn.map((msg) => {
      // Extract original ID from attachments if available
      const attachments = msg.attachments as any[]
      const originalIdAttachment = attachments?.find((a: any) => a.type === 'originalId')
      const originalId = originalIdAttachment?.id || msg.id

      // Filter out the originalId and imageAttachments from annotations
      const annotations = attachments?.filter((a: any) => a.type !== 'originalId' && a.type !== 'imageAttachments') || []

      // Extract image attachments
      const imageAttachment = attachments?.find((a: any) => a.type === 'imageAttachments')
      const experimental_attachments = imageAttachment?.images || []

      return {
        id: originalId, // Use original ID if available
        role: msg.role as 'user' | 'assistant',
        content: Array.isArray(msg.parts)
          ? msg.parts.map((part: any) => part.text || part).join('')
          : String(msg.parts),
        createdAt: msg.createdAt,
        // Restore annotations from attachments (excluding originalId and imageAttachments)
        ...(annotations.length > 0 ? { annotations } : {}),
        // Restore image attachments
        ...(experimental_attachments.length > 0 ? { experimental_attachments } : {}),
      }
    })

    console.log('Formatted messages:', formattedMessages.length, 'hasMore:', hasMore)
    return { messages: formattedMessages, hasMore, nextCursor }
  } catch (error) {
    console.error('Error in getProjectMessagesPaginated:', error)
    // If project doesn't exist, return empty array instead of throwing
    if (error instanceof Error && error.message === 'Project not found') {
      console.log('Project not found, returning empty messages array')
      return { messages: [], hasMore: false }
    }
    throw error
  }
}

// Store mapping between useChat IDs and database UUIDs
const messageIdMap = new Map<string, string>()

// Save messages to database
export async function saveProjectMessages(
  projectId: string,
  userId: string,
  messages: Message[],
) {
  console.log('[saveProjectMessages] Called with:', {
    projectId,
    userId,
    messagesCount: messages.length,
    messages: messages.map(m => ({ id: m.id, role: m.role, hasContent: !!m.content }))
  })

  const chatId = await getOrCreateProjectChat(projectId, userId)
  console.log('[saveProjectMessages] Got chatId:', chatId)

  // Get existing messages with their original IDs and roles stored in attachments
  const existingMessages = await db
    .select({
      id: message.id,
      role: message.role,
      attachments: message.attachments
    })
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt)

  console.log('[saveProjectMessages] Existing messages in DB:', existingMessages.length)

  // Build a set of original IDs from existing messages
  const existingOriginalIds = new Set<string>()
  existingMessages.forEach(msg => {
    const attachments = msg.attachments as any[]
    const originalIdAttachment = attachments?.find((a: any) => a.type === 'originalId')
    if (originalIdAttachment?.id) {
      existingOriginalIds.add(originalIdAttachment.id)
    }
  })

  console.log('[saveProjectMessages] Existing original IDs:', Array.from(existingOriginalIds))

  // Find the last user message ID we're responding to (from the incoming messages)
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()
  const lastUserMessageId = lastUserMessage?.id

  // Check if the last message in DB is already an assistant response
  // and the preceding user message matches (to detect duplicate assistant saves on retry)
  let hasExistingAssistantResponse = false
  if (lastUserMessageId && existingMessages.length >= 2) {
    // Find the position of the user message in DB
    let userMsgDbIndex = -1
    for (let i = existingMessages.length - 1; i >= 0; i--) {
      const msg = existingMessages[i]
      const attachments = msg.attachments as any[]
      const originalIdAttachment = attachments?.find((a: any) => a.type === 'originalId')
      if (originalIdAttachment?.id === lastUserMessageId) {
        userMsgDbIndex = i
        break
      }
    }

    // If user message exists in DB, check if there's already an assistant message after it
    if (userMsgDbIndex >= 0 && userMsgDbIndex < existingMessages.length - 1) {
      const nextMsg = existingMessages[userMsgDbIndex + 1]
      if (nextMsg.role === 'assistant') {
        hasExistingAssistantResponse = true
        console.log('[saveProjectMessages] ⚠️ Found existing assistant response for user message:', lastUserMessageId)
      }
    }
  }

  // Only save messages that don't already exist in the database
  const newMessages = messages.filter(msg => {
    // Check if this message ID already exists
    if (msg.id && existingOriginalIds.has(msg.id)) {
      return false
    }
    // Skip duplicate assistant responses (from retries)
    if (msg.role === 'assistant' && hasExistingAssistantResponse) {
      console.log('[saveProjectMessages] ⚠️ Skipping duplicate assistant message (retry detected):', msg.id)
      return false
    }
    return true
  })

  console.log('[saveProjectMessages] New messages to save:', newMessages.length)
  console.log('[saveProjectMessages] New message details:', newMessages.map(m => ({
    id: m.id,
    role: m.role,
    contentLength: m.content?.length || 0
  })))

  if (newMessages.length > 0) {
    const messagesToInsert = newMessages.map((msg) => {
      // Ensure createdAt is a Date object
      let createdAt: Date
      if (msg.createdAt instanceof Date) {
        createdAt = msg.createdAt
      } else if (typeof msg.createdAt === 'string') {
        createdAt = new Date(msg.createdAt)
      } else {
        createdAt = new Date()
      }
      
      // Generate a UUID for database storage
      const dbId = crypto.randomUUID()
      
      // Preserve the original message ID in attachments
      const attachments = [...((msg as any).annotations || [])]
      if (msg.id) {
        attachments.push({ type: 'originalId', id: msg.id })
      }

      // Save experimental_attachments (image attachments) if present
      const experimentalAttachments = (msg as any).experimental_attachments
      if (experimentalAttachments?.length > 0) {
        attachments.push({ type: 'imageAttachments', images: experimentalAttachments })
      }

      const messageData = {
        id: dbId,
        chatId,
        role: msg.role,
        parts: [{ text: msg.content }],
        attachments,
        createdAt,
      }
      console.log('[saveProjectMessages] Preparing to insert message:', {
        dbId: messageData.id,
        originalId: msg.id,
        role: messageData.role,
        createdAt: messageData.createdAt,
        createdAtType: typeof messageData.createdAt,
        createdAtIsDate: messageData.createdAt instanceof Date
      })
      return messageData
    })

    try {
      await db.insert(message).values(messagesToInsert)
      console.log('[saveProjectMessages] Successfully inserted', messagesToInsert.length, 'messages')
    } catch (error) {
      console.error('[saveProjectMessages] Error inserting messages:', error)
      throw error
    }
  } else {
    console.log('[saveProjectMessages] No new messages to save')
  }
}
