# Creative Suite E2B Template — Design Spec

**Date:** 2026-03-10
**Status:** Approved

## Overview

Add a new E2B sandbox template called `creative-suite` based on the Flutter app at `/Users/rofi/Programing/flutter-grok-creative-studio/rn-app`. Uses the new E2B v2 template format (TypeScript builder API) instead of the deprecated `e2b.toml` + `e2b.Dockerfile` CLI approach.

## Approach

Option A: `fromDockerfile()` — wrap a new Dockerfile in the v2 `Template()` builder. Chosen because:
- The rn-app has complex `patch-package` postinstall setup best expressed in a Dockerfile
- Mirrors the proven expo-template pattern
- All Dockerfile instructions used (FROM, RUN, COPY, WORKDIR, USER, ENV) are supported by `fromDockerfile()`

## Directory Structure

```
packages/sandbox/
├── local-creative-suite-app/          ← symlink → /Users/rofi/Programing/flutter-grok-creative-studio/rn-app
└── templates/
    └── creative-suite-template/
        ├── e2b.Dockerfile             ← adapted from expo-template
        ├── template.ts                ← v2 Template definition
        ├── build.dev.ts               ← dev build (alias: creative-suite-dev, 2cpu/2048mb)
        └── build.prod.ts              ← prod build (alias: creative-suite, 4cpu/4096mb)
```

## Dockerfile Design

- Base: `imbios/bun-node:20-slim`
- COPY source: `local-creative-suite-app/` (symlink to rn-app)
- `bun install` triggers `postinstall` → `patch-package` applies 3 patches
- Patch verification after install
- Copies `templates/shared/executor.mjs` for Claude agent SDK runner
- Copies `get-structure.js` and `edit-file.js` from expo-template (shared helpers)
- Installs `@anthropic-ai/claude-agent-sdk` in `/claude-sdk`
- Same Metro cache, NODE_OPTIONS, ngrok setup as expo-template

## v2 Build Files

**template.ts** — reads `e2b.Dockerfile` and passes to `Template().fromDockerfile()`

**build.prod.ts:**
```ts
await Template.build(template, {
  alias: 'creative-suite',
  cpuCount: 4,
  memoryMB: 4096,
  onBuildLogs: defaultBuildLogger(),
})
```

**build.dev.ts:** same with `alias: 'creative-suite-dev'`, `cpuCount: 2`, `memoryMB: 2048`

## Package Scripts

In `packages/sandbox/package.json`:
```json
"build:sandbox:creative-suite": "pnpm copy:executor && npx tsx templates/creative-suite-template/build.prod.ts",
"build:sandbox:creative-suite:dev": "pnpm copy:executor && npx tsx templates/creative-suite-template/build.dev.ts"
```

## .gitignore

Add `local-creative-suite-app` — machine-local symlink, not committed.
