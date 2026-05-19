import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/templates.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
