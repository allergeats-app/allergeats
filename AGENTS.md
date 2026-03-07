# AllergEats — Agent Context

This file gives Claude Code (and other AI coding agents) the context needed to work effectively on this codebase without re-exploring everything from scratch.

---

## What This Project Is

**AllergEats** is a Next.js 16 web application (not a native iOS app) that helps people with food allergies safely review restaurant menus. Users enter their allergies, load a menu, and get a three-tier breakdown: **Avoid / Ask Staff / Safe**, with auto-generated questions to ask restaurant staff.

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
  page.tsx              # Main app component — all UI, state, and scan logic (~1300 lines)
  layout.tsx            # Root layout, Geist font, metadata
  globals.css           # Global CSS resets and base styles
  api/
    fetch-menu/
      route.ts          # POST /api/fetch-menu — scrapes menu text from a URL

lib/
  types.ts              # MenuSource, ImportedMenuRow (shared data types)
  allergenDB.ts         # TERM_RULES array — explicit term-to-allergen mappings with confidence scores
  allergenDictionary.ts # ALLERGEN_KEYWORDS — broader keyword map; inferAllergensFromKeywords()
  detectAllergens.ts    # detectAllergensFromLine() — longest-match term scanner
  inferFromDish.ts      # inferFromDishName() — dish-name pattern inference (Alfredo, Caesar, etc.)
  buildScanInput.ts     # buildScanInput() — joins string[] into newline-separated menu text

data/
  textMenus.ts          # TEXT_MENUS: pre-loaded MenuSource[] for McDonald's, Chipotle, Subway
```

---

## Data Models

These types are defined **inline in `app/page.tsx`** (not yet moved to `lib/types.ts`):

```typescript
type Confidence = "High" | "Medium" | "Low";

type Row = {
  item: string;
  detected: string[];         // Allergens found by explicit term match
  hits: string[];             // The exact trigger terms matched
  inferredAllergens: string[];// Allergens from dish-name inference
  inferredReasons: string[]; // Human-readable reasons for inference
  confidence: Confidence;
  staffQuestions: string[];   // Ready-to-use questions for restaurant staff
  learned?: boolean;          // true if outcome came from user's learned rules
};

type AvoidRow = Row & {
  hitsAllergens: string[];    // Which of the user's allergens triggered Avoid
};

type Results = {
  safe: Row[];
  ask: Row[];
  avoid: AvoidRow[];
};

type SavedScan = {
  id: string;
  createdAt: number;          // Unix timestamp ms
  title: string;
  allergies: string;          // Comma-separated user allergens at time of scan
  menuUrl: string;
  menu: string;               // Raw menu text
  results: Results;
};

type LearnedRule = {
  id: string;
  item: string;               // Original item name
  normalizedItem: string;     // Lowercased, punctuation-stripped, whitespace-collapsed
  outcome: "safe" | "avoid" | "unsure";
  allergen?: string;          // Only set when outcome === "avoid"
  createdAt: number;
};
```

Types shared across lib files (in `lib/types.ts`):

```typescript
type MenuSource = {
  id: string;
  restaurant: string;
  category: string;
  url?: string;
  location?: string;
  items: string[];
};
```

Allergen types (in `lib/allergenDB.ts`):

```typescript
type Allergen = "dairy" | "egg" | "soy" | "wheat" | "fish" | "shellfish" | "nuts" | "sesame" | "corn" | "mustard";

type TermRule = {
  term: string;
  allergens: Allergen[];
  confidence: number; // 1–5
  note?: string;
};
```

---

## localStorage Keys

| Key | Shape | Notes |
|-----|-------|-------|
| `allegeats_allergies` | `string` | Comma-separated, e.g. `"dairy, egg, nuts"` |
| `allegeats_theme` | `"dark" \| "light"` | |
| `allegeats_saved_scans` | `SavedScan[]` | Capped at 50 entries |
| `allegeats_learned_rules` | `LearnedRule[]` | No size cap |

**Do not rename or restructure these keys** without migrating existing stored data — users will lose their scan history and learned rules.

---

## Detection Pipeline (Step by Step)

For each line of menu text:

1. **Term match** — `detectAllergensFromLine()` normalizes the text (lowercase, strip punctuation, collapse whitespace) then runs longest-match-first against `TERM_RULES`. Returns `{ allergens, hits }`.

2. **Dish inference** — `inferFromDishName()` checks the item name against known dish patterns using string includes/regex. Returns `{ allergens, reasons }` for dishes like Alfredo (dairy), Caesar (egg + fish + dairy), Teriyaki (soy + wheat), Carbonara (egg + dairy), etc.

3. **Keyword inference** — `inferAllergensFromKeywords()` does a broader keyword scan for items that slipped past term rules.

4. **Learned rules** — The item is normalized and checked against the user's `LearnedRule[]`. A matching rule overrides all above results.

5. **Vague word escalation** — Items containing words from `VAGUE_WORDS` (`"sauce"`, `"marinade"`, `"secret"`, `"blend"`, `"dressing"`, `"rub"`, `"may contain"`, etc.) get escalated to Ask Staff even if nothing was detected.

6. **Categorization** — If any of the user's allergens appear in `detected` → **Avoid**. Else if `inferredAllergens` are present, vague words matched, or confidence is Low/Medium → **Ask Staff**. Otherwise → **Safe**.

---

## Confidence Scoring

Confidence is derived from `TermRule.confidence` (1–5):

| Score | Confidence level | Typical use |
|-------|-----------------|-------------|
| 4–5 | High | Explicit ingredient name (milk, egg, shrimp) |
| 2–3 | Medium | Common but not universal (pesto, aioli, bread) |
| 1 | Low | Speculative |

Dish inference always produces Medium confidence. Learned rules produce High.

---

## Coding Conventions

- **TypeScript strict mode** — no `any`, no type assertions without good reason
- **Tailwind for all styling** — no inline `style={{}}` unless Tailwind can't express it
- **No external state library** — all state is `useState` / `useEffect` / `useMemo` in `page.tsx`
- **No new npm dependencies without discussion** — the dep footprint is intentionally minimal
- **Client components only** — `page.tsx` uses `"use client"`. The only server-side code is `app/api/fetch-menu/route.ts`.
- **localStorage access always guarded** — wrap in `typeof window !== "undefined"` checks or inside `useEffect` to avoid SSR errors

---

## How to Add an Allergen Term

Edit `lib/allergenDB.ts` and add to `TERM_RULES`:

```typescript
{ term: "your-term", allergens: ["dairy"], confidence: 5 }
```

Use confidence 5 for unambiguous ingredient names, 4 for very common associations, 3 for probable, 2 for possible.

## How to Add a Restaurant

Edit `data/textMenus.ts` and add a `MenuSource` object to the `TEXT_MENUS` array:

```typescript
{
  id: "restaurant-slug",
  restaurant: "Restaurant Name",
  category: "Fast Food",
  items: [
    "Item Name - brief description mentioning key ingredients",
  ]
}
```

Items should include ingredient descriptions where possible — the more text, the better the detection.

## How to Add a Dish Inference Pattern

Edit `lib/inferFromDish.ts`. Each pattern follows this shape:

```typescript
if (name.includes("keyword")) {
  guesses.push({
    ingredients: ["ingredient1", "ingredient2"],
    allergens: ["dairy", "egg"],
    reason: "Keyword dishes typically contain ingredient1 and ingredient2"
  });
}
```

---

## Known Technical Debt

| Issue | Impact | Notes |
|-------|--------|-------|
| `app/page.tsx` is ~1300 lines | Hard to navigate | Good candidate for decomposition into `components/` |
| `Row`, `Results`, `SavedScan`, `LearnedRule` types in `page.tsx` | Not reusable | Should move to `lib/types.ts` |
| No tests | Regressions undetected | Detection logic in `lib/` is pure and easy to unit test |
| 3 pre-loaded restaurants | Limited utility | Easy to expand `data/textMenus.ts` |
| URL scraping is best-effort | Inconsistent results | `app/api/fetch-menu/route.ts` has no retry or structured parsing |
| No CI/CD | Manual QA only | |

---

## Do Not

- Do not rename `localStorage` keys without adding a migration
- Do not remove the three-tier categorization (safe / ask / avoid) — it is core to the UX
- Do not add a backend database or user auth without a clear product reason
- Do not add new npm packages without confirming with the user — this is an intentionally lean stack
- Do not use `style={{}}` inline styles for layout — use Tailwind classes
- Do not access `localStorage` at module level or in render — always inside `useEffect`

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build check
npm run lint       # ESLint
```

There are no automated tests. Manual verification: enter "dairy" as your allergy, load the McDonald's menu, and confirm the Big Mac appears in Avoid (cheese, butter) and Vanilla Cone appears in Avoid (milk, cream).
