import type { MetadataRoute } from "next";

const siteUrl = "https://pyinthesky.github.io/astrophoto";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/sky-planner/`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/trip-planner/`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/targets/`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/lightroom-presets/`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/calculators/`,
      lastModified: new Date("2026-09-03"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
