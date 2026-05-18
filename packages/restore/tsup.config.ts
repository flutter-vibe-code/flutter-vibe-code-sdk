import { defineConfig } from "tsup";

const sharedConfig = {
  format: ["cjs", "esm"] as const,
  dts: true,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "next",
    "@e2b/code-interpreter",
    "@tanstack/react-query",
    "drizzle-orm",
    "lucide-react",
    "zod",
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
  // Server-side entry points (api, lib, types, and main index)
  {
    ...sharedConfig,
    entry: {
      index: "src/index.ts",
      "api/index": "src/api/index.ts",
      "lib/index": "src/lib/index.ts",
      "types/index": "src/types/index.ts",
    },
    clean: false,
  },
]);
