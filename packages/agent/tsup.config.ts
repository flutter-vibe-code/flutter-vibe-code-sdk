import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/cli.ts",
    "src/executor.ts",
    "src/types.ts",
    "src/hooks/index.ts",
    "src/utils/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@anthropic-ai/claude-code"],
});
