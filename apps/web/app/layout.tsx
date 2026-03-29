import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: false
});

const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://54.91.200.14:3000";

export const metadata: Metadata = {
  title: "Globe Land Intelligence",
  description: "Verified land intelligence platform with parcel context, pricing observations, and legal-display controls.",
  metadataBase: new URL(defaultSiteUrl),
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Globe Land Intelligence",
    description: "Parcel-aware land intelligence with confidence, freshness, and compliance signals.",
    type: "website",
    url: "/"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-to-main">Skip to main content</a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
