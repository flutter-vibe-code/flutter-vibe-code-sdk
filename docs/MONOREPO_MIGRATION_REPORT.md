# Turborepo Migration Report

## Overview

Migration of Flutter Vibe Code from monolithic Next.js to Turborepo monorepo structure.

**Date Started:** 2025-12-29
**Status:** Phases 1-4 Core Complete, Phase 5 IN PROGRESS (files copied to apps/web, imports not updated)

---

## Package Structure

```
/
├── apps/
│   ├── web/                    # ⚠️ IN PROGRESS (files copied, imports not updated)
│   └── mobile/                 # Flutter app (PENDING)
│
├── packages/
│   ├── tsconfig/               # ✅ COMPLETE
│   ├── types/                  # ✅ COMPLETE
│   ├── config/                 # ✅ COMPLETE
│   ├── ui/                     # ✅ COMPLETE
│   ├── pusher/                 # ✅ COMPLETE
│   ├── database/               # ✅ COMPLETE
│   ├── auth/                   # ✅ COMPLETE
│   ├── convex/                 # ✅ COMPLETE
│   ├── sandbox/                # ✅ COMPLETE (lib/skills)
│   └── chat/                   # ✅ COMPLETE (lib)
│
├── turbo.json                  # ✅ COMPLETE
├── pnpm-workspace.yaml         # ✅ COMPLETE
└── package.json                # ✅ UPDATED
```

---

## Phase 1: Infrastructure ✅ COMPLETE

### Files Created

| File | Purpose |
|------|---------|
| `/turbo.json` | Turborepo pipeline config |
| `/pnpm-workspace.yaml` | Workspace definition |
| `/packages/tsconfig/base.json` | Base TS config |
| `/packages/tsconfig/nextjs.json` | Next.js TS config |
| `/packages/tsconfig/react-library.json` | React library config |
| `/packages/tsconfig/package.json` | Package manifest |

---

## Phase 2: Shared Packages ✅ COMPLETE

### @flutter-vibe-code/types ✅
- **Location:** `packages/types/`
- **Exports:** TemplateConfig, Templates, ProjectStatus, SandboxStatus, etc.

### @flutter-vibe-code/config ✅
- **Location:** `packages/config/`
- **Exports:** CONFIG (plan limits), templates, TemplateId

### @flutter-vibe-code/ui ✅
- **Location:** `packages/ui/`
- **Contains:** 30+ shadcn/ui components
- **Exports:** All UI components, cn utility, useIsMobile hook
- **Note:** Import paths updated from `@/lib/utils` to `../lib/utils`

### @flutter-vibe-code/pusher ✅
- **Location:** `packages/pusher/`
- **Exports:**
  - `@flutter-vibe-code/pusher/server` - getPusherServer()
  - `@flutter-vibe-code/pusher/client` - getPusherClient()

### @flutter-vibe-code/database ✅
- **Location:** `packages/database/`
- **Contains:** Full Drizzle schema (19 tables), client
- **Exports:** db, all schema tables, drizzle operators
- **Dependencies:** @flutter-vibe-code/config

### @flutter-vibe-code/auth ✅
- **Location:** `packages/auth/`
- **Exports:**
  - Server: getUserTeam, getAuthHeaders
  - Client: authClient, signInWithGoogle, signOut, useSession
- **Note:** Better Auth config should stay in app (has email dependency)

### @flutter-vibe-code/convex ✅
- **Location:** `packages/convex/`
- **Contains:** management-api, provisioning, env-variables, sandbox-utils, types
- **Exports:** All Convex management functions
- **Dependencies:** @flutter-vibe-code/database, @flutter-vibe-code/pusher, @e2b/code-interpreter

---

## Phase 3: @flutter-vibe-code/sandbox ✅ CORE COMPLETE

### Created Files

**Package structure:**
- `packages/sandbox/package.json` - Package manifest with dependencies
- `packages/sandbox/tsconfig.json` - TypeScript config
- `packages/sandbox/src/index.ts` - Main exports

**Library files (packages/sandbox/src/lib/):**
- ✅ `sandbox-file-watcher.ts` - E2B file watching
- ✅ `github-service.ts` - GitHub integration
- ✅ `error-tracker.ts` - Error tracking utility
- ✅ `bundle-builder.ts` - Static bundle building (updated imports)
- ✅ `generate-manifest.ts` - Expo manifest generation
- ✅ `server-utils.ts` - Flutter server utilities (updated imports)
- ✅ `index.ts` - Library exports

**Skills (packages/sandbox/src/skills/):**
- ✅ `config.ts` - Skill configuration
- ✅ `index.ts` - Skills exports
- ✅ `templates/` - All skill templates (anthropic-chat, openai-dalle-3, etc.)

**Templates:**
- ✅ `packages/sandbox/templates/` - Copied from sandbox-templates/

### Remaining for Phase 5

**Library files still in `lib/`:**
- `claude-code-service.ts` (745 lines - main orchestration)
- `claude-code-handler.ts`
- `bundle-cleanup.ts`
- `file-cache.ts` (client-side IndexedDB)
- `file-change-stream.ts`
- `cloudflare-deploy.ts`
- `cloudflare-custom-domain.ts`
- `app-config-updater.ts`

**API Routes (~25) from `app/(app)/api/`:**
- `create-container/route.ts`
- `sandbox/route.ts`
- `sandbox/pause/route.ts`
- `sandbox-status/route.ts`
- `sandbox-edit/route.ts`
- `sandbox-structure/route.ts`
- `check-sandbox/route.ts`
- `resume-container/route.ts`
- `recreate-container/route.ts`
- `recreate-sandbox/route.ts`
- `start-server/route.ts`
- `restart-server/route.ts`
- `server-status/route.ts`
- `check-expo-server/route.ts`
- `file-watch/route.ts`
- `file-changes/route.ts`
- `git-commits/route.ts`
- `git-restore/route.ts`
- `github-commit/route.ts`
- `ngrok-serve/route.ts`
- `ngrok-backup-server/route.ts`
- `check-ngrok-health/route.ts`
- `hover-mode-toggle/route.ts`
- `hover-selection/route.ts`
- `assets/*`
- `eas/*`
- `deploy/*`
- `cloud/*`
- `update-executor/[sandboxId]/route.ts`

**Components from `components/`:**
- `preview-panel.tsx`
- `code-panel.tsx`
- `backend-panel.tsx`
- `assets-panel.tsx`
- `cloud-panel.tsx`
- `cloud-sidebar-panel.tsx`
- `history-panel.tsx`
- `deploy-dialog.tsx`
- `restore-confirmation-modal.tsx`
- `project-settings-modal.tsx`

**Hooks from `hooks/`:**
- `useFileChangeEvents.ts`
- `useNgrokHealthCheck.ts`
- `usePusherHoverSelection.ts`
- `useErrorNotifications.tsx`

**Templates:**
- Move `sandbox-templates/` → `packages/sandbox/templates/`

### Package Dependencies
```json
{
  "dependencies": {
    "@flutter-vibe-code/database": "workspace:*",
    "@flutter-vibe-code/auth": "workspace:*",
    "@flutter-vibe-code/config": "workspace:*",
    "@flutter-vibe-code/types": "workspace:*",
    "@flutter-vibe-code/pusher": "workspace:*",
    "@flutter-vibe-code/convex": "workspace:*",
    "@flutter-vibe-code/ui": "workspace:*",
    "@e2b/code-interpreter": "2.1.0",
    "@anthropic-ai/claude-code": "^1.0.31"
  }
}
```

---

## Phase 4: @flutter-vibe-code/chat ✅ CORE COMPLETE

### Created Files

**Package structure:**
- `packages/chat/package.json` - Package manifest with AI SDK dependencies
- `packages/chat/tsconfig.json` - TypeScript config
- `packages/chat/src/index.ts` - Main exports

**Library files (packages/chat/src/lib/):**
- ✅ `chat-config.ts` - Chat history limit config
- ✅ `message-usage.ts` - Usage tracking (updated imports)
- ✅ `models.ts` - LLM model client creation
- ✅ `index.ts` - Library exports

### Remaining for Phase 5

**Library files still in `lib/`:**
- (None - all moved)

**API Routes from `app/(app)/api/`:**
- `chat/route.ts` (467 lines - main handler)
- `chat/history/route.ts`
- `transcribe/route.ts`

**Components from `components/`:**
- `chat-panel.tsx`
- `chat-panel-input.tsx`
- `chat-input.tsx`
- `chat-picker.tsx`
- `chat-settings.tsx`
- `claude-code-message.tsx`
- `claude-model-selector.tsx`
- `rate-limit-card.tsx`
- `skills-dropdown.tsx`
- `chat/*` (subdirectory)

**Hooks from `hooks/`:**
- `useChatHistory.ts`
- `useStreamRecovery.ts`

### Package Dependencies
```json
{
  "dependencies": {
    "@flutter-vibe-code/database": "workspace:*",
    "@flutter-vibe-code/auth": "workspace:*",
    "@flutter-vibe-code/config": "workspace:*",
    "@flutter-vibe-code/types": "workspace:*",
    "@flutter-vibe-code/pusher": "workspace:*",
    "@flutter-vibe-code/ui": "workspace:*",
    "@flutter-vibe-code/sandbox": "workspace:*",
    "@ai-sdk/react": "1.2.11",
    "ai": "^4.3.16"
  }
}
```

---

## Phase 5: App Migration ⚠️ IN PROGRESS

### apps/web - Current State

**Completed:**
- ✅ Created `apps/web/` directory
- ✅ Created `apps/web/package.json` with all workspace dependencies
- ✅ Created `apps/web/tsconfig.json` extending @flutter-vibe-code/tsconfig/nextjs
- ✅ Copied config files: `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `components.json`, `eslint.config.mjs`, `payload.config.ts`, `payload-types.ts`
- ✅ Copied directories: `app/`, `components/`, `context/`, `hooks/`, `lib/`, `prompt-engine/`, `public/`

**NOT YET DONE:**
- ❌ Update imports to use @flutter-vibe-code/* packages
- ❌ Remove duplicated code that now lives in packages
- ❌ Delete original root-level directories (app/, components/, etc.)
- ❌ Run pnpm install to link workspaces
- ❌ Test build

### Original Instructions (for reference)

1. Create `apps/web/` directory
2. Move from root:
   - `app/` → `apps/web/app/`
   - `components/` (non-package) → `apps/web/components/`
   - `context/` → `apps/web/context/`
   - `hooks/` (non-package) → `apps/web/hooks/`
   - `next.config.mjs` → `apps/web/`
   - `tailwind.config.ts` → `apps/web/`
   - `postcss.config.js` → `apps/web/`

3. Create `apps/web/package.json`:
```json
{
  "name": "@flutter-vibe-code/web",
  "dependencies": {
    "@flutter-vibe-code/ui": "workspace:*",
    "@flutter-vibe-code/database": "workspace:*",
    "@flutter-vibe-code/auth": "workspace:*",
    "@flutter-vibe-code/config": "workspace:*",
    "@flutter-vibe-code/pusher": "workspace:*",
    "@flutter-vibe-code/convex": "workspace:*",
    "@flutter-vibe-code/sandbox": "workspace:*",
    "@flutter-vibe-code/chat": "workspace:*",
    "next": "16.1.0-canary.21",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  }
}
```

4. Update all API routes to use package handlers:
```typescript
// apps/web/app/(app)/api/chat/route.ts
import { handleChat } from '@flutter-vibe-code/chat/api'
export const POST = handleChat
```

### apps/mobile

1. Move `mobile/` → `apps/mobile/`
2. Update package.json to use workspace dependencies

---

## API Route Pattern

Packages export handler functions:

```typescript
// packages/sandbox/src/api/create-container.ts
export async function handleCreateContainer(req: Request): Promise<Response> {
  // Implementation
}
```

Apps consume handlers:

```typescript
// apps/web/app/(app)/api/create-container/route.ts
import { handleCreateContainer } from '@flutter-vibe-code/sandbox/api'
export const POST = handleCreateContainer
export const maxDuration = 120
```

---

## Import Path Changes

| Old Import | New Import |
|------------|------------|
| `@/lib/utils` | `@flutter-vibe-code/ui` or `../lib/utils` |
| `@/lib/db` | `@flutter-vibe-code/database` |
| `@/lib/db/schema` | `@flutter-vibe-code/database/schema` |
| `@/lib/pusher` | `@flutter-vibe-code/pusher` |
| `@/lib/config` | `@flutter-vibe-code/config` |
| `@/lib/auth/*` | `@flutter-vibe-code/auth` |
| `@/lib/convex/*` | `@flutter-vibe-code/convex` |
| `@/components/ui/*` | `@flutter-vibe-code/ui` |

---

## Remaining Work Estimate

| Phase | Status | Remaining |
|-------|--------|-----------|
| Phase 3 (sandbox) | ✅ Core Complete | API routes, components, hooks in Phase 5 |
| Phase 4 (chat) | ✅ Core Complete | API routes, components, hooks in Phase 5 |
| Phase 5 (apps) | ⚠️ In Progress | Import updates, delete duplicates, test build |
| Testing & Fixes | ❌ Pending | Verify all packages work together |

### Next Session: Phase 5 Remaining Steps

1. **Update imports in apps/web/** - Change `@/lib/db` → `@flutter-vibe-code/database`, etc.
2. **Remove duplicate lib files** - Delete files from `apps/web/lib/` that are now in packages
3. **Update pnpm-workspace.yaml** - Add `apps/*` to workspace packages
4. **Run pnpm install** - Link all workspace packages
5. **Test build** - Run `pnpm build` to verify everything works
6. **Clean up root** - Delete original `app/`, `components/`, etc. directories from root

---

## Commands After Migration

```bash
# Development
pnpm dev                    # Run all
pnpm dev --filter=@flutter-vibe-code/web  # Run web only

# Building
pnpm build

# Database
pnpm db:generate
pnpm db:migrate
pnpm db:studio

# Sandbox templates
pnpm build:sandbox:expo
pnpm build:sandbox:tamagui
pnpm build:sandbox:github
```

---

## Notes

1. **Auth config** stays in app due to email service dependency
2. **E2B types** (ExecutionResult) should stay in @flutter-vibe-code/sandbox (has @e2b dependency)
3. **Model client creation** (models.ts) goes to @flutter-vibe-code/chat (has AI SDK dependencies)
4. Run `pnpm install` after creating packages to link workspaces
5. May need to update tsconfig paths in each package

---

---

## Implementation Instructions

### Phase 3: Implement @flutter-vibe-code/sandbox

```bash
# 1. Create directory
mkdir -p packages/sandbox/src/{api,lib,components,hooks}

# 2. Create package.json (see dependencies above)

# 3. Copy library files
cp lib/sandbox-file-watcher.ts packages/sandbox/src/lib/
cp lib/claude-code-service.ts packages/sandbox/src/lib/
cp lib/claude-code-handler.ts packages/sandbox/src/lib/
cp lib/bundle-builder.ts packages/sandbox/src/lib/
cp lib/file-cache.ts packages/sandbox/src/lib/
cp lib/file-change-stream.ts packages/sandbox/src/lib/
cp lib/github-service.ts packages/sandbox/src/lib/
cp lib/server-utils.ts packages/sandbox/src/lib/
cp -r lib/skills packages/sandbox/src/lib/

# 4. Copy templates
cp -r sandbox-templates packages/sandbox/templates

# 5. Update imports in copied files:
# - @/lib/db → @flutter-vibe-code/database
# - @/lib/pusher → @flutter-vibe-code/pusher
# - @/lib/config → @flutter-vibe-code/config

# 6. Create API handlers from routes
# Extract logic from each route.ts into handler functions

# 7. Create index.ts with exports
```

### Phase 4: Implement @flutter-vibe-code/chat

```bash
# 1. Create directory
mkdir -p packages/chat/src/{api,lib,components,hooks}

# 2. Create package.json (see dependencies above)

# 3. Copy library files
cp lib/chat-config.ts packages/chat/src/lib/
cp lib/message-usage.ts packages/chat/src/lib/
cp lib/models.ts packages/chat/src/lib/

# 4. Copy components
cp components/chat-panel.tsx packages/chat/src/components/
cp components/chat-panel-input.tsx packages/chat/src/components/
cp components/chat-input.tsx packages/chat/src/components/
cp -r components/chat packages/chat/src/components/

# 5. Copy hooks
cp hooks/useChatHistory.ts packages/chat/src/hooks/
cp hooks/useStreamRecovery.ts packages/chat/src/hooks/

# 6. Update imports:
# - @/lib/* → @flutter-vibe-code/*
# - @/components/ui/* → @flutter-vibe-code/ui

# 7. Extract API handlers from app/(app)/api/chat/route.ts
```

### Phase 5: Migrate Apps

```bash
# 1. Create apps directory structure
mkdir -p apps/web apps/mobile

# 2. Move Next.js app
mv app apps/web/
mv next.config.mjs apps/web/
mv tailwind.config.ts apps/web/
mv postcss.config.js apps/web/

# 3. Move remaining components (non-package)
mv components apps/web/  # What's left after package extraction
mv context apps/web/
mv hooks apps/web/       # What's left after package extraction

# 4. Create apps/web/package.json with all workspace deps

# 5. Create apps/web/tsconfig.json extending @flutter-vibe-code/tsconfig/nextjs

# 6. Update all imports to use @flutter-vibe-code/* packages

# 7. Update API routes to import handlers from packages

# 8. Move mobile/ to apps/mobile/

# 9. Run pnpm install to link workspaces

# 10. Test: pnpm dev --filter=@flutter-vibe-code/web
```

---

## Quick Reference: Key Files

| File | Location | Purpose |
|------|----------|---------|
| `claude-code-service.ts` | lib/ | Main sandbox orchestration (745 lines) |
| `chat/route.ts` | app/(app)/api/ | Main chat handler (467 lines) |
| `schema.ts` | packages/database/src/ | Database schema (19 tables) |
| `auth/config.ts` | lib/ | Better Auth config (stays in app) |

---

## Reference: Plan File

Full plan available at: `/Users/rofi/.claude/plans/resilient-sprouting-boot.md`
