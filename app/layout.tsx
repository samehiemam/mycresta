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
      title: "Beyond the day trip. Wake up to the waves.",
      description: "Distinctive yachts. One Cresta standard.",
      type: "website",
      url: origin,
      images: [
        {
          url: `${origin}/og-cover-2.jpg`,
          width: 1730,
          height: 909,
          alt: "Cresta Marine — Beyond the day trip. Wake up to the waves.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Beyond the day trip. Wake up to the waves.",
      description: "Distinctive yachts. One Cresta standard.",
      images: [`${origin}/og-cover-2.jpg`],
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
