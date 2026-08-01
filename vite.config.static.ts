import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Copies the portal library into the build output.
 *
 * Hosts that deploy from git publish only the output directory, so a portal/
 * folder kept beside the project would never reach the server. It ships with a
 * deny-all .htaccess, and config.php (database password) and storage/ are
 * deliberately excluded — those are created on the server and never travel
 * through the repository or the build.
 */
function portalLibrary(): Plugin {
  return {
    name: "cresta-portal-library",
    apply: "build",
    closeBundle() {
      const root = dirname(fileURLToPath(import.meta.url));
      const from = resolve(root, "portal");
      const to = resolve(root, process.env.BUILD_OUT_DIR || ".next", "portal");
      if (!existsSync(from)) return;

      mkdirSync(to, { recursive: true });
      cpSync(from, to, {
        recursive: true,
        filter: (source) =>
          !source.endsWith("/config.php") && !source.includes("/storage"),
      });
    },
  };
}

// Static SPA build for shared hosting (e.g. Hostinger). No server / vinext /
// Cloudflare involvement — outputs a plain dist-static/ of HTML, CSS and JS.
//
// `next/*` imports in the reused components/pages are aliased to small shims
// backed by react-router so the original design ports over almost verbatim.
const resolvePath = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react(), portalLibrary()],
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
