import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.allergeats.com";
  const now  = new Date();

  return [
    // Core app
    { url: base,                                   lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/allergies`,                    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/saved`,                        lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/profile`,                      lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/auth`,                         lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/allergy-card`,                 lastModified: now, changeFrequency: "monthly", priority: 0.5 },

    // SEO landing pages — allergen-specific
    { url: `${base}/gluten-free-restaurants`,      lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/peanut-allergy-restaurants`,   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/dairy-free-restaurants`,       lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/nut-allergy-restaurants`,      lastModified: now, changeFrequency: "weekly",  priority: 0.85 },
    { url: `${base}/egg-allergy-restaurants`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/shellfish-allergy-restaurants`,lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/soy-free-restaurants`,         lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/sesame-allergy-restaurants`,   lastModified: now, changeFrequency: "weekly",  priority: 0.75 },

    // SEO landing pages — audience-specific
    { url: `${base}/food-allergy-app`,             lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/allergy-friendly-restaurants`, lastModified: now, changeFrequency: "weekly",  priority: 0.85 },

    // Legal
    { url: `${base}/privacy`,                      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/terms`,                        lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
