import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { db, uiPrompts, eq, sql } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin"

export const dynamic = "force-dynamic";

// GET - Public detail with auth-gated prompt text
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Fetch the prompt by slug
    const [prompt] = await db
      .select()
      .from(uiPrompts)
      .where(eq(uiPrompts.slug, slug))
      .limit(1);

    if (!prompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Increment view count
    await db
      .update(uiPrompts)
      .set({ viewCount: sql`${uiPrompts.viewCount} + 1` })
      .where(eq(uiPrompts.slug, slug));

    // Check auth session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Only return prompt text if authenticated
    return NextResponse.json({
      prompt: {
        ...prompt,
        prompt: session?.user ? prompt.prompt : null,
      },
    });
  } catch (error) {
    console.error("Error fetching UI prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Admin-only update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { slug } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(uiPrompts)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(uiPrompts.slug, slug))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ prompt: updated });
  } catch (error) {
    console.error("Error updating UI prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Admin-only delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { slug } = await params;

    const [deleted] = await db
      .delete(uiPrompts)
      .where(eq(uiPrompts.slug, slug))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting UI prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
