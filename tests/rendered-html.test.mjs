import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships the Cresta Marine product experience", async () => {
  const [
    home,
    layout,
    configurator,
    configuratorData,
    portal,
    portalPage,
    myCresta,
    customerLoginRedirect,
    teamAccessRedirect,
    accessRequestApi,
    accountUsersApi,
    employeeAccountDirectory,
    schema,
    siteHeader,
    siteFooter,
    aboutPage,
    servicesPage,
    fleetPage,
    boatPage,
    boatData,
    featureCarousel,
    packageJson,
  ] =
    await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/components/Configurator.tsx", root), "utf8"),
    readFile(new URL("app/configurator-data.ts", root), "utf8"),
    readFile(new URL("app/components/PortalDemo.tsx", root), "utf8"),
    readFile(new URL("app/portal/page.tsx", root), "utf8"),
    readFile(new URL("app/my-cresta/page.tsx", root), "utf8"),
    readFile(new URL("app/customer-login/page.tsx", root), "utf8"),
    readFile(new URL("app/team-access/page.tsx", root), "utf8"),
    readFile(new URL("app/api/access-requests/route.ts", root), "utf8"),
    readFile(new URL("app/api/account-users/route.ts", root), "utf8"),
    readFile(
      new URL("app/components/EmployeeAccountDirectory.tsx", root),
      "utf8",
    ),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("app/components/SiteHeader.tsx", root), "utf8"),
    readFile(new URL("app/components/SiteFooter.tsx", root), "utf8"),
    readFile(new URL("app/about/page.tsx", root), "utf8"),
    readFile(new URL("app/services/page.tsx", root), "utf8"),
    readFile(new URL("app/fleet/page.tsx", root), "utf8"),
    readFile(new URL("app/fleet/[slug]/page.tsx", root), "utf8"),
    readFile(new URL("app/data.ts", root), "utf8"),
    readFile(new URL("app/components/FeatureCarousel.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
    ]);

  assert.match(home, /Configure your boat/);
  assert.match(home, /Own the Sea/);
  assert.match(home, /Peak Boating Experience/);
  assert.match(home, /One Cresta standard/);
  assert.match(home, /kumbra-34-featured\.jpg/);
  assert.match(home, /kumbra-36-featured\.jpg/);
  assert.match(home, /kumbra-43-featured\.jpg/);
  assert.doesNotMatch(home, /Own the Red Sea/);
  assert.doesNotMatch(home, /Exclusive Kumbra Yachts dealer/);
  assert.match(home, /Your boating life\. One connected experience\./);
  assert.match(home, /My Cresta App · Coming Soon/);
  assert.match(home, /same Cresta account/);
  assert.match(home, /Discover the My Cresta App/);
  assert.match(home, /my-cresta-app\/boat-detail\.png/);
  assert.match(home, /my-cresta-app\/boat-status\.png/);
  assert.match(home, /my-cresta-app\/trip-preparation\.png/);
  assert.match(home, /dedicated concierge services/);
  assert.match(home, /commission on successful eligible sales/);
  assert.doesNotMatch(home, /Configured example · Kumbra 43/);
  assert.doesNotMatch(home, /Private access/);
  assert.ok(
    home.indexOf('className="home-app-showcase"') <
      home.indexOf('className="role-stack"'),
  );
  assert.doesNotMatch(home, /Employees work from/);
  assert.match(layout, /Cresta Marine/);
  assert.match(layout, /og\.png/);
  assert.match(configurator, /Request your private quote/);
  assert.match(configurator, /Save configuration & request a quote/);
  assert.doesNotMatch(configurator, /Open My Cresta/);
  assert.match(configurator, /Included as standard/);
  assert.match(configurator, /includedEquipment/);
  assert.match(configurator, /visibleToClient: false/);
  assert.match(configuratorData, /Mercury V12 600 hp/);
  assert.match(configuratorData, /Not compatible with shaft motorisation/);
  assert.match(configuratorData, /Diamonds Design/);
  assert.match(configuratorData, /Blanc des Blancs/);
  assert.match(configuratorData, /requiresAny/);
  assert.match(configuratorData, /exclusiveGroup/);
  assert.match(configuratorData, /Premium Gussi Italia steering wheel/);
  assert.match(configuratorData, /Large Edition bathing platform/);
  assert.match(configuratorData, /standardEquipment34/);
  assert.match(configuratorData, /standardEquipment36/);
  assert.match(configuratorData, /standardEquipment43/);
  assert.match(portal, /Client view/);
  assert.match(portal, /Ambassador view/);
  assert.match(portal, /Employee view/);
  assert.match(portal, /Signed in/);
  assert.match(portalPage, /getChatGPTUser/);
  assert.match(portalPage, /SiteHeader/);
  assert.match(myCresta, /Your boating life, beautifully organised/);
  assert.match(myCresta, /Continue with Google/);
  assert.match(myCresta, /Create your customer profile/);
  assert.match(myCresta, /Manage your boat/);
  assert.match(myCresta, /Request services/);
  assert.match(myCresta, /Cresta concierge/);
  assert.match(myCresta, /My Cresta App · Coming Soon/);
  assert.match(myCresta, /same secure account and shared/);
  assert.match(myCresta, /Explore & configure/);
  assert.match(myCresta, /Food & drinks/);
  assert.match(myCresta, /my-cresta-app\/my-boat\.png/);
  assert.match(myCresta, /my-cresta-app\/request-service\.png/);
  assert.match(
    myCresta,
    /Employee or ambassador\? Request approved access/,
  );
  assert.match(customerLoginRedirect, /redirect\(\"\/my-cresta\"\)/);
  assert.match(
    teamAccessRedirect,
    /redirect\(\"\/my-cresta#team-access\"\)/,
  );
  assert.match(accessRequestApi, /admin@crestamarine\.com/);
  assert.match(accessRequestApi, /status: "pending"/);
  assert.match(accountUsersApi, /canManageAccounts/);
  assert.match(accountUsersApi, /requested_role = 'ambassador'/);
  assert.match(employeeAccountDirectory, /Clients & ambassadors/);
  assert.match(employeeAccountDirectory, /Create active account/);
  assert.match(employeeAccountDirectory, /reviewAmbassador/);
  assert.match(schema, /sqliteTable\(\s*"users"/);
  assert.match(schema, /users_email_unique/);
  assert.match(siteHeader, /instagram\.com\/cresta_marine/);
  assert.match(siteHeader, />Instagram</);
  assert.doesNotMatch(siteHeader, />@cresta_marine</);
  assert.match(siteHeader, /wa\.me\/201224212222/);
  assert.match(siteHeader, /Chat with Cresta Marine on WhatsApp/);
  assert.match(siteHeader, />My Cresta</);
  assert.doesNotMatch(siteHeader, /header-cta/);
  assert.match(siteFooter, /WhatsApp\s*<\/a>/);
  assert.match(siteFooter, />Your account</);
  assert.doesNotMatch(siteFooter, /Employee &amp; ambassador access/);
  assert.match(siteFooter, />Peak Boating Experience</);
  assert.doesNotMatch(siteFooter, /Exclusive Kumbra Yachts dealer/);
  assert.match(siteFooter, /tel:\+201007770000/);
  assert.match(siteFooter, /tel:\+201001000360/);
  assert.doesNotMatch(siteFooter, /tel:\+201224212222/);
  assert.doesNotMatch(siteFooter, /Call us/);
  assert.match(aboutPage, /island hopping at sunrise/);
  assert.match(aboutPage, /overnight stay on board/);
  assert.match(aboutPage, /practical education/);
  assert.match(aboutPage, /Connected boating · Coming Soon/);
  assert.match(aboutPage, /one shared customer record/);
  assert.match(aboutPage, /servicing and/);
  assert.match(servicesPage, /Financing options/);
  assert.match(servicesPage, /Contact Finance/);
  assert.match(servicesPage, /contact-finance\.avif/);
  assert.match(servicesPage, /Your boat\. One Cresta standard\./);
  assert.match(servicesPage, /Secure records and requests through My Cresta/);
  assert.doesNotMatch(servicesPage, /supported from El Gouna/);
  assert.doesNotMatch(
    [home, aboutPage, servicesPage, myCresta].join("\n"),
    /Open My Cresta|Access My Cresta/,
  );
  assert.match(home, /button--configure/);
  assert.match(aboutPage, /button--configure/);
  assert.match(servicesPage, /button--configure/);
  assert.match(fleetPage, /button--configure/);
  assert.match(boatPage, /button--configure/);
  assert.doesNotMatch(
    [home, aboutPage, servicesPage, fleetPage, boatPage].join("\n"),
    /Open the configurator|Configure this boat|Configure a boat →/,
  );
  assert.match(fleetPage, /boat\.profile/);
  assert.match(fleetPage, /fleet-row-image--studio/);
  assert.match(boatPage, /boat-hero--studio/);
  assert.match(boatPage, /boat\.profile/);
  assert.match(boatPage, /Born in Barcelona/);
  assert.match(boatPage, /Plans &amp; arrangements/);
  assert.match(boatPage, /FeatureCarousel/);
  assert.match(boatPage, /Complete technical data/);
  assert.match(boatPage, /Download official catalogue/);
  assert.match(boatData, /Outboard, hidden outboard, shafts or sterndrives/);
  assert.match(boatData, /kumbra-34-deck\.png/);
  assert.match(boatData, /kumbra-36-interior\.png/);
  assert.match(boatData, /kumbra-43-interior\.png/);
  assert.match(boatData, /kumbra-43-helm-clean\.png/);
  assert.match(boatData, /Black-water tank/);
  assert.match(featureCarousel, /Swipe to explore/);
  assert.match(featureCarousel, /scrollTo/);
  assert.match(featureCarousel, /aria-label="Previous feature"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("includes deployment assets and persistent lead storage", async () => {
  await Promise.all([
    access(new URL("public/og.png", root)),
    access(new URL("public/images/cresta-logo-navy.png", root)),
    access(new URL("public/images/kumbra-43-hero-new-CHTLJ7cF.jpg", root)),
    access(new URL("public/images/studio/kumbra-34-white.png", root)),
    access(new URL("public/images/studio/kumbra-36-white.png", root)),
    access(new URL("public/images/studio/kumbra-43-white.png", root)),
    access(new URL("public/images/layouts/kumbra-34-deck.png", root)),
    access(new URL("public/images/layouts/kumbra-34-interior.png", root)),
    access(new URL("public/images/layouts/kumbra-36-deck.png", root)),
    access(new URL("public/images/layouts/kumbra-36-interior.png", root)),
    access(new URL("public/images/layouts/kumbra-43-deck.png", root)),
    access(new URL("public/images/layouts/kumbra-43-interior.png", root)),
    access(new URL("public/images/carousel/k34-social-dining.jpg", root)),
    access(new URL("public/images/carousel/k36-helm.jpg", root)),
    access(new URL("public/images/carousel/kumbra-43-helm-clean.png", root)),
    access(new URL("public/images/partners/contact-finance.avif", root)),
    access(new URL("public/images/my-cresta-app/boats-for-sale.png", root)),
    access(new URL("public/images/my-cresta-app/boat-detail.png", root)),
    access(new URL("public/images/my-cresta-app/login.png", root)),
    access(new URL("public/images/my-cresta-app/my-boat.png", root)),
    access(new URL("public/images/my-cresta-app/boat-status.png", root)),
    access(new URL("public/images/my-cresta-app/request-service.png", root)),
    access(new URL("public/images/my-cresta-app/trip-preparation.png", root)),
    access(new URL("public/images/my-cresta-app/food-and-drinks.png", root)),
    access(new URL("public/brochures/kumbra-34-catalogue.pdf", root)),
    access(new URL("public/brochures/kumbra-36-catalogue.pdf", root)),
    access(new URL("public/brochures/kumbra-43-catalogue.pdf", root)),
    access(new URL("drizzle/0000_blue_vulture.sql", root)),
    access(new URL("dist/server/index.js", root)),
  ]);

  const [hosting, migration] = await Promise.all([
    readFile(new URL(".openai/hosting.json", root), "utf8"),
    readFile(new URL("drizzle/0000_blue_vulture.sql", root), "utf8"),
  ]);

  assert.match(hosting, /"d1": "DB"/);
  assert.match(migration, /CREATE TABLE `leads`/);
  assert.match(migration, /CREATE TABLE `boat_configurations`/);
});
