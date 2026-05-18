# Flutter Vibe Code E2B sandbox template
# Base: imbios/bun-node (same as expo-template — has both bun and node)
FROM imbios/bun-node:20-slim

ENV DEBIAN_FRONTEND=noninteractive \
    FLUTTER_VERSION=3.29.0 \
    FLUTTER_HOME=/opt/flutter \
    NODE_OPTIONS="--max_old_space_size=4096"

# System deps for Flutter + Chromium for web rendering
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get update -o Acquire::AllowInsecureRepositories=true && \
    apt-get install -y --allow-unauthenticated gnupg ca-certificates && \
    apt-get update && \
    apt-get install -y --no-install-recommends --fix-broken \
      git curl wget unzip zip xz-utils sudo \
      libglu1-mesa chromium \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 (needed for OmniRoute proxy)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    node --version && npm --version

# Usuario E2B standard
RUN if ! id user > /dev/null 2>&1; then \
      useradd -m -s /bin/bash user && \
      echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers; \
    fi

# =====================================================
# Cloudflare Tunnel (cloudflared) for public preview URLs
# =====================================================
RUN curl -fsSL -o /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 && \
    chmod +x /usr/local/bin/cloudflared && \
    cloudflared version

# Copy Flutter Claude skills
COPY .claude-skills/ /home/user/.claude/skills/
RUN chown -R user:user /home/user/.claude/skills

# Flutter stable channel (3.29+ — Flutter SDK self-checks origin/main, so we
# clone the `stable` branch to keep that ref available).
RUN git clone --depth 1 --branch stable https://github.com/flutter/flutter.git ${FLUTTER_HOME} \
    && cd ${FLUTTER_HOME} \
    && git remote set-head origin stable \
    && chown -R user:user ${FLUTTER_HOME}

# PATH global para Flutter + bun + node
ENV PATH="/opt/flutter/bin:/opt/flutter/bin/cache/dart-sdk/bin:/root/.bun/bin:/home/user/.bun/bin:${PATH}"
ENV CHROME_EXECUTABLE=/usr/bin/chromium
ENV PUB_CACHE=/home/user/.pub-cache

# App directory
RUN mkdir -p /home/user/app && chown -R user:user /home/user/app

# Precache Flutter web target + scaffold demo project as user
USER user
WORKDIR /home/user

RUN git config --global --add safe.directory ${FLUTTER_HOME} \
    && flutter config --no-analytics \
    && flutter config --enable-web \
    && flutter precache --web --no-ios --no-android --no-linux --no-macos --no-windows \
    && flutter --version

# Scaffold a real cross-platform Flutter project. Even though preview runs on
# web, the generated code targets web + Android + iOS so users can ship to
# stores from the same codebase.
RUN flutter create --platforms=web,android,ios --org=vibe /home/user/app \
    && cd /home/user/app \
    && flutter pub get

# Patch web/index.html to monkey-patch WebSocket so dwds (Flutter web debug)
# upgrades ws:// → wss:// when the page is served over HTTPS. Without this,
# the iframe (HTTPS via E2B) blocks DDS as Mixed Content and Flutter web
# debug renders a blank screen. Survives `flutter run` rebuilds; only
# `flutter create` would overwrite it.
USER root
RUN python3 -c "import sys; f='/home/user/app/web/index.html'; s=open(f).read(); patch='<script>const _W=window.WebSocket;window.WebSocket=function(u,...r){if(typeof u===\"string\"&&u.startsWith(\"ws://\")&&location.protocol===\"https:\"){u=u.replace(\"ws://\",\"wss://\")}return new _W(u,...r)};</script>\n  '; open(f,'w').write(s.replace('<head>', '<head>\n  '+patch, 1)); print('[wss-patch] applied to index.html')" \
    && chown user:user /home/user/app/web/index.html
USER user

# Pre-build Flutter web so preview is instant
RUN cd /home/user/app && flutter build web --release && \
    echo "Flutter web pre-built successfully"

USER root

# =====================================================
# /claude-sdk setup (Claude Agent executor)
# =====================================================

WORKDIR /claude-sdk
RUN chmod 755 /claude-sdk && chown user:user /claude-sdk

USER user

# Init bun project for claude-sdk
RUN bun init -y

# Install Claude Agent SDK + AI SDKs used by the executor
RUN bun install \
    @anthropic-ai/claude-agent-sdk \
    @anthropic-ai/claude-code \
    @ai-sdk/anthropic \
    zod \
    dotenv

# Dev deps
RUN bun install --dev @types/node@^24.0.3

USER root

# Copy the pre-built standalone executor bundle (placed in template dir)
COPY executor.mjs executor.mjs

# Add start script to package.json so `bun start` runs the executor
RUN node -e "const pkg = require('./package.json'); pkg.scripts = pkg.scripts || {}; pkg.scripts.start = 'node executor.mjs'; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

# Pre-create generated_code directory
RUN mkdir -p /claude-sdk/generated_code && chmod 755 /claude-sdk/generated_code && chown -R user:user /claude-sdk

# Pre-create .claude settings directory so the SDK doesn't fail on write
RUN mkdir -p /home/user/.claude && chown -R user:user /home/user/.claude

# Install OpenCode CLI for opencode agentType
RUN npm i -g opencode-ai@latest && \
    which opencode && opencode version || echo "opencode install warning: binary not found after npm install"

# Pre-create OpenCode config directory
RUN mkdir -p /home/user/.config/opencode && chown -R user:user /home/user/.config/opencode

# =====================================================
# FIX: Claude Code SDK installs both musl and glibc
# binaries, but Debian uses glibc. Create symlinks
# so the SDK finds the correct binary.
# =====================================================
USER root
RUN cd /claude-sdk/node_modules/@anthropic-ai &&     if [ -d "claude-agent-sdk-linux-x64-musl" ]; then       mv claude-agent-sdk-linux-x64-musl claude-agent-sdk-linux-x64-musl.bak &&       ln -s claude-agent-sdk-linux-x64 claude-agent-sdk-linux-x64-musl;     fi &&     if [ -d "claude-code-linux-x64-musl" ]; then       mv claude-code-linux-x64-musl claude-code-linux-x64-musl.bak &&       ln -s claude-code-linux-x64 claude-code-linux-x64-musl;     fi &&     echo "Claude Code binary symlinks created"

# Return to app directory
# =====================================================
# OmniRoute Multi-Provider AI Proxy
# =====================================================

# Install OmniRoute globally (uses Node 22)
RUN npm install -g omniroute && omniroute --version

# Create OmniRoute config directory
RUN mkdir -p /home/user/.omniroute

# Default OmniRoute config (providers configured via API from IDE)
RUN echo 'JWT_SECRET=omniroute_sandbox_jwt_key_2026' > /home/user/.omniroute/.env && \
    echo 'API_KEY_SECRET=omniroute_sandbox_api_key_2026' >> /home/user/.omniroute/.env && \
    echo 'INITIAL_PASSWORD=omniroute2026' >> /home/user/.omniroute/.env && \
    echo 'DATA_DIR=/home/user/.omniroute/data' >> /home/user/.omniroute/.env && \
    chown -R user:user /home/user/.omniroute

# Create OmniRoute start script
RUN echo '#!/bin/bash' > /home/user/start-omniroute.sh && \
    echo 'omniroute --port 20128 --no-open &' >> /home/user/start-omniroute.sh && \
    echo 'echo "OmniRoute started on port 20128"' >> /home/user/start-omniroute.sh && \
    chmod +x /home/user/start-omniroute.sh && \
    chown user:user /home/user/start-omniroute.sh

# =====================================================
WORKDIR /home/user/app
USER user
