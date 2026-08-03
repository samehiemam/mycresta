/**
 * Per-route metadata, prerendered at build time.
 *
 * The site is a client-rendered SPA, so without this every URL is served the
 * same `<head>`: one title, one description, one Open Graph card. Google will
 * eventually run the JavaScript and see the real title, but social scrapers
 * (WhatsApp, LinkedIn, Facebook, iMessage) never do — so every link anyone
 * shared looked identical, and the boat pages, which are the whole commercial
 * point of the site, were indistinguishable from the home page.
 *
 * The fix is not server-side rendering: there are ten public URLs and they are
 * known at build time, so we emit a real HTML file per route with the correct
 * head baked in. The body stays empty and React hydrates it as before. That
 * keeps the deploy a plain static upload, which is what shared hosting wants.
 *
 * Titles here must match the `useTitle()` call on the corresponding page, or
 * the tab name would visibly change a moment after the page loads.
 */

import { boats } from "../app/data";

/** Canonical origin. No trailing slash — every path below starts with one. */
export const SITE = "https://crestamarine.com";

/**
 * The default share card, used by every page without an image of its own.
 *
 * Rendered from build/og/card.html — the real logo lockup, the brand navy and
 * teal, and the tagline, at the 1200x630 scrapers expect. Re-render with:
 *
 *   chrome --headless --force-device-scale-factor=2 --window-size=1200,630 \
 *     --screenshot=out.png <served card.html>
 *
 * then downsample to 1200x630 and save as JPEG. Two reasons it is a JPEG and
 * not the old PNG: the previous card was 1.2 MB, heavy enough that a slow
 * scraper fetch can drop the preview entirely, and this is 98 KB.
 *
 * The filename is new rather than a replacement of og.png on purpose. Files in
 * public/ are served with a year of immutable caching and carry no content
 * hash, so overwriting one leaves every cache — Hostinger's CDN included —
 * serving the old bytes indefinitely. A new name is the only reliable bust.
 */
const OG_COVER = "/og-cover.jpg";

/** Real, verifiable contact details; these appear in the structured data. */
const CONTACT = {
  email: "info@crestamarine.com",
  phones: ["+201007770000", "+201001000360"],
  whatsapp: "+201224212222",
  instagram: "https://www.instagram.com/cresta_marine/",
  street: "Abu Tig Marina",
  locality: "El Gouna",
  region: "Red Sea Governorate",
  postalCode: "84513",
  country: "EG",
  /**
   * The Google Business Profile. Naming it in `sameAs` tells Google that the
   * site and the listing are one business rather than two that happen to share
   * a name — which is why the address and phone here must keep matching the
   * listing exactly. This is the short link Google generated for the profile;
   * it is used verbatim rather than a CID URL derived by hand, because getting
   * such a derivation subtly wrong would point at somebody else's business.
   */
  googleBusiness: "https://maps.app.goo.gl/577mTsKUyrn6DUXCA",
};

export type SeoRoute = {
  /** URL path, always with a leading slash and never a trailing one. */
  path: string;
  title: string;
  description: string;
  /** Site-root-relative image; made absolute when written. */
  image?: string;
  /** Left out of the sitemap and marked noindex. */
  noindex?: boolean;
  /** Sitemap hint. Boat pages change more often than the about page. */
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
  jsonLd?: unknown[];
};

const absolute = (path: string) => (path.startsWith("http") ? path : SITE + path);

/**
 * Cresta Marine itself. Schema.org has no boat-dealer type, so LocalBusiness
 * with an explicit brand is the honest choice — `AutoDealer` would claim we
 * sell cars. Deliberately no `geo`: precise coordinates for the marina berth
 * are not something we hold, and a wrong pin on a map is worse than none.
 * A verified Google Business Profile is the real fix for map placement.
 */
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE}/#business`,
  name: "Cresta Marine",
  alternateName: "Cresta Marine — Peak Boating Experience",
  description:
    "Kumbra Yachts dealer at Abu Tig Marina, El Gouna, offering yacht sales, personal configuration, ownership support and yacht care on the Red Sea.",
  url: `${SITE}/`,
  logo: absolute("/images/cresta-mark-navy.png"),
  image: absolute(OG_COVER),
  email: CONTACT.email,
  telephone: CONTACT.phones[0],
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.street,
    addressLocality: CONTACT.locality,
    addressRegion: CONTACT.region,
    postalCode: CONTACT.postalCode,
    addressCountry: CONTACT.country,
  },
  // Where clients are served, which is wider than where the business sits.
  // The North Coast is listed because Cresta serves it from El Gouna — it is
  // deliberately not a second address, since claiming a location without a
  // staffed premises there is what gets a Business Profile suspended.
  areaServed: [
    { "@type": "Place", name: "El Gouna, Red Sea, Egypt" },
    { "@type": "Place", name: "Hurghada, Red Sea, Egypt" },
    { "@type": "Place", name: "North Coast, Mediterranean, Egypt" },
    { "@type": "Country", name: "Egypt" },
  ],
  brand: { "@type": "Brand", name: "Kumbra Yachts" },
  sameAs: [
    CONTACT.googleBusiness,
    CONTACT.instagram,
    `https://wa.me/${CONTACT.whatsapp.replace("+", "")}`,
  ],
  contactPoint: CONTACT.phones.map((telephone) => ({
    "@type": "ContactPoint",
    telephone,
    contactType: "sales",
    email: CONTACT.email,
    areaServed: "EG",
    availableLanguage: ["en", "ar"],
  })),
};

/**
 * Boats deliberately carry no `Product` markup.
 *
 * Product is only eligible for a rich result with `offers`, `review` or
 * `aggregateRating`, and the public site publishes no prices — Search Console
 * reported the boat pages as "1 invalid item" for exactly that reason. The
 * options were to invent a price, which would be a lie told to a search
 * engine, or to drop the type. Dropping it costs nothing: without a price
 * there is no rich result either way, so the markup was buying a standing
 * error in return for no benefit. The pages rank on their content, and the
 * breadcrumbs below already validate.
 *
 * If starting prices are ever published, Product with a real `offers` block
 * becomes worth adding back — that is the only thing that changes here.
 */
const breadcrumbs = (trail: Array<[string, string]>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map(([name, path], index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: SITE + path,
  })),
});

/**
 * Share cards, where a boat's hero image is not usable as one.
 *
 * The page images are WebP where that renders best in a browser, but several
 * link scrapers — LinkedIn among them — still refuse WebP and fall back to
 * showing no image at all. Where a boat's hero is WebP, a JPEG of the same
 * boat is named here instead; the page itself is untouched.
 */
const SOCIAL_IMAGE: Record<string, string> = {
  "kumbra-34": "/images/kumbra-34-aerial-new-DaqHQ-Er.jpg",
};

/**
 * Boat descriptions already read well, so they are reused verbatim and only
 * given a location suffix when there is room for one inside the ~158
 * characters Google will actually show.
 */
const boatDescription = (boat: (typeof boats)[number]) => {
  const suffix = " From Cresta Marine, El Gouna.";
  return boat.description.length + suffix.length <= 158
    ? boat.description + suffix
    : boat.description;
};

/**
 * Sign-in and account flows: real pages, but nothing for a search engine.
 *
 * These are kept crawlable on purpose. /my-cresta is linked from the header
 * and the footer, so Google will find it whatever robots.txt says — and a
 * path disallowed there can still be indexed as a bare URL, listed under the
 * brand name with "no information is available for this page". The tag that
 * actually keeps a page out of the index is `noindex`, and Google has to be
 * allowed to fetch the page to read it. So: crawlable, and explicitly noindex.
 *
 * Only paths with no public link and nothing to render are disallowed outright
 * in robots.txt — see renderRobots().
 */
const PRIVATE_PATHS = [
  "/my-cresta",
  "/login",
  "/register",
  "/verify",
  "/confirm-email",
  "/set-password",
  "/forgot-password",
  "/reset-password",
];

export const routes: SeoRoute[] = [
  {
    path: "/",
    title: "Cresta Marine | Peak Boating Experience",
    description:
      "Cresta Marine is the Kumbra Yachts dealer at Abu Tig Marina, El Gouna. Curated yachts, personal configuration and full ownership support on the Red Sea.",
    changefreq: "monthly",
    priority: 1.0,
    jsonLd: [
      localBusiness,
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        name: "Cresta Marine",
        url: `${SITE}/`,
        publisher: { "@id": `${SITE}/#business` },
        inLanguage: "en",
      },
    ],
  },
  {
    path: "/fleet",
    title: "Kumbra fleet | Cresta Marine",
    description:
      "Explore the Kumbra range at Cresta Marine — the 34, 36 and 43. Spanish-built performance yachts from 10.40 m to 13.35 m, rigged for Red Sea cruising.",
    changefreq: "monthly",
    priority: 0.9,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Kumbra fleet",
        itemListElement: boats.map((boat, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: boat.name,
          url: `${SITE}/fleet/${boat.slug}`,
        })),
      },
      breadcrumbs([
        ["Home", "/"],
        ["Fleet", "/fleet"],
      ]),
    ],
  },
  ...boats.map((boat): SeoRoute => ({
    path: `/fleet/${boat.slug}`,
    title: `${boat.name} | Cresta Marine`,
    description: boatDescription(boat),
    image: SOCIAL_IMAGE[boat.slug] ?? boat.hero,
    changefreq: "monthly",
    priority: 0.8,
    jsonLd: [
      breadcrumbs([
        ["Home", "/"],
        ["Fleet", "/fleet"],
        [boat.name, `/fleet/${boat.slug}`],
      ]),
    ],
  })),
  {
    path: "/configure",
    title: "Configure your Kumbra | Cresta Marine",
    description:
      "Build your Kumbra online — hull colour, upholstery, engines and equipment — then request a personal quotation from Cresta Marine in El Gouna.",
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    // Targets "boat finance Egypt" / "yacht financing Egypt": commercially
    // valuable, barely contested locally, and previously unrepresented by any
    // URL on the site.
    path: "/yacht-finance",
    title: "Yacht financing in Egypt | Cresta Marine",
    description:
      "Finance your yacht in Egypt through Cresta Marine's partner Contact: up to 15 million EGP, down payments from 20% and plans of up to 5 years, subject to approval.",
    changefreq: "monthly",
    priority: 0.8,
    jsonLd: [
      breadcrumbs([
        ["Home", "/"],
        ["Yacht financing", "/yacht-finance"],
      ]),
    ],
  },
  {
    // Was /services. The header link has always read "Ownership", and the
    // page is about ownership models rather than a service menu, so the URL
    // now matches. /services 301s here in .htaccess — it was in the submitted
    // sitemap, so it must not simply stop existing.
    path: "/ownership",
    title: "Yacht ownership & co-ownership | Cresta Marine",
    description:
      "Own a Kumbra outright, finance it, or take a half, quarter or fifth share. Fair time allocation and itemised shared costs through My Cresta, with yacht care in El Gouna.",
    changefreq: "monthly",
    priority: 0.8,
    jsonLd: [
      breadcrumbs([
        ["Home", "/"],
        ["Ownership", "/ownership"],
      ]),
    ],
  },
  {
    path: "/about",
    title: "About Cresta Marine | Peak Boating Experience",
    description:
      "Cresta Marine brings the Peak Boating Experience to the Red Sea as the Kumbra Yachts dealer in El Gouna, Egypt. One standard, from first viewing to yacht care.",
    changefreq: "yearly",
    priority: 0.6,
  },
  ...PRIVATE_PATHS.map((path): SeoRoute => ({
    path,
    title: "My Cresta | Cresta Marine",
    description: "Sign in to My Cresta, the private owner and partner portal.",
    noindex: true,
  })),
];

// --------------------------------------------------------------- rendering ---

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * JSON-LD sits inside a <script> block, so the one sequence that must never
 * appear raw is `</`. Escaping the forward slash keeps the JSON valid while
 * making it impossible to close the tag early.
 */
const escapeJson = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");

/** Tags this module owns; stripped from the template before re-emitting. */
const OWNED_TAGS =
  /<title>[\s\S]*?<\/title>|<meta\s+[^>]*?(?:name|property)="(?:description|robots|og:[^"]*|twitter:[^"]*)"[^>]*?>|<link\s+[^>]*?rel="canonical"[^>]*?>/gi;

export function renderHead(template: string, route: SeoRoute): string {
  const canonical = SITE + (route.path === "/" ? "/" : route.path);
  const image = absolute(route.image ?? OG_COVER);

  const tags = [
    `<title>${escapeAttr(route.title)}</title>`,
    `<meta name="description" content="${escapeAttr(route.description)}" />`,
    route.noindex
      ? `<meta name="robots" content="noindex, nofollow" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<link rel="canonical" href="${escapeAttr(canonical)}" />`,
    `<meta property="og:site_name" content="Cresta Marine" />`,
    `<meta property="og:locale" content="en" />`,
    `<meta property="og:type" content="${route.path.startsWith("/fleet/") ? "product" : "website"}" />`,
    `<meta property="og:url" content="${escapeAttr(canonical)}" />`,
    `<meta property="og:title" content="${escapeAttr(route.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(route.description)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(route.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
    ...(route.jsonLd ?? []).map(
      (block) => `<script type="application/ld+json">${escapeJson(block)}</script>`
    ),
  ];

  return template
    .replace(OWNED_TAGS, "")
    .replace(/\n\s*\n/g, "\n")
    .replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);
}

export function renderSitemap(): string {
  const urls = routes
    .filter((route) => !route.noindex)
    .map(
      (route) =>
        `  <url>\n` +
        `    <loc>${SITE}${route.path === "/" ? "/" : route.path}</loc>\n` +
        `    <changefreq>${route.changefreq ?? "monthly"}</changefreq>\n` +
        `    <priority>${(route.priority ?? 0.5).toFixed(1)}</priority>\n` +
        `  </url>`
    )
    .join("\n");

  const ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${ns}">\n${urls}\n</urlset>\n`;
}

/**
 * Only paths that are never linked and have nothing to show are disallowed.
 *
 * The sign-in pages are deliberately absent: they carry a `noindex` tag, and
 * blocking them here would stop Google reading the very tag that keeps them
 * out of the index.
 */
export function renderRobots(): string {
  return [
    "# Cresta Marine",
    "User-agent: *",
    "Allow: /",
    "",
    "# The portal application and the API: no public content, never linked.",
    "# The sign-in pages are crawlable on purpose and carry a noindex tag.",
    "Disallow: /portal",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ].join("\n");
}
