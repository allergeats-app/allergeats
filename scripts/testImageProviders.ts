#!/usr/bin/env tsx
// scripts/testImageProviders.ts
// Manual test harness for the image provider system.
// Tests both chain restaurants and local/independent restaurants.
//
// Usage:
//   npx tsx scripts/testImageProviders.ts
//   npx tsx scripts/testImageProviders.ts --provider=website
//   npx tsx scripts/testImageProviders.ts --provider=google_places
//   npx tsx scripts/testImageProviders.ts --provider=yelp

import type { RestaurantImageInput } from "@/lib/image/types";
import { websiteImageProvider } from "@/lib/image/providers/websiteImageProvider";
import { googlePlacesImageProvider } from "@/lib/image/providers/googlePlacesImageProvider";
import { yelpImageProvider } from "@/lib/image/providers/yelpImageProvider";
import { getRestaurantImage } from "@/lib/image/restaurantImageService";

const args = process.argv.slice(2);
const onlyProvider = args.find((a) => a.startsWith("--provider="))?.split("=")[1];

// ── Test cases ───────────────────────────────────────────────────────────────

const TEST_CASES: Array<{ label: string; input: RestaurantImageInput }> = [
  // Chain restaurants — should match via Google Places with high confidence
  {
    label: "McDonald's (chain, by lat/lng)",
    input: {
      name:    "McDonald's",
      address: "1000 Market St",
      city:    "San Francisco",
      state:   "CA",
      lat:     37.7785,
      lng:     -122.4137,
      website: "https://www.mcdonalds.com",
    },
  },
  {
    label: "Chipotle (chain, by lat/lng)",
    input: {
      name:    "Chipotle Mexican Grill",
      address: "300 Post St",
      city:    "San Francisco",
      state:   "CA",
      lat:     37.7879,
      lng:     -122.4072,
      website: "https://www.chipotle.com",
    },
  },
  {
    label: "Starbucks (chain, has og:image on website)",
    input: {
      name:    "Starbucks",
      address: "1 Market St",
      city:    "San Francisco",
      state:   "CA",
      lat:     37.7941,
      lng:     -122.3950,
      website: "https://www.starbucks.com",
    },
  },
  // Independent restaurant — tests website og:image extraction
  {
    label: "Shake Shack (semi-chain, has website)",
    input: {
      name:    "Shake Shack",
      address: "816 Mission St",
      city:    "San Francisco",
      state:   "CA",
      lat:     37.7836,
      lng:     -122.4057,
      website: "https://www.shakeshack.com",
    },
  },
  // Edge case: no website, no coordinates — tests address-only matching
  {
    label: "Generic Pizza Place (no website, address only)",
    input: {
      name:    "Tony's Pizza Napoletana",
      address: "1570 Stockton St",
      city:    "San Francisco",
      state:   "CA",
    },
  },
  // Edge case: chain name variant — tests name normalization
  {
    label: "Chick-fil-A (name variant)",
    input: {
      name:    "Chick-fil-A",
      address: "3251 20th Ave",
      city:    "San Francisco",
      state:   "CA",
      website: "https://www.chick-fil-a.com",
    },
  },
  // Edge case: no info except name — worst case
  {
    label: "Name only (no location)",
    input: {
      name: "La Taqueria",
    },
  },
];

// ── Runner ───────────────────────────────────────────────────────────────────

type ProviderFn = (input: RestaurantImageInput) => Promise<unknown>;

const PROVIDERS: Record<string, ProviderFn> = {
  website:       websiteImageProvider as ProviderFn,
  google_places: googlePlacesImageProvider as ProviderFn,
  yelp:          yelpImageProvider as ProviderFn,
};

async function runTest(
  label: string,
  input: RestaurantImageInput,
  providerName?: string
) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`TEST: ${label}`);
  console.log(`${"─".repeat(60)}`);

  if (providerName) {
    const fn = PROVIDERS[providerName];
    if (!fn) { console.error(`Unknown provider: ${providerName}`); return; }
    const start = Date.now();
    const result = await fn(input).catch((e: Error) => ({ error: e.message }));
    console.log(`Provider: ${providerName} (${Date.now() - start}ms)`);
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Full orchestrator
    const start = Date.now();
    const result = await getRestaurantImage(input, { skipCache: true });
    console.log(`Full orchestrator (${Date.now() - start}ms)`);
    console.log(`  Source:     ${result.source}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Cached:     ${result.cached}`);
    console.log(`  Image:      ${result.imageUrl?.slice(0, 100) ?? "null"}`);
    if (result.attribution) console.log(`  Attribution: ${result.attribution}`);
    if (result.matchedName)  console.log(`  Matched:    ${result.matchedName}`);
  }
}

async function run() {
  console.log(`\n🧪 AllergEats Image Provider Tests`);
  if (onlyProvider) console.log(`   Provider filter: ${onlyProvider}`);
  console.log(`   Test cases: ${TEST_CASES.length}\n`);

  for (const { label, input } of TEST_CASES) {
    await runTest(label, input, onlyProvider);
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log("Done.");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
