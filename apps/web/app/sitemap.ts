import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://54.91.200.14:3000";

const createUrl = (path: string): string => `${siteUrl}${path}`;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: createUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: createUrl("/about"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: createUrl("/methodology"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: createUrl("/data-sources"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: createUrl("/legal-display"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7
    }
  ];
}
