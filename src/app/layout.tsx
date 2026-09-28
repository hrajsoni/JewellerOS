import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JewelleryOS · Liquid Glass Jewellery Management SaaS",
  description:
    "Next-generation Indian jewellery retail operating system with obsidian glass interface, instant counter pricing engine, and verified financial billing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
