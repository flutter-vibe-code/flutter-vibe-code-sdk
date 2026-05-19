# UI Prompts Minisite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a curated gallery minisite at `/ui-prompts` showcasing AI prompts that generate Flutter UIs, with search, tag filtering, auth-gated prompt text, and remix links.

**Architecture:** New `uiPrompts` table in the shared database package. Server-rendered gallery/detail pages under `app/(app)/ui-prompts/`. Admin-only CRUD API routes. Vercel Blob for image/video assets. Auth-gated prompt text via Better Auth session check.

**Tech Stack:** Next.js 14 App Router, Drizzle ORM (PostgreSQL/Neon), Vercel Blob, Better Auth, shadcn/ui, Tailwind CSS, Lucide icons.

**Design doc:** `docs/plans/2026-03-03-ui-prompts-minisite-design.md`

---

## Phase 1: Database Foundation (sequential)

### Task 1: Add uiPrompts table to database schema

**Files:**
- Modify: `packages/database/src/schema.ts` (append after existing tables, ~line 500)

**Step 1: Add the table definition**

Add these imports at the top of the file (merge with existing imports from `drizzle-orm/pg-core`):

```typescript
// These should already be imported, just verify: uuid, varchar, text, timestamp, integer, boolean, json, pgTable
```

Add at the end of the file, before any final exports:

```typescript
export const uiPrompts = pgTable("ui_prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  prompt: text("prompt").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  screenshotUrls: json("screenshot_urls").$type<string[]>().default([]),
  videoPreviewUrl: text("video_preview_url"),
  remixUrl: text("remix_url"),
  tags: json("tags").$type<string[]>().default([]),
  viewCount: integer("view_count").default(0).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UiPrompt = typeof uiPrompts.$inferSelect;
export type NewUiPrompt = typeof uiPrompts.$inferInsert;
```

**Step 2: Verify type checking passes**

Run: `cd /Users/rofi/Programing/capsule/flutter-vibe-code && pnpm run type-check`
Expected: No new type errors from the schema change.

**Step 3: Commit**

```bash
git add packages/database/src/schema.ts
git commit -m "feat(db): add uiPrompts table for UI prompt gallery"
```

---

### Task 2: Generate and apply database migration

**Files:**
- Generated: `packages/database/migrations/XXXX_*.sql` (auto-generated)

**Step 1: Generate migration**

Run: `cd /Users/rofi/Programing/capsule/flutter-vibe-code && pnpm run db:generate`
Expected: New migration file created in `packages/database/migrations/`

**Step 2: Push schema to development database**

Run: `pnpm run db:push`
Expected: Schema applied successfully, `ui_prompts` table created.

**Step 3: Commit migration**

```bash
git add packages/database/migrations/
git commit -m "chore(db): add migration for ui_prompts table"
```

---

## Phase 2: API Routes (parallelizable — Tasks 3-7 can run concurrently)

### Task 3: GET list API route — `/api/ui-prompts`

**Files:**
- Create: `apps/web/app/(app)/api/ui-prompts/route.ts`

**Step 1: Implement the list endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, uiPrompts, desc, asc, sql, ilike } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const sort = searchParams.get("sort") || "latest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        ilike(uiPrompts.title, `%${search}%`)
      );
    }

    if (tag) {
      // Filter by tag in JSON array
      conditions.push(
        sql`${uiPrompts.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`
      );
    }

    const orderBy =
      sort === "popular"
        ? desc(uiPrompts.viewCount)
        : desc(uiPrompts.createdAt);

    const whereClause =
      conditions.length > 0
        ? sql`${sql.join(conditions, sql` AND `)}`
        : undefined;

    const results = await db
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
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(uiPrompts)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    // Get all unique tags for the filter
    const allTags = await db
      .select({ tags: uiPrompts.tags })
      .from(uiPrompts);

    const uniqueTags = [
      ...new Set(allTags.flatMap((r) => (r.tags as string[]) || [])),
    ].sort();

    return NextResponse.json({
      prompts: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      tags: uniqueTags,
    });
  } catch (error) {
    console.error("Error fetching UI prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch UI prompts" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify with type check**

Run: `pnpm run type-check`
Expected: No type errors.

**Step 3: Commit**

```bash
git add apps/web/app/(app)/api/ui-prompts/route.ts
git commit -m "feat(api): add GET /api/ui-prompts list endpoint with search, tags, sorting"
```

---

### Task 4: GET detail API route — `/api/ui-prompts/[slug]`

**Files:**
- Create: `apps/web/app/(app)/api/ui-prompts/[slug]/route.ts`

**Step 1: Implement the detail endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, uiPrompts, eq, sql } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const result = await db
      .select()
      .from(uiPrompts)
      .where(eq(uiPrompts.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    const prompt = result[0];

    // Increment view count
    await db
      .update(uiPrompts)
      .set({ viewCount: sql`${uiPrompts.viewCount} + 1` })
      .where(eq(uiPrompts.id, prompt.id));

    // Check auth — only return prompt text if authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return NextResponse.json({
      ...prompt,
      prompt: session ? prompt.prompt : null,
      viewCount: prompt.viewCount + 1,
    });
  } catch (error) {
    console.error("Error fetching UI prompt:", error);
    return NextResponse.json(
      { error: "Failed to fetch UI prompt" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify with type check**

Run: `pnpm run type-check`

**Step 3: Commit**

```bash
git add apps/web/app/(app)/api/ui-prompts/[slug]/route.ts
git commit -m "feat(api): add GET /api/ui-prompts/[slug] with auth-gated prompt text"
```

---

### Task 5: Admin POST create API route

**Files:**
- Modify: `apps/web/app/(app)/api/ui-prompts/route.ts` (add POST handler)

**Step 1: Add POST handler to the existing route file**

Append to the file after the GET handler. Add `auth` and `headers` imports at top:

```typescript
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
```

```typescript
const ADMIN_EMAILS = [
  // Add admin email addresses here
  process.env.ADMIN_EMAIL,
].filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      slug,
      title,
      description,
      prompt,
      thumbnailUrl,
      screenshotUrls,
      videoPreviewUrl,
      remixUrl,
      tags,
      featured,
    } = body;

    if (!slug || !title || !description || !prompt || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, description, prompt, thumbnailUrl" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(uiPrompts)
      .values({
        slug,
        title,
        description,
        prompt,
        thumbnailUrl,
        screenshotUrls: screenshotUrls || [],
        videoPreviewUrl: videoPreviewUrl || null,
        remixUrl: remixUrl || null,
        tags: tags || [],
        featured: featured || false,
      })
      .returning();

    return NextResponse.json({ prompt: result[0] }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A prompt with this slug already exists" },
        { status: 409 }
      );
    }
    console.error("Error creating UI prompt:", error);
    return NextResponse.json(
      { error: "Failed to create UI prompt" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify with type check**

Run: `pnpm run type-check`

**Step 3: Commit**

```bash
git add apps/web/app/(app)/api/ui-prompts/route.ts
git commit -m "feat(api): add admin POST /api/ui-prompts for creating prompts"
```

---

### Task 6: Admin PATCH/DELETE routes

**Files:**
- Modify: `apps/web/app/(app)/api/ui-prompts/[slug]/route.ts` (add PATCH + DELETE)

**Step 1: Add PATCH and DELETE handlers**

Add to the existing `[slug]/route.ts` file after GET:

```typescript
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
].filter(Boolean);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();

    const result = await db
      .update(uiPrompts)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(uiPrompts.slug, slug))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ prompt: result[0] });
  } catch (error) {
    console.error("Error updating UI prompt:", error);
    return NextResponse.json(
      { error: "Failed to update UI prompt" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const result = await db
      .delete(uiPrompts)
      .where(eq(uiPrompts.slug, slug))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Prompt not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting UI prompt:", error);
    return NextResponse.json(
      { error: "Failed to delete UI prompt" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify with type check**

Run: `pnpm run type-check`

**Step 3: Commit**

```bash
git add apps/web/app/(app)/api/ui-prompts/[slug]/route.ts
git commit -m "feat(api): add admin PATCH/DELETE for /api/ui-prompts/[slug]"
```

---

### Task 7: Upload API route for Vercel Blob

**Files:**
- Create: `apps/web/app/(app)/api/ui-prompts/upload/route.ts`

**Step 1: Implement upload endpoint**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
].filter(Boolean);

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
];

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? "50MB" : "10MB"} limit` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob under ui-prompts/ prefix
    const blobPath = `ui-prompts/${Date.now()}-${file.name}`;
    const blob = await put(blobPath, buffer, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Error uploading UI prompt asset:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify with type check**

Run: `pnpm run type-check`

**Step 3: Commit**

```bash
git add apps/web/app/(app)/api/ui-prompts/upload/route.ts
git commit -m "feat(api): add admin upload endpoint for UI prompt assets via Vercel Blob"
```

---

## Phase 3: Frontend Components & Pages (parallelizable — Tasks 8-10)

### Task 8: PhoneFrame + PromptCard components

**Files:**
- Create: `apps/web/components/ui-prompts/phone-frame.tsx`
- Create: `apps/web/components/ui-prompts/prompt-card.tsx`

**Step 1: Create the PhoneFrame component**

```typescript
// apps/web/components/ui-prompts/phone-frame.tsx
"use client";

import Image from "next/image";

interface PhoneFrameProps {
  src: string;
  alt: string;
  className?: string;
}

export function PhoneFrame({ src, alt, className = "" }: PhoneFrameProps) {
  return (
    <div
      className={`relative rounded-[2rem] border-[3px] border-neutral-700 bg-black overflow-hidden shadow-lg ${className}`}
      style={{ aspectRatio: "9/19.5" }}
    >
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 pt-2 pb-1 text-[10px] text-white">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
            <rect x="0" y="6" width="2" height="4" rx="0.5" />
            <rect x="3" y="4" width="2" height="6" rx="0.5" />
            <rect x="6" y="2" width="2" height="8" rx="0.5" />
            <rect x="9" y="0" width="2" height="10" rx="0.5" />
          </svg>
          <svg width="12" height="10" viewBox="0 0 12 10" fill="white">
            <path d="M6 2.5c1.7 0 3.2.7 4.3 1.8l1.2-1.2C10 1.7 8.1.8 6 .8S2 1.7.5 3.1l1.2 1.2C2.8 3.2 4.3 2.5 6 2.5z" />
            <path d="M6 5.5c1 0 1.9.4 2.6 1l1.2-1.2C8.7 4.3 7.4 3.8 6 3.8s-2.7.5-3.8 1.5l1.2 1.2C4.1 5.9 5 5.5 6 5.5z" />
            <circle cx="6" cy="8" r="1.5" />
          </svg>
          <svg width="18" height="10" viewBox="0 0 18 10" fill="white">
            <rect x="0" y="1" width="14" height="8" rx="1.5" stroke="white" strokeWidth="1" fill="none" />
            <rect x="1.5" y="2.5" width="10" height="5" rx="0.5" fill="white" />
            <rect x="15" y="3" width="2" height="4" rx="0.5" />
          </svg>
        </div>
      </div>
      {/* Dynamic island notch */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10 w-20 h-5 bg-black rounded-full" />
      {/* Screenshot */}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
      />
    </div>
  );
}
```

**Step 2: Create the PromptCard component**

```typescript
// apps/web/components/ui-prompts/prompt-card.tsx
"use client";

import Link from "next/link";
import { PhoneFrame } from "./phone-frame";
import { Badge } from "@/components/ui/badge";

interface PromptCardProps {
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  featured: boolean;
  viewCount: number;
  remixUrl?: string | null;
}

export function PromptCard({
  slug,
  title,
  description,
  thumbnailUrl,
  tags,
  featured,
  viewCount,
}: PromptCardProps) {
  return (
    <Link href={`/ui-prompts/${slug}`} className="group block">
      <div className="relative rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-all duration-200 hover:border-neutral-600 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
        {/* Badges */}
        <div className="absolute top-6 left-6 z-10 flex gap-2">
          {featured && (
            <Badge className="bg-green-600 text-white text-xs hover:bg-green-600">
              Featured
            </Badge>
          )}
        </div>

        {/* Phone mockup */}
        <div className="flex justify-center mb-4">
          <PhoneFrame
            src={thumbnailUrl}
            alt={title}
            className="w-full max-w-[200px]"
          />
        </div>

        {/* Info */}
        <div className="space-y-2">
          <h3 className="text-white font-medium text-sm truncate group-hover:text-green-400 transition-colors">
            {title}
          </h3>
          <p className="text-neutral-400 text-xs line-clamp-2">
            {description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1 flex-wrap">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-neutral-500">
              {viewCount.toLocaleString()} views
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Step 3: Verify with type check**

Run: `pnpm run type-check`

**Step 4: Commit**

```bash
git add apps/web/components/ui-prompts/
git commit -m "feat(ui): add PhoneFrame and PromptCard components for gallery"
```

---

### Task 9: Gallery page — `/ui-prompts`

**Files:**
- Create: `apps/web/app/(app)/ui-prompts/page.tsx`
- Create: `apps/web/app/(app)/ui-prompts/layout.tsx`
- Create: `apps/web/components/ui-prompts/prompt-gallery.tsx`

**Step 1: Create the layout**

```typescript
// apps/web/app/(app)/ui-prompts/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UI Prompt Gallery | Flutter Vibe Code",
  description:
    "Curated collection of AI prompts that generate beautiful Flutter UIs. Browse, search, and remix designs instantly.",
};

export default function UiPromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Step 2: Create the gallery client component**

```typescript
// apps/web/components/ui-prompts/prompt-gallery.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PromptCard } from "./prompt-card";
import type { UiPrompt } from "@flutter-vibe-code/database";

interface GalleryData {
  prompts: UiPrompt[];
  total: number;
  page: number;
  totalPages: number;
  tags: string[];
}

export function PromptGallery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeTag) params.set("tag", activeTag);
      params.set("sort", sort);
      params.set("page", page.toString());

      const res = await fetch(`/api/ui-prompts?${params}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, sort, page]);

  useEffect(() => {
    const timer = setTimeout(fetchPrompts, 300);
    return () => clearTimeout(timer);
  }, [fetchPrompts]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (activeTag) params.set("tag", activeTag);
    if (sort !== "latest") params.set("sort", sort);
    if (page > 1) params.set("page", page.toString());
    const qs = params.toString();
    router.replace(`/ui-prompts${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [search, activeTag, sort, page, router]);

  return (
    <div className="space-y-8">
      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500 focus:border-green-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sort === "latest" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSort("latest");
              setPage(1);
            }}
            className={
              sort === "latest"
                ? "bg-white text-black hover:bg-neutral-200"
                : "border-neutral-700 text-neutral-400 hover:text-white"
            }
          >
            Latest
          </Button>
          <Button
            variant={sort === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSort("popular");
              setPage(1);
            }}
            className={
              sort === "popular"
                ? "bg-white text-black hover:bg-neutral-200"
                : "border-neutral-700 text-neutral-400 hover:text-white"
            }
          >
            Most Popular
          </Button>
        </div>
      </div>

      {/* Tag filters */}
      {data?.tags && data.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setActiveTag("");
              setPage(1);
            }}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              !activeTag
                ? "bg-white text-black"
                : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
            }`}
          >
            All
          </button>
          {data.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setActiveTag(tag === activeTag ? "" : tag);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                tag === activeTag
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 animate-pulse"
            >
              <div className="bg-neutral-800 rounded-2xl mx-auto w-full max-w-[200px]" style={{ aspectRatio: "9/19.5" }} />
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.prompts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-400 text-lg">No prompts found</p>
          <p className="text-neutral-500 text-sm mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              slug={prompt.slug}
              title={prompt.title}
              description={prompt.description}
              thumbnailUrl={prompt.thumbnailUrl}
              tags={(prompt.tags as string[]) || []}
              featured={prompt.featured}
              viewCount={prompt.viewCount}
              remixUrl={prompt.remixUrl}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="border-neutral-700 text-neutral-400 hover:text-white"
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-neutral-400 px-4">
            Page {page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
            className="border-neutral-700 text-neutral-400 hover:text-white"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Create the page**

```typescript
// apps/web/app/(app)/ui-prompts/page.tsx
import { Suspense } from "react";
import { getServerSession } from "@/lib/auth";
import { NavHeader } from "@/components/nav-header";
import { PromptGallery } from "@/components/ui-prompts/prompt-gallery";

export default async function UiPromptsPage() {
  const session = await getServerSession();

  return (
    <main className="min-h-dvh bg-neutral-950">
      <NavHeader session={session} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            UI Prompt Gallery
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Curated collection of AI prompts that generate beautiful React
            Native UIs. Browse, search, and remix designs instantly.
          </p>
        </div>

        {/* Gallery */}
        <Suspense
          fallback={
            <div className="text-center py-20 text-neutral-400">
              Loading prompts...
            </div>
          }
        >
          <PromptGallery />
        </Suspense>
      </div>
    </main>
  );
}
```

**Step 4: Verify with type check**

Run: `pnpm run type-check`

**Step 5: Commit**

```bash
git add apps/web/app/(app)/ui-prompts/ apps/web/components/ui-prompts/prompt-gallery.tsx
git commit -m "feat(pages): add /ui-prompts gallery page with search, tags, and sorting"
```

---

### Task 10: Detail page — `/ui-prompts/[slug]`

**Files:**
- Create: `apps/web/app/(app)/ui-prompts/[slug]/page.tsx`
- Create: `apps/web/components/ui-prompts/prompt-detail.tsx`
- Create: `apps/web/components/ui-prompts/screenshot-gallery.tsx`
- Create: `apps/web/components/ui-prompts/prompt-code-block.tsx`

**Step 1: Create ScreenshotGallery component**

```typescript
// apps/web/components/ui-prompts/screenshot-gallery.tsx
"use client";

import { useState } from "react";
import { PhoneFrame } from "./phone-frame";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScreenshotGalleryProps {
  screenshots: string[];
  title: string;
  videoPreviewUrl?: string | null;
}

export function ScreenshotGallery({
  screenshots,
  title,
  videoPreviewUrl,
}: ScreenshotGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (screenshots.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Main view */}
      <div className="flex justify-center">
        <PhoneFrame
          src={screenshots[activeIndex]}
          alt={`${title} - Screen ${activeIndex + 1}`}
          className="w-full max-w-[280px]"
        />
      </div>

      {/* Thumbnail strip */}
      {screenshots.length > 1 && (
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() =>
              setActiveIndex(
                (activeIndex - 1 + screenshots.length) % screenshots.length
              )
            }
            className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-2 overflow-x-auto py-2 px-1">
            {screenshots.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeIndex
                    ? "border-green-500"
                    : "border-neutral-700 hover:border-neutral-500"
                }`}
              >
                <img
                  src={src}
                  alt={`${title} - Screen ${i + 1}`}
                  className="w-12 h-24 object-cover"
                />
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setActiveIndex((activeIndex + 1) % screenshots.length)
            }
            className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Video preview */}
      {videoPreviewUrl && (
        <div className="mt-4">
          <video
            src={videoPreviewUrl}
            controls
            className="w-full max-w-[280px] mx-auto rounded-xl"
            playsInline
          />
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create PromptCodeBlock component (auth-gated)**

```typescript
// apps/web/components/ui-prompts/prompt-code-block.tsx
"use client";

import { useState } from "react";
import { Check, Copy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth/client";

interface PromptCodeBlockProps {
  prompt: string | null;
  isAuthenticated: boolean;
}

export function PromptCodeBlock({
  prompt,
  isAuthenticated,
}: PromptCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated || !prompt) {
    return (
      <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-8 text-center">
        <Lock className="h-8 w-8 text-neutral-500 mx-auto mb-3" />
        <p className="text-neutral-400 mb-4">
          Sign in to view and copy the prompt
        </p>
        <Button
          onClick={() => signInWithGoogle()}
          className="bg-white text-black hover:bg-neutral-200"
        >
          Login to get prompt
        </Button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-neutral-700 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <span className="text-xs text-neutral-500 font-medium">Prompt</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm text-neutral-300 whitespace-pre-wrap overflow-auto max-h-[400px] leading-relaxed">
        {prompt}
      </pre>
    </div>
  );
}
```

**Step 3: Create PromptDetail component**

```typescript
// apps/web/components/ui-prompts/prompt-detail.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScreenshotGallery } from "./screenshot-gallery";
import { PromptCodeBlock } from "./prompt-code-block";
import type { UiPrompt } from "@flutter-vibe-code/database";

interface PromptDetailProps {
  slug: string;
  isAuthenticated: boolean;
}

type PromptData = UiPrompt & { prompt: string | null };

export function PromptDetail({ slug, isAuthenticated }: PromptDetailProps) {
  const router = useRouter();
  const [data, setData] = useState<PromptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const res = await fetch(`/api/ui-prompts/${slug}`);
        if (!res.ok) {
          router.replace("/ui-prompts");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        router.replace("/ui-prompts");
      } finally {
        setLoading(false);
      }
    }
    fetchPrompt();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col lg:flex-row gap-8">
        <div className="lg:w-[60%] flex justify-center">
          <div className="bg-neutral-800 rounded-[2rem] w-full max-w-[280px]" style={{ aspectRatio: "9/19.5" }} />
        </div>
        <div className="lg:w-[40%] space-y-4">
          <div className="h-8 bg-neutral-800 rounded w-3/4" />
          <div className="h-4 bg-neutral-800 rounded w-full" />
          <div className="h-4 bg-neutral-800 rounded w-2/3" />
          <div className="h-40 bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const screenshots = [
    data.thumbnailUrl,
    ...((data.screenshotUrls as string[]) || []),
  ];

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/ui-prompts")}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to gallery
      </button>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left — Screenshots */}
        <div className="lg:w-[60%]">
          <ScreenshotGallery
            screenshots={screenshots}
            title={data.title}
            videoPreviewUrl={data.videoPreviewUrl}
          />
        </div>

        {/* Right — Details */}
        <div className="lg:w-[40%] space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{data.title}</h1>
              {data.featured && (
                <Badge className="bg-green-600 text-white hover:bg-green-600">
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-neutral-400 leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Tags */}
          {data.tags && (data.tags as string[]).length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {(data.tags as string[]).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* View count */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Eye className="h-4 w-4" />
            {data.viewCount.toLocaleString()} views
          </div>

          {/* Prompt (auth-gated) */}
          <PromptCodeBlock
            prompt={data.prompt}
            isAuthenticated={isAuthenticated}
          />

          {/* Remix button */}
          {data.remixUrl && (
            <a
              href={data.remixUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 w-full justify-center bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-6 rounded-xl transition-colors text-sm"
            >
              Try this design now
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create the detail page**

```typescript
// apps/web/app/(app)/ui-prompts/[slug]/page.tsx
import { getServerSession } from "@/lib/auth";
import { NavHeader } from "@/components/nav-header";
import { PromptDetail } from "@/components/ui-prompts/prompt-detail";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function UiPromptDetailPage({ params }: Props) {
  const [session, { slug }] = await Promise.all([
    getServerSession(),
    params,
  ]);

  return (
    <main className="min-h-dvh bg-neutral-950">
      <NavHeader session={session} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PromptDetail slug={slug} isAuthenticated={!!session} />
      </div>
    </main>
  );
}
```

**Step 5: Verify with type check**

Run: `pnpm run type-check`

**Step 6: Commit**

```bash
git add apps/web/app/(app)/ui-prompts/[slug]/ apps/web/components/ui-prompts/
git commit -m "feat(pages): add /ui-prompts/[slug] detail page with auth-gated prompt and remix CTA"
```

---

## Phase 4: Integration & Polish (sequential)

### Task 11: Add Next.js image domain for Vercel Blob

**Files:**
- Modify: `apps/web/next.config.mjs`

**Step 1: Add Vercel Blob hostname to remote patterns**

Find the existing `images.remotePatterns` array and add:

```javascript
{
  protocol: 'https',
  hostname: '*.public.blob.vercel-storage.com',
}
```

**Step 2: Verify with type check**

Run: `pnpm run type-check`

**Step 3: Commit**

```bash
git add apps/web/next.config.mjs
git commit -m "fix(config): add Vercel Blob hostname to Next.js image remote patterns"
```

---

### Task 12: Verify build and test manually

**Step 1: Run type check**

Run: `pnpm run type-check`
Expected: No errors.

**Step 2: Run build**

Run: `pnpm run build`
Expected: Build succeeds with no errors.

**Step 3: Start dev server and verify**

Run: `pnpm run dev:3210`

Manual verification checklist:
- [ ] Visit `http://localhost:3210/ui-prompts` — page loads with empty state
- [ ] Visit `http://localhost:3210/ui-prompts/nonexistent` — redirects to gallery
- [ ] Search input works (debounced)
- [ ] Sort buttons toggle between Latest / Most Popular
- [ ] Tag filters render when prompts exist
- [ ] Nav header appears correctly

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues for ui-prompts minisite"
```

---

## Parallelization Guide

```
Phase 1: Tasks 1 → 2 (sequential, foundation)
Phase 2: Tasks 3, 4, 5, 6, 7 (all parallel, independent API routes)
Phase 3: Tasks 8, 9, 10 (8 first since 9+10 depend on components, then 9+10 parallel)
Phase 4: Tasks 11 → 12 (sequential, final integration)
```

**Subagent dispatch plan:**
- Agent A: Tasks 3+5 (list route with POST — same file)
- Agent B: Tasks 4+6 (detail route with PATCH/DELETE — same file)
- Agent C: Task 7 (upload route — independent file)
- Agent D: Task 8 (PhoneFrame + PromptCard — independent)
- Then after D completes:
- Agent E: Task 9 (gallery page)
- Agent F: Task 10 (detail page)
