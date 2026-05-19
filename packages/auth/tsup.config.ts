import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/config.ts", "src/client.ts", "src/server.ts"],
  format: ["cjs", "esm"],
  dts: false, // tsup TS2742/4023 con @polar-sh tipos inferidos transitivos
  clean: true,
  sourcemap: true,
  external: ["react", "next", "better-auth", "@polar-sh/better-auth", "@polar-sh/sdk"],
});
