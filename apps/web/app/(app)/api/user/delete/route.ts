import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { db, subscriptions } from '@/lib/db'
import { user, chat, message } from '@flutter-vibe-code/database'
import { eq } from 'drizzle-orm'
import { Polar } from '@polar-sh/sdk'

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER! as 'production' | 'sandbox',
})

export async function DELETE(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - no active session' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    console.log(`[Delete Account] Starting deletion process for user: ${userId}`)

    // First, get the user's Polar customer ID before deleting
    let polarCustomerId: string | null = null
    try {
      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

      if (userSubscription.length > 0 && userSubscription[0].customerId) {
        polarCustomerId = userSubscription[0].customerId
        console.log(`[Delete Account] Found Polar customer ID: ${polarCustomerId}`)
      }
    } catch (error) {
      console.warn(`[Delete Account] Could not retrieve Polar customer ID:`, error)
    }

    // Delete Polar customer if exists
    if (polarCustomerId) {
      try {
        console.log(`[Delete Account] Deleting Polar customer: ${polarCustomerId}`)
        await polarClient.customers.delete(polarCustomerId)
        console.log(`[Delete Account] Successfully deleted Polar customer: ${polarCustomerId}`)
      } catch (polarError) {
        // Log but don't fail the entire deletion if Polar deletion fails
        console.error(`[Delete Account] Failed to delete Polar customer ${polarCustomerId}:`, polarError)
        console.error(`[Delete Account] Continuing with local deletion despite Polar error`)
      }
    } else {
      console.log(`[Delete Account] No Polar customer ID found, skipping Polar deletion`)
    }

    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // First, get all chat IDs for this user to delete messages
      console.log(`[Delete Account] Finding chats for user: ${userId}`)
      const userChats = await tx
        .select({ id: chat.id })
        .from(chat)
        .where(eq(chat.userId, userId))

      console.log(`[Delete Account] Found ${userChats.length} chats to delete`)

      // Delete all messages for each chat
      for (const userChat of userChats) {
        console.log(`[Delete Account] Deleting messages for chat: ${userChat.id}`)
        await tx
          .delete(message)
          .where(eq(message.chatId, userChat.id))
      }

      // Delete all chats for this user
      console.log(`[Delete Account] Deleting chats for user: ${userId}`)
      await tx
        .delete(chat)
        .where(eq(chat.userId, userId))

      // Now delete the user - this will cascade to all other related tables:
      // - sessions (onDelete: 'cascade')
      // - accounts (onDelete: 'cascade') 
      // - usersTeams (onDelete: 'cascade')
      // - projects (onDelete: 'cascade')
      // - subscriptions (onDelete: 'cascade')
      // - promptMessages (onDelete: 'cascade')
      // - conversations (onDelete: 'cascade')
      
      console.log(`[Delete Account] Deleting user record for: ${userId}`)
      
      const deletedUsers = await tx
        .delete(user)
        .where(eq(user.id, userId))
        .returning()

      if (deletedUsers.length === 0) {
        throw new Error('User not found or already deleted')
      }

      console.log(`[Delete Account] Successfully deleted user: ${userId}`)
    })

    // Log successful deletion
    console.log(`[Delete Account] Account deletion completed for user: ${userId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    })

  } catch (error) {
    console.error('[Delete Account] Error deleting user account:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to delete account. Please try again or contact support.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}