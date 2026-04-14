import type { Metadata } from "next";
import { Suspense } from "react";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { supabase } from "@/lib/supabase";
import { RestaurantDetailClient } from "./RestaurantDetailClient";

type Props = { params: Promise<{ id: string }> };

type CachedRestaurant = { name: string; cuisine: string | null };

async function getRestaurantMeta(id: string): Promise<CachedRestaurant | null> {
  // 1. Known mock chains — instant, no network call
  const mock = MOCK_RESTAURANTS.find((r) => r.id === id);
  if (mock) return { name: mock.name, cuisine: mock.cuisine };

  // 2. Supabase cache — populated on first client-side view
  try {
    const { data } = await supabase
      .from("restaurant_cache")
      .select("name, cuisine")
      .eq("id", id)
      .single();
    if (data) return data as CachedRestaurant;
  } catch { /* fall through to generic */ }

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await getRestaurantMeta(id);

  const name    = restaurant?.name    ?? "Restaurant";
  const cuisine = restaurant?.cuisine ?? "Restaurant";

  return {
    title:       `${name} Allergy Menu | AllergEats`,
    description: `View the ${name} menu filtered for your food allergies. See which items are safe, need staff confirmation, or should be avoided — powered by AllergEats.`,
    openGraph: {
      title:       `${name} — Allergy-Safe Menu | AllergEats`,
      description: `Explore ${cuisine} dishes at ${name} with your allergy profile applied. Safe, ask, and avoid ratings for every menu item.`,
      type:        "website",
    },
  };
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { id } = await params;
  const restaurant = await getRestaurantMeta(id);
  const mock = MOCK_RESTAURANTS.find((r) => r.id === id);

  const jsonLd = restaurant
    ? {
        "@context":      "https://schema.org",
        "@type":         "Restaurant",
        "name":          restaurant.name,
        "servesCuisine": restaurant.cuisine ?? undefined,
        ...(mock?.address ? { "address":   mock.address } : {}),
        ...(mock?.phone   ? { "telephone": mock.phone   } : {}),
        ...(mock?.website ? { "url":       mock.website } : {}),
        "potentialAction": {
          "@type":  "ViewAction",
          "target": `https://www.allergeats.com/restaurants/${id}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={
        <main style={{ minHeight: "100dvh", background: "var(--c-bg)" }}>
          {/* Sticky header skeleton */}
          <div style={{ height: "max(68px, calc(68px + env(safe-area-inset-top)))", background: "var(--c-hdr)", borderBottom: "1px solid var(--c-border)" }} />
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>
            {/* Hero card skeleton */}
            <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 20, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <div className="skeleton" style={{ height: 148, borderRadius: 0 }} />
              <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 24, width: "55%", marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: "35%", marginBottom: 18 }} />
                <div className="skeleton" style={{ height: 8, borderRadius: 999, marginBottom: 14 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1,2].map((i) => <div key={i} className="skeleton" style={{ height: 48, flex: 1, borderRadius: 12 }} />)}
                </div>
              </div>
            </div>
            {/* Section skeletons */}
            <div className="skeleton" style={{ height: 12, width: 120, marginBottom: 12 }} />
            <div style={{ display: "grid", gap: 8 }}>
              {[0,1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14 }} />)}
            </div>
          </div>
        </main>
      }>
        <RestaurantDetailClient params={params} />
      </Suspense>
    </>
  );
}
