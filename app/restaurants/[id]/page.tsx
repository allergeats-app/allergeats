import type { Metadata } from "next";
import { Suspense } from "react";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { RestaurantDetailClient } from "./RestaurantDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Try to resolve from the known mock restaurant list (server-safe).
  // Dynamic/live restaurants only exist in the client's localStorage, so
  // we fall back to a generic template for those IDs.
  const mock = MOCK_RESTAURANTS.find((r) => r.id === id);
  const name    = mock?.name    ?? "Restaurant";
  const cuisine = mock?.cuisine ?? "Restaurant";

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
  const mock = MOCK_RESTAURANTS.find((r) => r.id === id);

  const jsonLd = mock
    ? {
        "@context": "https://schema.org",
        "@type":    "Restaurant",
        "name":     mock.name,
        "servesCuisine": mock.cuisine,
        ...(mock.address ? { "address": mock.address } : {}),
        ...(mock.phone   ? { "telephone": mock.phone  } : {}),
        ...(mock.website ? { "url": mock.website       } : {}),
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
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-bg)", fontSize: 14, color: "#9ca3af" }}>
          Loading…
        </main>
      }>
        <RestaurantDetailClient params={params} />
      </Suspense>
    </>
  );
}
