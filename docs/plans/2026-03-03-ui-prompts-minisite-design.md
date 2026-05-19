# UI Prompts Minisite Design

**Date**: 2026-03-03
**Status**: Approved

## Overview

A curated gallery minisite at `/ui-prompts` showcasing AI prompts that generate good-looking Flutter UIs. Inspired by Mobbin's design gallery — dark themed, card-based grid with phone frame mockups, search, tag filtering, and sorting.

## Decisions

- **Content source**: Admin-only (seeded via API, no community submissions)
- **Remix action**: Each prompt has a `remixUrl` field; Remix button is an external link
- **Detail layout**: Side-by-side (screenshots left ~60%, details right ~40%)
- **Asset storage**: Vercel Blob under `ui-prompts/` prefix (already in use in project)
- **Filters**: Tag pills + sort (Latest / Most Popular). No platform tabs.
- **Auth-gating**: Prompt text hidden for unauthenticated users; "Login to get prompt" button triggers existing Google OAuth flow

## Database Schema

New table in `packages/database/src/schema.ts`:

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
```

Tags stored as JSON array — appropriate for admin-only curated collection. No join table needed.

## Pages

### Gallery Page — `/ui-prompts`

- Reuses site nav-header (logo, nav, auth)
- Hero section: "UI Prompt Gallery" title + search bar
- Tag filter pills (horizontal scroll) + Sort dropdown (Latest / Most Popular)
- 4-column responsive grid (1→2→3→4 cols at breakpoints)
- Dark background (`bg-neutral-950`), cards with dark borders, hover elevation
- Each card: phone frame thumbnail, title, description snippet, tags, badges (Featured/New)
- Load-more pagination

### Detail Page — `/ui-prompts/[slug]`

- Side-by-side layout
- **Left (~60%)**: Scrollable screenshot gallery with phone frame mockups + optional video preview
- **Right (~40%)**:
  - Title, description, tag pills
  - Prompt section: "Login to get prompt" button (unauthenticated) or code block with copy button (authenticated)
  - "Try this design now →" Remix CTA button linking to `remixUrl`
  - View count

## API Routes

All under `app/(app)/api/ui-prompts/`:

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/ui-prompts` | Public | List with search, tag filter, sort, pagination |
| GET | `/api/ui-prompts/[slug]` | Public* | Detail (prompt text only if authenticated) |
| POST | `/api/ui-prompts` | Admin | Create new prompt |
| PATCH | `/api/ui-prompts/[slug]` | Admin | Update prompt |
| DELETE | `/api/ui-prompts/[slug]` | Admin | Delete prompt |
| POST | `/api/ui-prompts/upload` | Admin | Upload to Vercel Blob under `ui-prompts/` |

*View count incremented on GET detail.

## Components

| Component | Description |
|-----------|-------------|
| `PromptCard` | Gallery card with thumbnail in phone frame, title, badges |
| `PromptGrid` | Responsive grid layout |
| `PromptSearch` | Debounced search input |
| `PromptTagFilter` | Horizontal scrollable tag pills |
| `PromptSortSelect` | Dropdown: Latest / Most Popular |
| `PromptDetail` | Side-by-side detail layout |
| `ScreenshotGallery` | Scrollable phone mockup gallery |
| `PromptCodeBlock` | Auth-gated prompt display with copy button |
| `PhoneFrame` | Reusable phone frame wrapper |

## Visual Style

- Dark theme: `bg-neutral-950` background
- Cards: subtle dark borders (`border-neutral-800`), rounded-xl, hover elevation
- Phone frame mockups wrapping screenshots
- Inter font (existing)
- Green accent for CTAs (matching brand)
- Responsive: 1 col mobile → 2 col tablet → 3-4 col desktop

## Auth-Gating Flow

1. API checks session via `auth.api.getSession()`
2. If no session: returns `prompt: null` in response
3. Client renders "Login to get prompt" button → triggers `signInWithGoogle()`
4. After auth: prompt text shows in styled code block with copy button

## Admin Workflow

1. Upload screenshots/video via `POST /api/ui-prompts/upload` → returns Vercel Blob URLs
2. Create prompt via `POST /api/ui-prompts` with all fields including blob URLs
3. Prompt appears in gallery immediately
