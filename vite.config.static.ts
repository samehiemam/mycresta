import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
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
/**
 * Writes portal/config.php from the build environment.
 *
 * On Hostinger the environment variables reach the *build* but never refresh
 * for the PHP runtime — a deployed app keeps whatever it was first given, so
 * editing a variable in the panel silently changes nothing. Capturing them at
 * build time and writing a config file makes the panel the source of truth
 * again, and PHP simply reads a file.
 *
 * Nothing secret enters the repository: the values come from the environment
 * at build time, and the generated file is gitignored and served only to PHP.
 */
function writePortalConfig(portalDir: string): void {
  const env = process.env;
  if (!env.CRESTA_DB_NAME || !env.CRESTA_DB_USER) {
    return; // nothing supplied — the runtime falls back to its own lookup
  }

  // Single-quoted PHP strings: escape backslashes and single quotes only.
  const php = (value: string | undefined) =>
    `'${String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

  const adminEmails = String(env.CRESTA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const contents = `<?php
// Generated at build time from the hosting panel's environment variables.
// Do not edit by hand — the next deploy overwrites it.
return [
    'db' => [
        'host' => ${php(env.CRESTA_DB_HOST || "localhost")},
        'name' => ${php(env.CRESTA_DB_NAME)},
        'user' => ${php(env.CRESTA_DB_USER)},
        'pass' => ${php(env.CRESTA_DB_PASS)},
    ],
    'storage_path' => __DIR__ . '/storage',
    'mail' => [
        'from'      => ${php(env.CRESTA_MAIL_FROM || "no-reply@localhost")},
        'from_name' => 'Cresta Marine',
        'admin'     => ${php(env.CRESTA_MAIL_ADMIN)},
    ],
    'sms' => [
        'driver'   => ${php(env.CRESTA_SMS_DRIVER || "manual")},
        'endpoint' => ${php(env.CRESTA_SMS_ENDPOINT)},
        'token'    => ${php(env.CRESTA_SMS_TOKEN)},
        'sender'   => ${php(env.CRESTA_SMS_SENDER || "CrestaMarine")},
    ],
    'admin_emails' => [${adminEmails.map(php).join(", ")}],
    'admin_autoconfirm' => ${env.CRESTA_ADMIN_AUTOCONFIRM ? "true" : "false"},
    'site_url' => ${php(env.CRESTA_SITE_URL)},
];
`;

  writeFileSync(resolve(portalDir, "config.php"), contents, "utf8");
}

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

      writePortalConfig(to);
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
