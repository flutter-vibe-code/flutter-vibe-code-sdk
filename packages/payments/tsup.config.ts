import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/lib/server.ts",
    "src/lib/client.ts",
    "src/lib/config.ts",
    "src/components/index.ts",
    "src/hooks/index.ts",
    "src/types/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ["react", "drizzle-orm", "@polar-sh/sdk"],
});
