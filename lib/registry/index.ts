/**
 * lib/registry/index.ts
 *
 * Public API for the canonical restaurant registry.
 *
 * Typical usage (location provider registering a discovered restaurant):
 *   import { upsertRestaurant } from "@/lib/registry";
 *   const canonical = upsertRestaurant({
 *     displayName: "Chipotle Mexican Grill",
 *     address: "123 Market St, San Francisco, CA",
 *     lat: 37.7749, lng: -122.4194,
 *     osmId: "node/12345678",
 *     sourceType: "osm",
 *     confidence: "medium",
 *   });
 *   // canonical.registryId is now the stable ID for this restaurant
 */

// Types
export type {
  RegistrySourceType,
  RegistrySourceRef,
  DedupeSignal,
  CanonicalRestaurant,
  RestaurantCandidate,
} from "./types";

// Normalization utilities (useful for callers building candidates)
export { normalizeName, normalizeAddress, normalizePhone, extractDomain } from "./normalize";

// Registry operations
export {
  upsertRestaurant,
  getByExternalId,
  getByRegistryId,
  getAllRecords,
  pruneStaleRecords,
  beginRegistryBatch,
  endRegistryBatch,
} from "./registry";
