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
        <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-bg)", fontSize: 14, color: "#9ca3af" }}>
          Loading…
        </main>
      }>
        <RestaurantDetailClient params={params} />
      </Suspense>
    </>
  );
}
