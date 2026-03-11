/**
 * lib/analysis/analyzeNormalizedMenu.ts
 *
 * Core analysis pipeline — takes a NormalizedMenu (or a legacy Restaurant)
 * and returns a RestaurantMenuAnalysis consumable by the UI.
 *
 * IMPORTANT: all scoring logic lives in lib/scoring.ts and the engine layer.
 * This module is purely orchestration and structural mapping — no new scoring.
 *
 * Two entry points:
 *   analyzeNormalizedMenu(menu, userAllergens, opts?)
 *     → For menus that came through the ingestion pipeline.
 *       Preserves per-item source confidence and structured sections.
 *
 *   analyzeRestaurant(restaurant, userAllergens)
 *     → Backward-compatible bridge for the existing Restaurant / MOCK_RESTAURANTS path.
 *       Uses scoreRestaurant() under the hood; upgrades the result to RestaurantMenuAnalysis.
 */

import { scoreMenuItem, scoreRestaurant, coverageTier, coverageTierLabel } from "@/lib/scoring";
import { INGESTION_SOURCE_TO_LEGACY } from "@/lib/menu-ingestion/types";
import type { NormalizedMenu } from "@/lib/menu-ingestion/types";
import type { Restaurant, AllergenId, SourceType } from "@/lib/types";
import type {
  AnalyzedMenuItem,
  AnalyzedMenuSection,
  RestaurantMenuAnalysis,
  MenuCoverageInfo,
} from "./types";
import type { SourceConfidence, MenuIngestionSourceType } from "@/lib/menu-ingestion/types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildTrustSignal(sourceType: MenuIngestionSourceType, sourceConfidence: SourceConfidence): string {
  switch (sourceType) {
    case "official_api":
    case "verified_dataset":
      return "Official source, high confidence";
    case "aggregator_api":
      return "Structured data source";
    case "website_html":
      return sourceConfidence === "high" ? "Website menu, verified" : "Website menu";
    case "pdf":
      return "PDF-extracted menu";
    case "image":
      return "Image-derived menu, lower confidence";
    case "user_upload":
      return "User-provided menu text";
  }
}

function buildCoverage(
  totalItems: number,
  sourceType: MenuIngestionSourceType,
  sourceConfidence: SourceConfidence,
): MenuCoverageInfo {
  const tier   = coverageTier(totalItems);
  const label  = coverageTierLabel(totalItems);
  const signal = buildTrustSignal(sourceType, sourceConfidence);
  return {
    totalItems,
    tier,
    label,
    sourceType,
    sourceConfidence,
    trustSignal: signal,
    coverageLine: `${totalItems} item${totalItems === 1 ? "" : "s"} · ${signal}`,
  };
}

function sourceTypeToIngestionConfidence(sourceType: SourceType): SourceConfidence {
  switch (sourceType) {
    case "official":
    case "verified-dataset":
      return "high";
    case "aggregator":
      return "medium";
    default:
      return "low";
  }
}

function legacySourceToIngestionSource(sourceType: SourceType): MenuIngestionSourceType {
  switch (sourceType) {
    case "official":         return "official_api";
    case "verified-dataset": return "verified_dataset";
    case "aggregator":       return "aggregator_api";
    case "scraped":          return "website_html";
    case "user-input":       return "user_upload";
  }
}

function buildSectionSummary(items: AnalyzedMenuItem[]): Pick<AnalyzedMenuSection, "safeCount" | "askCount" | "avoidCount"> {
  return {
    safeCount:  items.filter((i) => i.risk === "likely-safe").length,
    askCount:   items.filter((i) => i.risk === "ask").length,
    avoidCount: items.filter((i) => i.risk === "avoid").length,
  };
}

// ─── Main analysis functions ──────────────────────────────────────────────────

/**
 * Analyze a NormalizedMenu against the user's allergen profile.
 *
 * Preserves:
 *   - Section structure from ingestion
 *   - Per-item source confidence from ingestion
 *   - Official allergen arrays (bypassing text inference for official_api/aggregator_api items)
 *
 * @param menu           Output of ingestMenu() / ingestFromHtml() etc.
 * @param userAllergens  User's allergy profile
 * @param opts.cuisine   Restaurant cuisine string (for cuisine-based inference)
 * @param opts.menuVersionId  DB version ID for future cross-referencing
 */
export function analyzeNormalizedMenu(
  menu: NormalizedMenu,
  userAllergens: AllergenId[],
  opts: { cuisine?: string; menuVersionId?: string } = {},
): RestaurantMenuAnalysis {
  const legacySource  = INGESTION_SOURCE_TO_LEGACY[menu.sourceType];
  const cuisineContext = opts.cuisine ?? menu.restaurantName;
  const analyzedAt    = new Date().toISOString();

  const sections: AnalyzedMenuSection[] = menu.sections.map((section) => {
    const items: AnalyzedMenuItem[] = section.items.map((normItem) => {
      const scored = scoreMenuItem(
        {
          id:          normItem.itemId,
          name:        normItem.itemName,
          description: normItem.description,
          category:    section.sectionName,
          sourceType:  legacySource,
          allergens:   normItem.allergens,
        },
        legacySource,
        userAllergens,
        cuisineContext,
      );

      return {
        ...scored,
        sectionName:         section.sectionName,
        itemId:              normItem.itemId,
        ingestionConfidence: normItem.sourceConfidence,
      };
    });

    return { sectionName: section.sectionName, items, ...buildSectionSummary(items) };
  });

  const allItems = sections.flatMap((s) => s.items);

  const summary = {
    likelySafe: allItems.filter((i) => i.risk === "likely-safe").length,
    ask:        allItems.filter((i) => i.risk === "ask").length,
    avoid:      allItems.filter((i) => i.risk === "avoid").length,
    unknown:    allItems.filter((i) => i.risk === "unknown").length,
    total:      allItems.length,
  };

  return {
    restaurantId:   menu.restaurantId,
    restaurantName: menu.restaurantName,
    cuisine:        opts.cuisine ?? "",
    analyzedAt,
    menuVersionId:  opts.menuVersionId,
    sections,
    allItems,
    summary,
    coverage: buildCoverage(allItems.length, menu.sourceType, menu.confidence),
  };
}

/**
 * Backward-compatible bridge for existing Restaurant objects (MOCK_RESTAURANTS / sessionStorage).
 *
 * Uses scoreRestaurant() exactly as before but upgrades the result shape to
 * RestaurantMenuAnalysis so the UI can use buildDetailViewModel() uniformly.
 */
export function analyzeRestaurant(
  restaurant: Restaurant,
  userAllergens: AllergenId[],
): RestaurantMenuAnalysis {
  const scored     = scoreRestaurant(restaurant, userAllergens);
  const analyzedAt = new Date().toISOString();
  const ingestionSource = legacySourceToIngestionSource(restaurant.sourceType);
  const ingestionConf   = sourceTypeToIngestionConfidence(restaurant.sourceType);

  // Group items into sections by category
  const categoryMap = new Map<string, AnalyzedMenuItem[]>();
  for (const item of scored.scoredItems) {
    const cat = item.category ?? "Menu";
    let catItems = categoryMap.get(cat);
    if (!catItems) { catItems = []; categoryMap.set(cat, catItems); }
    catItems.push({
      ...item,
      sectionName:         cat,
      itemId:              item.id,
      ingestionConfidence: ingestionConf,
    });
  }

  const sections: AnalyzedMenuSection[] = Array.from(categoryMap.entries()).map(
    ([sectionName, items]) => ({ sectionName, items, ...buildSectionSummary(items) }),
  );

  const allItems = sections.flatMap((s) => s.items);

  return {
    restaurantId:   restaurant.id,
    restaurantName: restaurant.name,
    cuisine:        restaurant.cuisine,
    analyzedAt,
    sections,
    allItems,
    summary:  scored.summary,
    coverage: buildCoverage(allItems.length, ingestionSource, ingestionConf),
  };
}
