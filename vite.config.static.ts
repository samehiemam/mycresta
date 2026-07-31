import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Static SPA build for shared hosting (e.g. Hostinger). No server / vinext /
// Cloudflare involvement — outputs a plain dist-static/ of HTML, CSS and JS.
//
// `next/*` imports in the reused components/pages are aliased to small shims
// backed by react-router so the original design ports over almost verbatim.
const resolvePath = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: resolvePath("./src/shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: resolvePath("./src/shims/next-navigation.ts") },
      { find: /^next\/headers$/, replacement: resolvePath("./src/shims/next-headers.ts") },
    ],
  },
  build: {
    outDir: "dist-static",
    emptyOutDir: true,
  },
});
