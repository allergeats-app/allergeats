# AllergEats — Agent Context

This file gives Claude Code (and other AI coding agents) the context needed to work effectively on this codebase without re-exploring everything from scratch.

---

## What This Project Is

**AllergEats** is a Next.js 16 web application (not a native iOS app) that helps people with food allergies safely find restaurants and review menus. Users enter their allergies, browse nearby restaurants, and see every menu item scored as **Avoid / Ask Staff / Likely Safe / Unknown**, with auto-generated questions to ask staff.

- No backend database. All user data lives in `localStorage`.
- No authentication. Single-user, device-local.
- No external AI/ML calls. All allergen detection is rule-based, in-browser.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 (utility-first, no component library) |
| Package manager | npm |
| Linting | ESLint 9 |

---

## Repository Map

```
app/
  page.tsx                        # Discovery homepage — AllergEats branding, AllergySelector, CTAs
  layout.tsx                      # Root layout, Geist font, metadata
  globals.css                     # Global CSS resets
  scan/
    page.tsx                      # Manual menu scan page (full scan UI, saved scans, profile tab)
  restaurants/
    page.tsx                      # Restaurant list/discovery page (scored against profile)
    [id]/
      page.tsx                    # Restaurant detail page (menu items grouped by risk)
  api/
    fetch-menu/
      route.ts                    # POST /api/fetch-menu — scrapes menu text from a URL

lib/
  types.ts                        # All shared types (SourceType, Risk, AllergenId, Restaurant, ScoredMenuItem, etc.)
  allergenDB.ts                   # TERM_RULES — explicit term-to-allergen mappings with confidence scores
  allergenDictionary.ts           # ALLERGEN_KEYWORDS — broader keyword map; inferAllergensFromKeywords()
  allergenProfile.ts              # ALLERGEN_LIST, PROFILE_TO_DETECTOR, localStorage helpers for user profile
  detectAllergens.ts              # detectAllergensFromLine() — longest-match term scanner
  inferFromDish.ts                # inferFromDishName() — dish-name pattern inference (Alfredo, Caesar, etc.)
  buildScanInput.ts               # buildScanInput() — joins string[] into newline-separated menu text
  scoreRisk.ts                    # scoreRisk(detected, user, sourceType, isAmbiguous) → Risk
  sourceConfidence.ts             # confidenceFromSource(sourceType) → Confidence; sourceLabel()
  explainRisk.ts                  # explainRisk() → human-readable explanation; buildStaffQuestions()
  scoring.ts                      # scoreMenuItem(), scoreRestaurant() — central scoring pipeline
  mockRestaurants.ts              # MOCK_RESTAURANTS: 5 seeded Restaurant[] with rich menu data
  providers/
    locationProvider.ts           # LocationProvider interface + MockLocationProvider (Haversine distance)
  adapters/
    types.ts                      # MenuAdapter interface
    verified.ts                   # VerifiedMenuAdapter — loads from MOCK_RESTAURANTS by ID
    input.ts                      # InputMenuAdapter — parses raw "Name - Description" text lines

components/
  AllergySelector.tsx             # Toggleable allergen chip grid (client component)
  MenuItemCard.tsx                # Full menu item card with risk, allergens, expandable staff questions
  RestaurantCard.tsx              # Restaurant summary card linking to detail page
  RiskBadge.tsx                   # Colored pill for Risk level
  ConfidenceBadge.tsx             # Colored badge for Confidence level
  SourceBadge.tsx                 # Colored badge for SourceType
  FilterChips.tsx                 # Generic reusable filter chip row component
  EmptyState.tsx                  # Empty state: icon + title + subtitle + optional action

data/
  textMenus.ts                    # TEXT_MENUS: legacy MenuSource[] used by the manual scan page
```

---

## Core Types (`lib/types.ts`)

```typescript
// Data source quality — drives confidence
type SourceType = "official" | "verified-dataset" | "aggregator" | "scraped" | "user-input";

// Risk to this specific user's allergen profile
type Risk = "likely-safe" | "ask" | "avoid" | "unknown";

// Certainty of allergen information
type Confidence = "High" | "Medium" | "Low";

// Profile allergen IDs (UI-facing, maps to detector strings via PROFILE_TO_DETECTOR)
type AllergenId =
  | "peanut" | "tree-nut" | "dairy" | "egg" | "gluten" | "soy"
  | "fish" | "shellfish" | "sesame" | "corn" | "mustard"
  | "sulfite" | "lupin" | "celery";

type RawMenuItem = {
  id: string; name: string; description?: string; category?: string;
  ingredients?: string[]; sourceType: SourceType;
};

type ScoredMenuItem = {
  id: string; name: string; description?: string; category?: string;
  sourceType: SourceType; confidence: Confidence; risk: Risk;
  detectedAllergens: string[];  // Matched explicitly via term rules
  inferredAllergens: string[];  // Inferred from dish name / keyword scan
  inferredReasons: string[];
  triggerTerms: string[];
  explanation: string;          // Human-readable risk explanation
  staffQuestions: string[];     // Ready-to-ask questions for restaurant staff
};

type Restaurant = {
  id: string; name: string; cuisine: string; address?: string;
  lat?: number; lng?: number; distance?: number;
  sourceType: SourceType; menuItems: RawMenuItem[];
};

type ScoredRestaurant = Restaurant & {
  scoredItems: ScoredMenuItem[];
  summary: RestaurantSafetySummary;  // { total, likelySafe, ask, avoid, unknown }
};

// Legacy scan types (used by app/scan/page.tsx)
type Row = { item: string; detected: string[]; hits: string[]; inferredAllergens: string[]; inferredReasons: string[]; confidence: Confidence; staffQuestions: string[]; learned?: boolean; };
type AvoidRow = Row & { hitsAllergens: string[] };
type Results = { safe: Row[]; ask: Row[]; avoid: AvoidRow[] };
type SavedScan = { id: string; createdAt: number; title: string; allergies: string; menuUrl: string; menu: string; results: Results };
type LearnedRule = { id: string; item: string; normalizedItem: string; outcome: "safe" | "avoid" | "unsure"; allergen?: string; createdAt: number };
```

---

## Source Type → Confidence Mapping

| SourceType | Confidence | Meaning |
|------------|-----------|---------|
| `official` | High | From restaurant's own website |
| `verified-dataset` | High | Curated, cross-checked dataset |
| `aggregator` | Medium | Third-party aggregator (Yelp, etc.) |
| `scraped` | Low | Auto-scraped, unverified |
| `user-input` | Low | User-pasted text |

**Risk and Confidence are separate concerns.** High confidence does not mean safe — it means we're certain about the allergen data.

---

## localStorage Keys

| Key | Shape | Notes |
|-----|-------|-------|
| `allegeats_allergies` | `string` | Comma-separated, e.g. `"dairy, egg, nuts"` |
| `allegeats_theme` | `"dark" \| "light"` | Used by scan page |
| `allegeats_saved_scans` | `SavedScan[]` | Capped at 50 entries |
| `allegeats_learned_rules` | `LearnedRule[]` | No size cap |
| `allegeats_profile` | `AllergenId[]` | New profile system (JSON array) |

**Do not rename or restructure these keys** without migrating existing stored data.

---

## Scoring Pipeline

`scoreRestaurant(restaurant, userAllergens)` in `lib/scoring.ts` calls `scoreMenuItem()` per item, which runs:

1. **Term match** — `detectAllergensFromLine()` normalizes the text, runs longest-match-first against `TERM_RULES`. Returns `{ allergens, hits }`.
2. **Dish inference** — `inferFromDishName()` checks item name against dish patterns (Alfredo → dairy, Caesar → egg+fish+dairy, Teriyaki → soy+wheat, etc.).
3. **Keyword inference** — `inferAllergensFromKeywords()` does a broader keyword scan for items that slipped past term rules.
4. **Vague word check** — If any of `["sauce", "seasoning", "blend", "marinade", "secret", "glaze", "dressing", "rub", "may contain"]` appear, `isAmbiguous = true`.
5. **Source quality** — `confidenceFromSource(sourceType)` → `Confidence`.
6. **Risk scoring** — `scoreRisk(detected, userAllergens, sourceType, isAmbiguous)`:
   - Any detected allergen in user's list → `"avoid"`
   - `isAmbiguous` (no hit but vague wording) → `"ask"`
   - High confidence + no hit → `"likely-safe"`
   - No detected allergens at all → `"unknown"`
   - Otherwise (has inferred allergens, medium/low confidence) → `"ask"`
7. **Explanation + questions** — `explainRisk()` and `buildStaffQuestions()` produce the human-readable output.

### AllergenId → Detector String Mapping

Profile allergens (like `"peanut"`, `"tree-nut"`, `"gluten"`) don't match allergenDB strings directly. Use `profileToDetectorAllergens(profile)` from `lib/allergenProfile.ts` to convert before scoring.

```typescript
// Example: "gluten" → "wheat", "tree-nut" → "nuts", "peanut" → "nuts"
const userAllergens = profileToDetectorAllergens(loadProfileAllergens());
```

---

## App Flow

```
/ (Homepage)
  → User sets allergy profile (AllergySelector)
  → "Find Restaurants Near Me" → /restaurants
  → "Scan a Menu Manually" → /scan

/restaurants
  → Lists MOCK_RESTAURANTS sorted by distance/safety
  → Each card links to /restaurants/[id]

/restaurants/[id]
  → Loads restaurant, runs full scoring pipeline against user profile
  → Displays menu items grouped: Avoid → Ask → Unknown → Likely Safe

/scan
  → Legacy manual scan interface
  → Three tabs: Scan (menu input + analysis), Saved, Profile
```

---

## Coding Conventions

- **TypeScript strict** — no `any`, no unsafe assertions
- **Inline styles** — this codebase uses `style={{}}` directly (not Tailwind classes). Do not add Tailwind classes to new components unless the existing file already uses them.
- **No external state library** — all state is `useState` / `useEffect` / `useMemo`
- **No new npm dependencies without discussion**
- **Client components** — any component using hooks or browser APIs must have `"use client"` at the top
- **localStorage always inside `useEffect`** — never at module level or during render

---

## How to Add a Restaurant

Add to `lib/mockRestaurants.ts`:

```typescript
{
  id: "restaurant-slug",
  name: "Restaurant Name",
  cuisine: "Cuisine Type",
  address: "123 Main St, City, ST",
  lat: 37.123, lng: -122.456,
  sourceType: "verified-dataset",
  menuItems: [
    {
      id: "restaurant-slug-item-1",
      name: "Item Name",
      description: "Brief description with key ingredients listed",
      category: "Category",
      sourceType: "verified-dataset",
    },
  ]
}
```

Items should include ingredient descriptions — the more text, the better the detection.

## How to Add an Allergen Term

Edit `lib/allergenDB.ts`, add to `TERM_RULES`:

```typescript
{ term: "your-term", allergens: ["dairy"], confidence: 5 }
```

Use confidence 5 for unambiguous ingredient names, 4 for very common associations, 3 for probable.

---

## Known Technical Debt

| Issue | Notes |
|-------|-------|
| No tests | Detection logic in `lib/` is pure and easy to unit test |
| 5 pre-loaded restaurants | Easy to expand `lib/mockRestaurants.ts` |
| URL scraping is best-effort | `app/api/fetch-menu/route.ts` has no retry or structured parsing |
| No CI/CD | Manual QA only |
| `app/scan/page.tsx` is large | Legacy monolith — functional but dense |

---

## Do Not

- Do not rename `localStorage` keys without adding a migration
- Do not remove the four-tier risk system (avoid / ask / likely-safe / unknown)
- Do not use `"safe-ish"` — the correct Risk value is `"likely-safe"`
- Do not conflate Risk and Confidence — they are separate dimensions
- Do not add a backend database or user auth without a clear product reason
- Do not add new npm packages without confirming with the user
- Do not access `localStorage` at module level or in render — always inside `useEffect`

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build check
npm run lint       # ESLint
```

Manual verification: set "dairy" as your allergy on the homepage, go to Restaurants, open McDonald's, and confirm the Big Mac appears in Avoid.
