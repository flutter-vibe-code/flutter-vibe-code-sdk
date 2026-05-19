# Creative Suite E2B Template Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a new E2B sandbox template called `creative-suite` using the v2 TypeScript builder format, based on the Flutter app at `/Users/rofi/Programing/flutter-grok-creative-studio/rn-app`.

**Architecture:** Use `Template().fromDockerfile()` (v2 builder API) wrapping a new `e2b.Dockerfile` adapted from the expo-template pattern. The rn-app is made available to the Docker build context via a local symlink at `packages/sandbox/local-creative-suite-app`. Build scripts (`build.dev.ts`, `build.prod.ts`) call `Template.build()` with alias `creative-suite-dev` / `creative-suite`.

**Tech Stack:** E2B v2 SDK (`e2b`), TypeScript, `tsx`, Bun, Docker (imbios/bun-node:20-slim), patch-package, `@anthropic-ai/claude-agent-sdk`

**Spec:** `docs/superpowers/specs/2026-03-10-creative-suite-e2b-template-design.md`

---

## File Map

| Action   | Path                                                                             | Purpose                                      |
|----------|----------------------------------------------------------------------------------|----------------------------------------------|
| Create   | `packages/sandbox/local-creative-suite-app` (symlink)                           | Points to rn-app at its current local path   |
| Create   | `packages/sandbox/templates/creative-suite-template/e2b.Dockerfile`             | Container definition adapted from expo       |
| Create   | `packages/sandbox/templates/creative-suite-template/template.ts`                | v2 Template definition via fromDockerfile    |
| Create   | `packages/sandbox/templates/creative-suite-template/build.dev.ts`               | Dev build script (creative-suite-dev)        |
| Create   | `packages/sandbox/templates/creative-suite-template/build.prod.ts`              | Prod build script (creative-suite)           |
| Create   | `packages/sandbox/templates/creative-suite-template/get-structure.js`           | File structure helper (copied from expo)     |
| Create   | `packages/sandbox/templates/creative-suite-template/edit-file.js`               | File edit helper (copied from expo)          |
| Modify   | `packages/sandbox/package.json`                                                  | Add build:sandbox:creative-suite scripts     |
| Modify   | `.gitignore` (root)                                                              | Ignore local-creative-suite-app symlink      |

---

## Chunk 1: Symlink, .gitignore, helpers

### Task 1: Create local-creative-suite-app symlink and update .gitignore

**Files:**
- Create: `packages/sandbox/local-creative-suite-app` (symlink)
- Modify: `.gitignore` (root)

- [ ] **Step 1: Create the symlink**

  Run from repo root:
  ```bash
  cd packages/sandbox && ln -s /Users/rofi/Programing/flutter-grok-creative-studio/rn-app local-creative-suite-app
  ```

  Verify:
  ```bash
  ls -la packages/sandbox/local-creative-suite-app
  # Should show: local-creative-suite-app -> /Users/rofi/Programing/flutter-grok-creative-studio/rn-app
  ls packages/sandbox/local-creative-suite-app/package.json
  # Should show the file
  ```

- [ ] **Step 2: Add symlink to root .gitignore**

  Add to the root `.gitignore` (after the existing `local-expo-app` entry if present, otherwise at the end of the misc section):
  ```
  # Local sandbox app symlinks (machine-specific)
  packages/sandbox/local-creative-suite-app
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add .gitignore
  git commit -m "chore: add local-creative-suite-app to .gitignore"
  ```
  (Do NOT `git add` the symlink itself — it should be untracked.)

---

### Task 2: Add get-structure.js and edit-file.js to creative-suite-template

These are identical to the expo-template versions (no changes needed).

**Files:**
- Create: `packages/sandbox/templates/creative-suite-template/get-structure.js`
- Create: `packages/sandbox/templates/creative-suite-template/edit-file.js`

- [ ] **Step 1: Create template directory and copy helper scripts**

  ```bash
  mkdir -p packages/sandbox/templates/creative-suite-template
  cp packages/sandbox/templates/expo-template/get-structure.js \
     packages/sandbox/templates/creative-suite-template/get-structure.js
  cp packages/sandbox/templates/expo-template/edit-file.js \
     packages/sandbox/templates/creative-suite-template/edit-file.js
  ```

- [ ] **Step 2: Verify copy**

  ```bash
  diff packages/sandbox/templates/expo-template/get-structure.js \
       packages/sandbox/templates/creative-suite-template/get-structure.js
  # Should show no diff
  diff packages/sandbox/templates/expo-template/edit-file.js \
       packages/sandbox/templates/creative-suite-template/edit-file.js
  # Should show no diff
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add packages/sandbox/templates/creative-suite-template/
  git commit -m "feat(creative-suite): add helper scripts"
  ```

---

## Chunk 2: Dockerfile

### Task 3: Create e2b.Dockerfile for creative-suite-template

This is adapted from `packages/sandbox/templates/expo-template/e2b.Dockerfile`. Key differences:
- All `local-expo-app/` references → `local-creative-suite-app/`
- The `ngrokurl` patch verification still applies (rn-app has the same `@expo+cli` patch)

**Files:**
- Create: `packages/sandbox/templates/creative-suite-template/e2b.Dockerfile`

- [ ] **Step 1: Create the Dockerfile**

  Create `packages/sandbox/templates/creative-suite-template/e2b.Dockerfile` with this content:

  ```dockerfile
  # Use imbios/bun-node image which comes with both Node.js and Bun pre-installed
  FROM imbios/bun-node:20-slim

  # Fix dpkg issues and install system dependencies
  RUN apt-get clean && \
      rm -rf /var/lib/apt/lists/* && \
      apt-get update && \
      apt-get install -y --no-install-recommends --fix-broken \
      git \
      curl \
      wget \
      unzip \
      zip \
      ca-certificates \
      sudo \
      && rm -rf /var/lib/apt/lists/*

  # Create user if it doesn't exist and set up sudo
  RUN if ! id user > /dev/null 2>&1; then \
          useradd -m -s /bin/bash user && \
          echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers; \
      fi

  # Install ngrok
  RUN wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz \
      && tar -xzf ngrok-v3-stable-linux-amd64.tgz \
      && mv ngrok /usr/local/bin/ \
      && rm ngrok-v3-stable-linux-amd64.tgz

  # Set working directory
  WORKDIR /home/user

  # Create app directory and set ownership
  RUN mkdir -p /home/user/app && chown -R user:user /home/user/app

  # Change to app directory
  WORKDIR /home/user/app

  # First, copy only package.json and bun.lock to leverage Bun's global cache
  COPY --chown=user:user local-creative-suite-app/package.json local-creative-suite-app/bun.lock* ./

  # Verify patches directory exists and copy it before bun install
  COPY --chown=user:user local-creative-suite-app/patches ./patches/
  RUN ls -la patches/ && echo "✅ Patches directory found"

  # Switch to user for bun operations
  USER user

  # Pre-install dependencies to populate Bun's global cache
  RUN bun install

  # Switch back to root for file operations
  USER root

  # Now copy the rest of the local creative suite app (excluding node_modules)
  COPY --chown=user:user local-creative-suite-app/ ./
  RUN rm -rf node_modules

  # Ensure temp directories are writable for bun
  RUN mkdir -p /tmp/bun-cache && chmod 777 /tmp/bun-cache
  ENV BUN_INSTALL_CACHE_DIR=/tmp/bun-cache

  # Switch to user for bun operations
  USER user

  # Run bun install again (will be instant due to cache)
  RUN bun install

  # Verify @expo/cli patch was applied (--ngrokurl arg added by patch)
  RUN grep -q "ngrokurl" node_modules/@expo/cli/build/bin/cli && \
      echo "✅ Patch successfully applied!" || \
      (echo "❌ Patch NOT applied!" && exit 1)

  # Switch back to root
  USER root

  # Expose the default Expo port
  EXPOSE 8081

  # Create claude-sdk directory in container root with proper permissions
  WORKDIR /claude-sdk
  RUN chmod 755 /claude-sdk && chown user:user /claude-sdk

  # Switch to user for bun operations
  USER user

  # Initialize bun project for claude-sdk
  RUN bun init -y

  # Install dependencies for claude-sdk
  RUN bun install @anthropic-ai/claude-agent-sdk execa

  # Create and set permissions for Metro cache directory
  RUN mkdir -p /tmp/metro-cache
  USER root
  RUN chmod 777 /tmp/metro-cache
  USER user
  ENV TMPDIR=/tmp/metro-cache

  # Increase Node.js memory limit
  ENV NODE_OPTIONS="--max_old_space_size=4096"

  # Install expo/ngrok
  RUN bun install @expo/ngrok

  # Install dev dependencies for claude-sdk
  RUN bun install --dev @types/node@^24.0.3

  # Switch back to root for file operations
  USER root

  # Copy the pre-built standalone executor bundle
  COPY templates/shared/executor.mjs executor.mjs

  # Copy the structure script
  COPY templates/creative-suite-template/get-structure.js get-structure.js

  # Copy the edit file script
  COPY templates/creative-suite-template/edit-file.js edit-file.js

  # Add start script to package.json
  RUN node -e "const pkg = require('./package.json'); pkg.scripts = pkg.scripts || {}; pkg.scripts.start = 'node executor.mjs'; pkg.scripts['get-structure'] = 'node get-structure.js'; pkg.scripts['edit-file'] = 'node edit-file.js'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

  # Pre-create generated_code directory with proper permissions
  RUN mkdir -p /claude-sdk/generated_code && chmod 755 /claude-sdk/generated_code && chown -R user:user /claude-sdk

  # Pre-create .claude settings directory so the SDK doesn't fail on write
  RUN mkdir -p /home/user/.claude && chown -R user:user /home/user/.claude

  # Install OpenCode CLI
  RUN npm i -g opencode-ai@latest && \
      which opencode && opencode version || echo "opencode install warning: binary not found after npm install"

  # Pre-create OpenCode config directory
  RUN mkdir -p /home/user/.config/opencode && chown -R user:user /home/user/.config/opencode

  # Return to app directory and switch to user
  WORKDIR /home/user/app
  USER user
  ```

- [ ] **Step 2: Verify Dockerfile syntax (dry run)**

  ```bash
  # Quick check that Docker can parse the file (no build yet)
  docker build --no-cache --dry-run \
    -f packages/sandbox/templates/creative-suite-template/e2b.Dockerfile \
    packages/sandbox/ 2>&1 | head -20 || echo "docker dry-run not supported on this version, skipping"
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add packages/sandbox/templates/creative-suite-template/e2b.Dockerfile
  git commit -m "feat(creative-suite): add Dockerfile"
  ```

---

## Chunk 3: v2 TypeScript build files

### Task 4: Create template.ts

**Files:**
- Create: `packages/sandbox/templates/creative-suite-template/template.ts`

- [ ] **Step 1: Create template.ts**

  Create `packages/sandbox/templates/creative-suite-template/template.ts`:

  ```typescript
  import { Template } from 'e2b'
  import { readFileSync } from 'fs'
  import { join } from 'path'

  const dockerfile = readFileSync(
    join(__dirname, 'e2b.Dockerfile'),
    'utf-8'
  )

  export const template = Template().fromDockerfile(dockerfile)
  ```

  > **Note:** `__dirname` resolves to the `creative-suite-template/` directory. When `Template.build()` runs, the Docker build context is the CWD of the process (i.e., `packages/sandbox/` when run via pnpm scripts), which is where `local-creative-suite-app/` and `templates/` are accessible for COPY instructions.

- [ ] **Step 2: Commit**

  ```bash
  git add packages/sandbox/templates/creative-suite-template/template.ts
  git commit -m "feat(creative-suite): add v2 template definition"
  ```

---

### Task 5: Create build.dev.ts and build.prod.ts

**Files:**
- Create: `packages/sandbox/templates/creative-suite-template/build.dev.ts`
- Create: `packages/sandbox/templates/creative-suite-template/build.prod.ts`

- [ ] **Step 1: Create build.dev.ts**

  Create `packages/sandbox/templates/creative-suite-template/build.dev.ts`:

  ```typescript
  import 'dotenv/config'
  import { Template, defaultBuildLogger } from 'e2b'
  import { template } from './template'

  async function main() {
    await Template.build(template, {
      alias: 'creative-suite-dev',
      cpuCount: 2,
      memoryMB: 2048,
      onBuildLogs: defaultBuildLogger(),
    })
  }

  main().catch(console.error)
  ```

- [ ] **Step 2: Create build.prod.ts**

  Create `packages/sandbox/templates/creative-suite-template/build.prod.ts`:

  ```typescript
  import 'dotenv/config'
  import { Template, defaultBuildLogger } from 'e2b'
  import { template } from './template'

  async function main() {
    await Template.build(template, {
      alias: 'creative-suite',
      cpuCount: 4,
      memoryMB: 4096,
      onBuildLogs: defaultBuildLogger(),
    })
  }

  main().catch(console.error)
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add packages/sandbox/templates/creative-suite-template/build.dev.ts \
          packages/sandbox/templates/creative-suite-template/build.prod.ts
  git commit -m "feat(creative-suite): add v2 build scripts"
  ```

---

## Chunk 4: Package scripts and wiring

### Task 6: Add build scripts to packages/sandbox/package.json

**Files:**
- Modify: `packages/sandbox/package.json`

- [ ] **Step 1: Add scripts**

  In `packages/sandbox/package.json`, add to the `scripts` object (after the existing `build:sandbox:flutter-test` entry):

  ```json
  "build:sandbox:creative-suite": "pnpm copy:executor && npx tsx templates/creative-suite-template/build.prod.ts",
  "build:sandbox:creative-suite:dev": "pnpm copy:executor && npx tsx templates/creative-suite-template/build.dev.ts"
  ```

  Final scripts block should look like:
  ```json
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "type-check": "tsc --noEmit",
    "copy:executor": "mkdir -p templates/shared && cp ../agent/dist/standalone.mjs templates/shared/executor.mjs",
    "build:sandbox:expo": "pnpm copy:executor && e2b template build --config templates/expo-template/e2b.toml --name 'capsule-expo-sandbox'",
    "build:sandbox:tamagui": "e2b template build --config templates/tamagui-template/e2b.toml --name 'capsule-tamagui-sandbox'",
    "build:sandbox:github": "pnpm copy:executor && e2b template build --config templates/github-template/e2b.toml --name 'capsule-github-sandbox'",
    "build:sandbox:flutter-test": "pnpm copy:executor && e2b template build --config templates/expo-template/e2b-testing.toml --name 'flutter-test'",
    "build:sandbox:creative-suite": "pnpm copy:executor && npx tsx templates/creative-suite-template/build.prod.ts",
    "build:sandbox:creative-suite:dev": "pnpm copy:executor && npx tsx templates/creative-suite-template/build.dev.ts"
  }
  ```

- [ ] **Step 2: Verify the scripts are valid JSON**

  ```bash
  node -e "JSON.parse(require('fs').readFileSync('packages/sandbox/package.json', 'utf8')); console.log('✅ Valid JSON')"
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add packages/sandbox/package.json
  git commit -m "feat(creative-suite): add build scripts to package.json"
  ```

---

### Task 7: Verify full build (smoke test)

This task validates the template can be built end-to-end. Requires E2B API key set in env.

- [ ] **Step 1: Ensure executor is built**

  ```bash
  # Check if executor exists; if not, build it
  ls packages/sandbox/templates/shared/executor.mjs || \
    (cd packages/sandbox && pnpm copy:executor)
  ```

- [ ] **Step 2: Run dev build**

  From repo root:
  ```bash
  cd packages/sandbox && pnpm build:sandbox:creative-suite:dev
  ```

  Expected: Build logs stream to console, ends with template alias `creative-suite-dev` and a template ID printed.

- [ ] **Step 3: Confirm template appears in E2B dashboard or via CLI**

  ```bash
  e2b template list | grep creative-suite
  # Should show: creative-suite-dev   <template-id>
  ```

- [ ] **Step 4: Final commit (if any fixups were needed)**

  ```bash
  git add -p  # stage only fixups
  git commit -m "fix(creative-suite): address build issues"
  ```

---

## Summary

After all tasks complete:
- `creative-suite-dev` template available on E2B (dev, 2cpu/2gb)
- `creative-suite` template available on E2B (prod, 4cpu/4gb) after running `build:sandbox:creative-suite`
- The rn-app (with its patches, go_router, and full deps) is baked into the sandbox image
- The Claude agent SDK executor is pre-installed at `/claude-sdk`
- Build is triggered via `pnpm build:sandbox:creative-suite[:dev]` from the `packages/sandbox/` directory
