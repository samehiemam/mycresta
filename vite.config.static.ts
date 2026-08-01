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
    // Hostinger's "Next.js" preset hard-codes the output directory to `.next`,
    // so that is the default here and the deploy works with no dashboard
    // changes. It is still a plain static Vite build — nothing Next.js about it.
    // Override when you want the clearer name: BUILD_OUT_DIR=dist-static npm run build
    outDir: process.env.BUILD_OUT_DIR || ".next",
    emptyOutDir: true,
  },
});
