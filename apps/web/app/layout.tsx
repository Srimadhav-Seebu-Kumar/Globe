import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const defaultSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
