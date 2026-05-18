import { defineConfig } from "tsup";

const sharedConfig = {
  format: ["cjs", "esm"] as const,
  dts: true,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "next",
    "next-themes",
    "sonner",
    "@e2b/code-interpreter",
    "@octokit/rest",
    "drizzle-orm",
    "lucide-react",
    "zod",
  ],
};

export default defineConfig([
  // Client-side entry points (components)
  {
    ...sharedConfig,
    entry: {
      "components/index": "src/components/index.ts",
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
