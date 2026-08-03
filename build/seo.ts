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

/** Real, verifiable contact details; these appear in the structured data. */
const CONTACT = {
  email: "info@crestamarine.com",
  phones: ["+201007770000", "+201001000360"],
  whatsapp: "+201224212222",
  instagram: "https://www.instagram.com/cresta_marine/",
  street: "Abu Tig Marina",
  locality: "El Gouna",
  region: "Red Sea Governorate",
  country: "EG",
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
  image: absolute("/og.png"),
  email: CONTACT.email,
  telephone: CONTACT.phones[0],
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.street,
    addressLocality: CONTACT.locality,
    addressRegion: CONTACT.region,
    addressCountry: CONTACT.country,
  },
  areaServed: { "@type": "Place", name: "Red Sea, Egypt" },
  brand: { "@type": "Brand", name: "Kumbra Yachts" },
  sameAs: [CONTACT.instagram, `https://wa.me/${CONTACT.whatsapp.replace("+", "")}`],
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
 * A boat, as a Product.
 *
 * No `offers` block: the public site does not publish prices, and inventing
 * one to win a rich result would be a lie told to a search engine. Specs come
 * from the same data the page renders, so they cannot disagree with it.
 */
const boatProduct = (boat: (typeof boats)[number]) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": `${SITE}/fleet/${boat.slug}#product`,
  name: boat.name,
  description: boat.description,
  url: `${SITE}/fleet/${boat.slug}`,
  image: absolute(boat.hero),
  category: "Motor yacht",
  brand: { "@type": "Brand", name: "Kumbra Yachts" },
  manufacturer: { "@type": "Organization", name: "Kumbra Yachts" },
  seller: { "@id": `${SITE}/#business` },
  additionalProperty: [
    ["Length overall", boat.length],
    ["Beam", boat.beam],
    ["Guest capacity", boat.capacity],
    ["Maximum power", boat.power],
    ["Top speed", boat.speed],
    ["Accommodation", boat.cabins],
  ].map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
});

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

/** Sign-in and account flows: real pages, but nothing for a search engine. */
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
      boatProduct(boat),
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
    path: "/services",
    title: "Ownership & yacht care | Cresta Marine",
    description:
      "Ownership support, berthing, servicing and yacht care from Cresta Marine at Abu Tig Marina, El Gouna — keeping your Kumbra ready for the Red Sea.",
    changefreq: "monthly",
    priority: 0.7,
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
  const image = absolute(route.image ?? "/og.png");

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

export function renderRobots(): string {
  const disallow = routes
    .filter((route) => route.noindex)
    .map((route) => `Disallow: ${route.path}`)
    .join("\n");

  return [
    "# Cresta Marine",
    "User-agent: *",
    "Allow: /",
    "",
    "# The private area holds no public content and must never be indexed.",
    "Disallow: /portal",
    "Disallow: /api/",
    disallow,
    "",
    `Sitemap: ${SITE}/sitemap.xml`,
    "",
  ].join("\n");
}
