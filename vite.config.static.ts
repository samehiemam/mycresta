import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { renderHead, renderRobots, renderSitemap, routes } from "./build/seo";

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

  // Only settings that actually have a value are written. An empty entry is
  // not the same as an absent one: the reader treats a present-but-empty key
  // as a deliberate blank so that clearing a setting sticks, which means an
  // empty 'host' here would silently override the default in code.
  const smtpEntries = Object.entries({
    host:   env.CRESTA_SMTP_HOST,
    port:   env.CRESTA_SMTP_PORT,
    user:   env.CRESTA_SMTP_USER,
    pass:   env.CRESTA_SMTP_PASS,
    secure: env.CRESTA_SMTP_SECURE,
  })
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `        '${key}' => ${php(value)},\n`)
    .join("");

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
    'smtp' => [
${smtpEntries}    ],
    'admin_emails' => [${adminEmails.map(php).join(", ")}],
    'admin_autoconfirm' => ${env.CRESTA_ADMIN_AUTOCONFIRM ? "true" : "false"},
    // Read from here rather than getenv(): this host freezes PHP's copy of the
    // environment at first boot, so a token added in the panel never reaches
    // the runtime. The build regenerates this file on every deploy.
    'demo_token' => ${php(env.CRESTA_DEMO_TOKEN)},
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

/**
 * Emits one HTML file per public route, plus robots.txt and sitemap.xml.
 *
 * Vite produces a single index.html, which Apache then serves for every path.
 * That is fine for the application and useless for search: one title and one
 * Open Graph card for the whole site. Here we take that built file — assets
 * already hashed and injected — and stamp a route-specific <head> into copies
 * of it, so /fleet/kumbra-43 arrives at a crawler describing the Kumbra 43.
 *
 * robots.txt and sitemap.xml are generated from the same route table rather
 * than kept by hand, because a sitemap that disagrees with the site is worse
 * than no sitemap at all. Both previously 404'd into the SPA fallback and were
 * served as HTML, which no crawler can parse.
 */
/**
 * Warns when a public route exists in the router but not in the SEO table.
 *
 * The failure this prevents is silent: an uncovered route still works, still
 * returns 200, and still looks correct in a browser — it just quietly serves
 * the home page's title and description to every crawler that visits it. That
 * is precisely the bug this whole plugin exists to fix, so it is worth a
 * second of build time to notice it coming back.
 *
 * A warning rather than an error: a missing description should never be the
 * reason a deploy fails.
 */
function warnOnUncoveredRoutes(root: string): void {
  const appFile = resolve(root, "src/App.tsx");
  if (!existsSync(appFile)) return;

  const declared = [...readFileSync(appFile, "utf8").matchAll(/path="([^"]+)"/g)]
    .map((match) => match[1])
    // The private area is deliberately excluded, and ":slug" is covered by the
    // concrete boat paths the table expands from app/data.ts.
    .filter((path) => path.startsWith("/") && !path.startsWith("/portal") && !path.includes(":"));

  const covered = new Set(routes.map((route) => route.path));
  const missing = declared.filter((path) => !covered.has(path));

  if (missing.length) {
    console.warn(
      `\n  ⚠ [seo] These routes have no entry in build/seo.ts and will be served\n` +
        `    the generic home-page metadata: ${missing.join(", ")}\n`
    );
  }
}

function seoPrerender(): Plugin {
  return {
    name: "cresta-seo-prerender",
    apply: "build",
    closeBundle() {
      const root = dirname(fileURLToPath(import.meta.url));
      const out = resolve(root, process.env.BUILD_OUT_DIR || ".next");
      const entry = resolve(out, "index.html");
      if (!existsSync(entry)) return;

      const template = readFileSync(entry, "utf8");
      warnOnUncoveredRoutes(root);

      for (const route of routes) {
        const html = renderHead(template, route);
        // "/" is the entry itself; everything else becomes a directory with an
        // index.html, so the URL stays clean and extensionless.
        const target =
          route.path === "/"
            ? entry
            : resolve(out, route.path.replace(/^\//, ""), "index.html");

        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, html, "utf8");
      }

      writeFileSync(resolve(out, "robots.txt"), renderRobots(), "utf8");
      writeFileSync(resolve(out, "sitemap.xml"), renderSitemap(), "utf8");
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
  plugins: [react(), portalLibrary(), seoPrerender()],
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
