import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.allergeats.com";
  const now  = new Date();

  return [
    { url: base,              lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/scan`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/saved`,   lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/allergies`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/profile`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/auth`,    lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
