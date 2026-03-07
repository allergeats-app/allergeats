import type { Confidence, SourceType } from "./types";

/**
 * Maps a source type to a confidence level.
 * Confidence = how certain we are in the data — NOT how safe the item is.
 * A High-confidence source can still contain allergens.
 */
export function confidenceFromSource(sourceType: SourceType): Confidence {
  switch (sourceType) {
    case "official":
    case "verified-dataset":
      return "High";
    case "aggregator":
      return "Medium";
    case "scraped":
    case "user-input":
      return "Low";
  }
}

export function sourceLabel(sourceType: SourceType): string {
  switch (sourceType) {
    case "official":         return "Official";
    case "verified-dataset": return "Verified";
    case "aggregator":       return "Aggregator";
    case "scraped":          return "Unavailable";
    case "user-input":       return "User-entered";
  }
}
