import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/types.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@e2b/code-interpreter"],
});
