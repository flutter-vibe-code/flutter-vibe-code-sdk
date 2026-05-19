import { defineConfig } from "tsup";

const sharedConfig = {
  format: ["cjs", "esm"] as const,
  dts: true,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "react-dom",
    "@ai-sdk/anthropic",
    "@ai-sdk/fireworks",
    "@ai-sdk/google",
    "@ai-sdk/google-vertex",
    "@ai-sdk/mistral",
    "@ai-sdk/openai",
    "@ai-sdk/react",
    "ai",
    "lucide-react",
    "ollama-ai-provider",
    "react-markdown",
    "use-stick-to-bottom",
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
    banner: {
      js: '"use client";',
    },
  },
  // Server-side entry points (api, lib, and main index)
  {
    ...sharedConfig,
    entry: {
      index: "src/index.ts",
      "api/index": "src/api/index.ts",
      "lib/index": "src/lib/index.ts",
    },
    clean: false, // Don't clean, first build already cleaned
  },
]);
