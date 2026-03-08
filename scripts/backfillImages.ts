#!/usr/bin/env tsx
// scripts/backfillImages.ts
// Admin script to backfill missing restaurant images for all known restaurants.
//
// Usage:
//   npx tsx scripts/backfillImages.ts
//   npx tsx scripts/backfillImages.ts --force   # re-fetch even if cached
//   npx tsx scripts/backfillImages.ts --dry-run  # print what would be fetched
//
// Requires GOOGLE_PLACES_API_KEY (and optionally YELP_API_KEY) in environment.

import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { getRestaurantImage } from "@/lib/image/restaurantImageService";
import type { RestaurantImageInput } from "@/lib/image/types";

const args = process.argv.slice(2);
const forceRefresh = args.includes("--force");
const dryRun = args.includes("--dry-run");

function restaurantToInput(r: (typeof MOCK_RESTAURANTS)[0]): RestaurantImageInput {
  return {
    name:    r.name,
    cuisine: r.cuisine,
    // Add address/lat/lng/phone/website when available on the Restaurant type
    lat:     r.lat,
    lng:     r.lng,
    address: r.address,
    phone:   (r as { phone?: string }).phone,
    website: (r as { website?: string }).website,
  } as RestaurantImageInput;
}

async function run() {
  console.log(`\n🖼  AllergEats Image Backfill`);
  console.log(`   Restaurants: ${MOCK_RESTAURANTS.length}`);
  console.log(`   Force refresh: ${forceRefresh}`);
  console.log(`   Dry run: ${dryRun}\n`);

  const results: Array<{ name: string; source: string; confidence: string; url: string | null }> = [];

  for (const restaurant of MOCK_RESTAURANTS) {
    const input = restaurantToInput(restaurant);
    console.log(`→ Processing: ${restaurant.name}`);

    if (dryRun) {
      console.log(`   [dry-run] would fetch image for ${restaurant.name}`);
      continue;
    }

    try {
      const result = await getRestaurantImage(input, { skipCache: forceRefresh });
      results.push({
        name:       restaurant.name,
        source:     result.source,
        confidence: result.confidence,
        url:        result.imageUrl,
      });
      console.log(
        `   ✓ ${result.source} (${result.confidence})` +
        (result.cached ? " [cached]" : " [fresh]") +
        (result.imageUrl ? ` → ${result.imageUrl.slice(0, 80)}…` : " → no image")
      );
    } catch (err) {
      console.error(`   ✗ Error:`, err);
      results.push({ name: restaurant.name, source: "error", confidence: "low", url: null });
    }

    // Rate limit: 2 restaurants per second
    await new Promise((r) => setTimeout(r, 500));
  }

  // Summary
  if (!dryRun) {
    console.log("\n── Summary ──────────────────────────────────────────");
    const bySource = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.source] = (acc[r.source] ?? 0) + 1;
      return acc;
    }, {});
    for (const [source, count] of Object.entries(bySource)) {
      console.log(`   ${source.padEnd(16)} ${count}`);
    }
    const withImages = results.filter((r) => r.url).length;
    console.log(`\n   ${withImages}/${results.length} restaurants have images\n`);
  }
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
