import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/config.ts", "src/client.ts", "src/server.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["react", "next", "better-auth", "@polar-sh/better-auth", "@polar-sh/sdk"],
});
