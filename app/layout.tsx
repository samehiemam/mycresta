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
      default: "Cresta Marine | Peak Boating Experience",
      template: "%s",
    },
    description:
      "Cresta Marine delivers the Peak Boating Experience through curated yachts, personal configuration, ownership support and yacht care.",
    icons: {
      icon: "/images/cresta-mark-navy.png",
      shortcut: "/images/cresta-mark-navy.png",
    },
    openGraph: {
      title: "Peak Boating Experience. Own the Sea.",
      description: "Distinctive yachts. One Cresta standard.",
      type: "website",
      url: origin,
      images: [
        {
          url: `${origin}/og.png`,
          width: 1730,
          height: 909,
          alt: "Cresta Marine — Peak Boating Experience. Own the Sea.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Peak Boating Experience. Own the Sea.",
      description: "Distinctive yachts. One Cresta standard.",
      images: [`${origin}/og.png`],
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
