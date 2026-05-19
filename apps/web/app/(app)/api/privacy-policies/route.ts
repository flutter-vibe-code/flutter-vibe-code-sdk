import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { privacyPolicies } from '@flutter-vibe-code/database'
import { eq, desc } from 'drizzle-orm'
import { generatePolicy, generateNutritionLabel } from '@/lib/privacy-policy/policy-generator'
import { PolicyAnswers } from '@/lib/privacy-policy/types'

export const dynamic = 'force-dynamic'

// GET - List user's privacy policies
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const policies = await db
      .select()
      .from(privacyPolicies)
      .where(eq(privacyPolicies.userId, session.user.id))
      .orderBy(desc(privacyPolicies.updatedAt))

    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Error fetching privacy policies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new privacy policy
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { appName, companyName, answers } = body

    if (!appName) {
      return NextResponse.json({ error: 'App name is required' }, { status: 400 })
    }

    // Generate policy if answers are complete
    let generatedPolicy: string | undefined
    let nutritionLabel: object | undefined

    if (answers && body.status === 'completed') {
      generatedPolicy = generatePolicy(answers as PolicyAnswers)
      nutritionLabel = generateNutritionLabel(answers as PolicyAnswers)
    }

    const [newPolicy] = await db
      .insert(privacyPolicies)
      .values({
        userId: session.user.id,
        appName,
        companyName: companyName || null,
        answers: answers || {},
        generatedPolicy: generatedPolicy || null,
        nutritionLabel: nutritionLabel || null,
        status: body.status || 'draft',
      })
      .returning()

    return NextResponse.json({ policy: newPolicy }, { status: 201 })
  } catch (error) {
    console.error('Error creating privacy policy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
