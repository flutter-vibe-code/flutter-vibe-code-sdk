import { defineConfig } from "tsup";

const sharedConfig = {
  format: ["cjs", "esm"] as const,
  dts: true,
  sourcemap: true,
  external: [
    "@e2b/code-interpreter",
    "@anthropic-ai/claude-code",
    "@octokit/rest",
    "@vercel/blob",
    "cloudflare",
    "lucide-react",
    "zod",
    "react",
  ],
};

export default defineConfig([
  // Client-side entry points (components and hooks)
  {
    ...sharedConfig,
    entry: {
      "components/index": "src/components/index.ts",
      "hooks/index": "src/hooks/index.ts",
    },
    clean: true,
    splitting: false,
    banner: {
      js: '"use client";',
    },
  },
  // Server-side entry points (api, lib, skills, and main index)
  {
    ...sharedConfig,
    entry: {
      index: "src/index.ts",
      "api/index": "src/api/index.ts",
      "lib/index": "src/lib/index.ts",
      "skills/index": "src/skills/index.ts",
    },
    clean: false,
    splitting: true, // Allow code splitting for server code
  },
]);
