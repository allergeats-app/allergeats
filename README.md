# AllergEats

A web app that helps people with food allergies safely navigate restaurant menus. Paste or load a menu, enter your allergies, and get an instant breakdown of what to avoid, what to ask about, and what looks safe — along with ready-to-use questions to ask restaurant staff.

**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4

---

## Features

- **Allergy management** — Enter any allergies as comma-separated text, or tap quick-select buttons for the 10 most common allergens (dairy, egg, soy, wheat, fish, shellfish, nuts, sesame, corn, mustard)
- **Menu input** — Load from pre-built restaurant database, paste a URL to auto-fetch, or type/paste menu text directly
- **Three-tier scan output**
  - **Avoid** — explicit allergen terms detected in the item
  - **Ask Staff** — inferred allergens, vague descriptions ("secret sauce", "house dressing"), or medium-confidence matches
  - **Safe** — no allergens detected or inferred
- **Confidence levels** — High / Medium / Low based on how the allergen was identified (explicit term vs. dish inference vs. keyword)
- **Staff questions** — Auto-generated contextual questions to ask restaurant staff, with one-tap clipboard copy
- **Learning from experience** — Mark items as Safe / Unsure / Avoid after eating; those rules apply to all future scans
- **Scan history** — Save up to 50 scans; reload any previous scan at any time
- **Dark / Light mode** — Persisted per device

All data is stored locally in the browser — no account, no server, no data leaves the device.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
allegeats/
├── app/
│   ├── api/
│   │   └── fetch-menu/route.ts   # POST endpoint: fetches & extracts text from a menu URL
│   ├── page.tsx                  # Main application component (~1300 lines)
│   ├── layout.tsx                # Root layout, Geist font
│   └── globals.css               # Global styles
├── lib/
│   ├── types.ts                  # MenuSource, ImportedMenuRow
│   ├── allergenDB.ts             # TERM_RULES: explicit allergen → term mappings with confidence scores
│   ├── allergenDictionary.ts     # ALLERGEN_KEYWORDS: broader keyword inference
│   ├── detectAllergens.ts        # detectAllergensFromLine(): term-match engine
│   ├── inferFromDish.ts          # inferFromDishName(): dish-pattern inference (Alfredo, Caesar, etc.)
│   └── buildScanInput.ts         # Joins menu item array into newline-separated string
├── data/
│   └── textMenus.ts              # Pre-loaded menus: McDonald's, Chipotle, Subway
├── package.json
├── tsconfig.json
├── next.config.ts
└── postcss.config.mjs
```

---

## Detection Pipeline

Each menu item passes through three detection layers, then gets categorized:

1. **Term matching** (`detectAllergensFromLine`) — scans the item text against `TERM_RULES` using longest-match-first. Returns matched allergens and the exact trigger terms. Confidence 4-5 → High; 1-3 → Medium.

2. **Dish inference** (`inferFromDishName`) — pattern-matches dish names against known recipes (e.g., Alfredo → dairy; Caesar → egg + fish + dairy; Teriyaki → soy + wheat). Returns guessed allergens with human-readable reasons.

3. **Keyword inference** (`inferAllergensFromKeywords`) — broader keyword scan for cases the term rules miss.

4. **Learned rules** — checks the user's saved outcome history; if this exact item (normalized) was previously marked, that outcome overrides all other logic.

5. **Vague word check** — items containing words like "sauce", "marinade", "secret", "blend" are escalated to "Ask Staff" even if no allergen was found.

**Categorization:**
- Any explicitly detected user allergen → **Avoid**
- Inferred allergen, vague description, or lower confidence → **Ask Staff**
- Nothing found → **Safe**

---

## Data Persistence

All state is stored in `localStorage` under these keys:

| Key | Contents |
|-----|----------|
| `allegeats_allergies` | User's allergy string (comma-separated) |
| `allegeats_theme` | `"dark"` or `"light"` |
| `allegeats_saved_scans` | Array of `SavedScan` objects (max 50) |
| `allegeats_learned_rules` | Array of `LearnedRule` objects |

---

## Adding Restaurants

Add entries to [data/textMenus.ts](data/textMenus.ts). Each entry follows the `MenuSource` type from [lib/types.ts](lib/types.ts):

```typescript
{
  id: "unique-id",
  restaurant: "Restaurant Name",
  category: "Category",
  url: "https://optional-menu-url",
  items: [
    "Item Name - Description with ingredients",
    ...
  ]
}
```

---

## Adding Allergen Terms

Add new entries to the `TERM_RULES` array in [lib/allergenDB.ts](lib/allergenDB.ts):

```typescript
{ term: "new-term", allergens: ["dairy"], confidence: 5 }
```

Confidence scale: `5` = certain, `4` = very likely, `3` = probable, `2` = possible, `1` = speculative.

---

## Known Gaps / Roadmap

- No automated tests
- `app/page.tsx` is large (~1300 lines) — component decomposition would improve maintainability
- TypeScript types for `Row`, `Results`, `SavedScan`, `LearnedRule` are defined inline in `page.tsx` rather than in `lib/types.ts`
- Pre-loaded restaurant database is limited (3 restaurants)
- URL menu fetching is best-effort HTML scraping with no retry logic
- No CI/CD pipeline
