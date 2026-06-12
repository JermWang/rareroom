import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RareRoom — Trade verified Pokémon cards",
    template: "%s · RareRoom"
  },
  description: "Build your online binder, prove what you own, and swap cards safely with collectors around the world.",
  applicationName: "RareRoom",
  openGraph: {
    title: "RareRoom — Trade verified Pokémon cards",
    description: "Trade verified cards. Build the ultimate binder.",
    type: "website",
    siteName: "RareRoom",
    images: [{ url: "/images/rareroom-logo.png", width: 2752, height: 1536, alt: "RareRoom" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "RareRoom — Trade verified Pokémon cards",
    description: "Trade verified cards. Build the ultimate binder.",
    images: ["/images/rareroom-logo.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#eef7fe",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
