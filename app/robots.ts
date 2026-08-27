import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_supabase/", "/monitoring/"],
      },
    ],
    sitemap: "https://www.allergeats.com/sitemap.xml",
  };
}
