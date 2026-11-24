import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "../components/pwa/PwaRegister";

export const metadata: Metadata = {
  title: "JewelleryOS · Liquid Glass Jewellery Management SaaS",
  description:
    "Next-generation Indian jewellery retail operating system with obsidian glass interface, instant counter pricing engine, and verified financial billing.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JewelleryOS",
  },
};

export const viewport: Viewport = {
  themeColor: "#08090C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
