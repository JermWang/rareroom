import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RareRoom — Trade verified Pokémon cards",
  description: "Build your online binder, prove what you own, and swap cards safely with collectors around the world.",
  applicationName: "RareRoom",
  openGraph: {
    title: "RareRoom",
    description: "Trade verified cards. Build the ultimate binder.",
    type: "website"
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
