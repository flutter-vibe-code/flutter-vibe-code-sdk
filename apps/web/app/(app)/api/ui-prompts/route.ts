export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { db, uiPrompts, desc, asc, sql, eq, and } from "@/lib/db"
import { ilike } from "drizzle-orm"
import { isAdmin } from "@/lib/auth/admin"

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
].filter(Boolean) as string[]

// GET /api/ui-prompts - Public list endpoint with search, filter, sort, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const tag = searchParams.get("tag")
    const sort = searchParams.get("sort") || "latest"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)))
    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = []

    if (search) {
      conditions.push(ilike(uiPrompts.title, `%${search}%`))
    }

    if (tag) {
      conditions.push(sql`${uiPrompts.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Determine sort order
    const orderBy = sort === "popular"
      ? desc(uiPrompts.viewCount)
      : desc(uiPrompts.createdAt)

    // Execute count and data queries in parallel
    const [countResult, prompts] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(uiPrompts)
        .where(whereClause),
      db
        .select({
          id: uiPrompts.id,
          slug: uiPrompts.slug,
          title: uiPrompts.title,
          description: uiPrompts.description,
          thumbnailUrl: uiPrompts.thumbnailUrl,
          tags: uiPrompts.tags,
          viewCount: uiPrompts.viewCount,
          featured: uiPrompts.featured,
          createdAt: uiPrompts.createdAt,
          remixUrl: uiPrompts.remixUrl,
        })
        .from(uiPrompts)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
    ])

    const total = Number(countResult[0].count)
    const totalPages = Math.ceil(total / limit)

    // Get all unique tags across all prompts
    const allTagsResult = await db
      .select({ tags: uiPrompts.tags })
      .from(uiPrompts)

    const tagsSet = new Set<string>()
    for (const row of allTagsResult) {
      if (Array.isArray(row.tags)) {
        for (const t of row.tags) {
          tagsSet.add(t)
        }
      }
    }
    const tags = Array.from(tagsSet).sort()

    return NextResponse.json({
      prompts,
      total,
      page,
      limit,
      totalPages,
      tags,
    })
  } catch (error) {
    console.error("Error fetching UI prompts:", error)
    return NextResponse.json(
      { error: "Failed to fetch UI prompts" },
      { status: 500 }
    )
  }
}

// POST /api/ui-prompts - Admin-only create endpoint
export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin access
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    const { slug, title, description, prompt, thumbnailUrl } = body
    if (!slug || !title || !description || !prompt || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, description, prompt, thumbnailUrl" },
        { status: 400 }
      )
    }

    // Insert new UI prompt
    const [created] = await db
      .insert(uiPrompts)
      .values({
        slug,
        title,
        description,
        prompt,
        thumbnailUrl,
        screenshotUrls: body.screenshotUrls || [],
        videoPreviewUrl: body.videoPreviewUrl || null,
        remixUrl: body.remixUrl || null,
        tags: body.tags || [],
        featured: body.featured || false,
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    // Handle unique constraint violation (duplicate slug)
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A UI prompt with this slug already exists" },
        { status: 409 }
      )
    }

    console.error("Error creating UI prompt:", error)
    return NextResponse.json(
      { error: "Failed to create UI prompt" },
      { status: 500 }
    )
  }
}
