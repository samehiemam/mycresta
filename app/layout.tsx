import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "www.crestamarine.com";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Cresta Marine | Beyond the Day Trip",
      template: "%s",
    },
    description:
      "Cresta Marine is the Kumbra Yachts dealer at Abu Tig Marina, El Gouna. Island-hop the Red Sea, anchor somewhere quiet, and stay the night on board.",
    icons: {
      icon: "/images/cresta-mark-navy.png",
      shortcut: "/images/cresta-mark-navy.png",
    },
    openGraph: {
      title: "Cresta Marine | Beyond the Day Trip",
      description:
        "Cresta Marine is the Kumbra Yachts dealer at Abu Tig Marina, El Gouna. Island-hop the Red Sea, anchor somewhere quiet, and stay the night on board.",
      type: "website",
      url: origin,
      images: [
        {
          // The card is 1200x630. It was declared as 1730x909, which is the
          // size of a card two versions ago; a scraper that trusts the numbers
          // reserves the wrong box for it.
          url: `${origin}/og-cover-3.jpg`,
          width: 1200,
          height: 630,
          alt: "Cresta Marine — the best days do not end at sunset.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Cresta Marine | Beyond the Day Trip",
      description:
        "Cresta Marine is the Kumbra Yachts dealer at Abu Tig Marina, El Gouna. Island-hop the Red Sea, anchor somewhere quiet, and stay the night on board.",
      images: [`${origin}/og-cover-3.jpg`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
