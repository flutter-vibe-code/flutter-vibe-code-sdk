import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { privacyPolicies } from '@flutter-vibe-code/database'
import { eq, and } from 'drizzle-orm'
import { generatePolicy, generateNutritionLabel } from '@/lib/privacy-policy/policy-generator'
import { PolicyAnswers } from '@/lib/privacy-policy/types'

export const dynamic = 'force-dynamic'

// GET - Get single privacy policy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const [policy] = await db
      .select()
      .from(privacyPolicies)
      .where(
        and(
          eq(privacyPolicies.id, id),
          eq(privacyPolicies.userId, session.user.id)
        )
      )
      .limit(1)

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error('Error fetching privacy policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update privacy policy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const [existingPolicy] = await db
      .select()
      .from(privacyPolicies)
      .where(
        and(
          eq(privacyPolicies.id, id),
          eq(privacyPolicies.userId, session.user.id)
        )
      )
      .limit(1)

    if (!existingPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (body.appName !== undefined) updateData.appName = body.appName
    if (body.companyName !== undefined) updateData.companyName = body.companyName
    if (body.answers !== undefined) updateData.answers = body.answers
    if (body.status !== undefined) updateData.status = body.status

    // Generate policy if completing
    if (body.status === 'completed' && body.answers) {
      updateData.generatedPolicy = generatePolicy(body.answers as PolicyAnswers)
      updateData.nutritionLabel = generateNutritionLabel(body.answers as PolicyAnswers)
    }

    const [updatedPolicy] = await db
      .update(privacyPolicies)
      .set(updateData)
      .where(eq(privacyPolicies.id, id))
      .returning()

    return NextResponse.json({ policy: updatedPolicy })
  } catch (error) {
    console.error('Error updating privacy policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete privacy policy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership and delete
    const [deletedPolicy] = await db
      .delete(privacyPolicies)
      .where(
        and(
          eq(privacyPolicies.id, id),
          eq(privacyPolicies.userId, session.user.id)
        )
      )
      .returning()

    if (!deletedPolicy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting privacy policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
