import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/components/index.ts",
    "src/hooks/index.ts",
    "src/lib/index.ts",
    "src/themes/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  banner: {
    js: '"use client";',
  },
  external: [
    "react",
    "react-dom",
    "next-themes",
    "@monaco-editor/react",
    "prismjs",
    "lucide-react",
  ],
});
