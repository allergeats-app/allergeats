/**
 * Puppeteer-based allergen scraper for major restaurant chains.
 * Runs real Chrome so JS-rendered pages work.
 *
 * Run:  npx tsx scripts/scrapeAllergens.ts
 * Output: data/scraped/<chainId>.json  (gitignored)
 */

import puppeteer, { type Browser, type Page } from "puppeteer";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  allergens: string[];
  ingredients?: string;
}

interface ChainResult {
  chain: string;
  cuisine: string;
  sourceType: "official";
  scrapedAt: string;
  items: ScrapedItem[];
}

// ─── Allergen normalisation ───────────────────────────────────────────────────

const ALLERGEN_PATTERNS: Array<[RegExp, string]> = [
  [/\b(milk|dairy|cheese|butter|cream|whey|lactose|casein)\b/i, "dairy"],
  [/\b(egg|eggs)\b/i, "egg"],
  [/\b(wheat|flour|gluten|barley|rye|spelt)\b/i, "wheat"],
  [/\b(soy|soya|soybean)\b/i, "soy"],
  [/\b(peanut|peanuts)\b/i, "peanut"],
  [/\b(tree.?nut|almond|cashew|walnut|pecan|pistachio|macadamia|hazelnut)\b/i, "tree-nut"],
  [/\b(sesame)\b/i, "sesame"],
  [/\b(fish|cod|salmon|tuna|tilapia|bass|flounder|halibut|mahi|pollock|anchov)\b/i, "fish"],
  [/\b(shellfish|shrimp|crab|lobster|clam|oyster|scallop|prawn|crawfish)\b/i, "shellfish"],
  [/\b(mustard)\b/i, "mustard"],
  [/\b(corn|cornstarch|corn syrup)\b/i, "corn"],
];

function detectAllergens(text: string): string[] {
  const found = new Set<string>();
  for (const [pattern, allergen] of ALLERGEN_PATTERNS) {
    if (pattern.test(text)) found.add(allergen);
  }
  return [...found];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

// ─── Generic table scraper (works for most allergen chart pages) ──────────────

async function scrapeAllergenTable(page: Page, chainId: string): Promise<ScrapedItem[]> {
  return page.evaluate((chainId: string) => {
    const tables = Array.from(document.querySelectorAll("table"));
    const KNOWN = ["milk","dairy","egg","wheat","gluten","soy","peanut","tree","sesame","fish","shellfish","mustard","corn","nut"];

    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length < 2) continue;

      const headers = Array.from(rows[0].querySelectorAll("th,td"))
        .map(el => el.textContent?.trim().toLowerCase() ?? "");

      const allergenCols = headers
        .map((h, i) => ({ i, h }))
        .filter(({ h }) => KNOWN.some(k => h.includes(k)));

      if (allergenCols.length < 3) continue;

      const items: ScrapedItem[] = [];
      for (const row of rows.slice(1)) {
        const cells = Array.from(row.querySelectorAll("th,td"))
          .map(el => el.textContent?.trim() ?? "");
        const name = cells[0];
        if (!name || name.length < 2) continue;

        const allergens: string[] = [];
        for (const { i, h } of allergenCols) {
          const cell = (cells[i] ?? "").toLowerCase();
          if (cell === "x" || cell === "•" || cell === "✓" || cell === "yes" || cell === "y" || cell.includes("contains")) {
            // Map column header to our allergen ID
            const map: Record<string, string> = {
              milk: "dairy", dairy: "dairy", egg: "egg", eggs: "egg",
              wheat: "wheat", gluten: "wheat", soy: "soy", soya: "soy",
              peanut: "peanut", sesame: "sesame", fish: "fish",
              shellfish: "shellfish", mustard: "mustard", corn: "corn",
              "tree nut": "tree-nut", "tree nuts": "tree-nut",
              nuts: "tree-nut", nut: "tree-nut",
            };
            const allergenId = Object.entries(map).find(([k]) => h.includes(k))?.[1];
            if (allergenId) allergens.push(allergenId);
          }
        }

        items.push({
          id: `${chainId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`,
          name,
          allergens: [...new Set(allergens)],
        });
      }
      if (items.length > 2) return items;
    }
    return [];
  }, chainId);
}

// ─── Chain scrapers ───────────────────────────────────────────────────────────

async function scrapeSubway(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.subway.com/en-US/MenuNutrition/Nutrition/AllergenChart", { waitUntil: "networkidle2", timeout: 30000 });
  await page.waitForSelector("table", { timeout: 15000 }).catch(() => {});
  return scrapeAllergenTable(page, "subway");
}

async function scrapeChickfila(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.chick-fil-a.com/menu", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    const cards = document.querySelectorAll("[data-testid='menu-item'], .menu-item, article");
    cards.forEach((card) => {
      const name = card.querySelector("h2,h3,h4,[class*='name'],[class*='title']")?.textContent?.trim();
      const desc = card.querySelector("p,[class*='desc']")?.textContent?.trim();
      if (name && name.length > 2) {
        items.push({ id: `chickfila-${name.toLowerCase().replace(/\s+/g, "-")}`, name, description: desc, allergens: [] });
      }
    });
    return items;
  }) as Promise<ScrapedItem[]>;
}

async function scrapeTacoBell(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.tacobell.com/nutrition/info", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const table = await scrapeAllergenTable(page, "tacobell");
  if (table.length > 0) return table;

  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("tr").forEach(row => {
      const cells = Array.from(row.querySelectorAll("td,th")).map(td => td.textContent?.trim() ?? "");
      if (cells[0] && cells[0].length > 2 && cells[0].length < 80) {
        items.push({ id: `tacobell-${cells[0].toLowerCase().replace(/\s+/g,"-")}`, name: cells[0], allergens: [] });
      }
    });
    return [...new Map(items.map(i => [i.name, i])).values()];
  }) as Promise<ScrapedItem[]>;
}

async function scrapeInNOut(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.in-n-out.com/menu/food-and-nutrition/allergens", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const table = await scrapeAllergenTable(page, "innout");
  if (table.length > 0) return table;

  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("h3,h4,[class*='item'],[class*='product']").forEach(el => {
      const name = el.textContent?.trim();
      if (name && name.length > 2 && name.length < 60) {
        items.push({ id: `innout-${name.toLowerCase().replace(/\s+/g,"-")}`, name, allergens: [] });
      }
    });
    return items;
  }) as Promise<ScrapedItem[]>;
}

async function scrapeFiveGuys(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.fiveguys.com/fans/nutrition-info", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  return scrapeAllergenTable(page, "fiveguys");
}

async function scrapeWendys(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.wendys.com/nutrition", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  return scrapeAllergenTable(page, "wendys");
}

async function scrapePanera(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.panerabread.com/en-us/articles/allergen-information.html", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const table = await scrapeAllergenTable(page, "panera");
  if (table.length > 0) return table;

  // Fallback: grab menu items from their main menu
  await page.goto("https://www.panerabread.com/en-us/menu.html", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("[class*='product-name'],[class*='item-name'],h3,h4").forEach(el => {
      const name = el.textContent?.trim();
      if (name && name.length > 2 && name.length < 80) {
        items.push({ id: `panera-${name.toLowerCase().replace(/\s+/g,"-")}`, name, allergens: [] });
      }
    });
    return [...new Map(items.map(i => [i.name, i])).values()].slice(0, 60);
  }) as Promise<ScrapedItem[]>;
}

async function scrapeDunkin(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.dunkindonuts.com/en/food-drinks/allergen-ingredients", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const table = await scrapeAllergenTable(page, "dunkin");
  if (table.length > 0) return table;

  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("[class*='product'],[class*='item'],li,tr").forEach(el => {
      const name = el.querySelector("h2,h3,h4,td")?.textContent?.trim();
      if (name && name.length > 2 && name.length < 60) {
        items.push({ id: `dunkin-${name.toLowerCase().replace(/\s+/g,"-")}`, name, allergens: [] });
      }
    });
    return [...new Map(items.map(i => [i.name, i])).values()].slice(0, 50);
  }) as Promise<ScrapedItem[]>;
}

async function scrapePopeyes(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.popeyes.com/nutrition", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const table = await scrapeAllergenTable(page, "popeyes");
  if (table.length > 0) return table;
  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("[class*='product'],[class*='menu-item'],h3").forEach(el => {
      const name = el.textContent?.trim();
      if (name && name.length > 2 && name.length < 70) {
        items.push({ id: `popeyes-${name.toLowerCase().replace(/\s+/g,"-")}`, name, allergens: [] });
      }
    });
    return [...new Map(items.map(i => [i.name, i])).values()].slice(0, 50);
  }) as Promise<ScrapedItem[]>;
}

async function scrapeKFC(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.kfc.com/nutrition", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  return scrapeAllergenTable(page, "kfc");
}

async function scrapeDominos(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.dominos.com/en/pages/content/nutritional/ingredients.html", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const table = await scrapeAllergenTable(page, "dominos");
  if (table.length > 0) return table;

  // Try ingredient lists - Domino's has ingredient text per item
  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("section, [class*='item'], [class*='product']").forEach(el => {
      const name = el.querySelector("h2,h3,h4,strong")?.textContent?.trim();
      const text = el.textContent ?? "";
      if (name && name.length > 2 && name.length < 80) {
        // Extract "CONTAINS:" statement
        const containsMatch = text.match(/contains?:?\s*([^.]+)/i);
        items.push({
          id: `dominos-${name.toLowerCase().replace(/\s+/g,"-")}`,
          name,
          ingredients: text.slice(0, 300),
          allergens: [],
        });
      }
    });
    return [...new Map(items.map(i => [i.name, i])).values()].slice(0, 60);
  }) as Promise<ScrapedItem[]>;
}

async function scrapeMcDonalds(page: Page): Promise<ScrapedItem[]> {
  await page.goto("https://www.mcdonalds.com/us/en-us/full_menu.html", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const table = await scrapeAllergenTable(page, "mcdonalds");
  if (table.length > 0) return table;

  return page.evaluate(() => {
    const items: ScrapedItem[] = [];
    document.querySelectorAll("[class*='menu-item'],[class*='product'],li[class]").forEach(el => {
      const name = el.querySelector("h2,h3,h4,span[class*='name']")?.textContent?.trim();
      if (name && name.length > 2 && name.length < 80) {
        items.push({ id: `mcdonalds-${name.toLowerCase().replace(/\s+/g,"-")}`, name, allergens: [] });
      }
    });
    return [...new Map(items.map(i => [i.name, i])).values()].slice(0, 80);
  }) as Promise<ScrapedItem[]>;
}

// ─── Chain registry ───────────────────────────────────────────────────────────

const CHAINS: Array<{
  id: string; name: string; cuisine: string;
  scrape: (page: Page) => Promise<ScrapedItem[]>;
}> = [
  { id: "mcdonalds",  name: "McDonald's",       cuisine: "Fast Food · Burgers",         scrape: scrapeMcDonalds },
  { id: "subway",     name: "Subway",            cuisine: "Fast Casual · Sandwiches",    scrape: scrapeSubway    },
  { id: "tacobell",   name: "Taco Bell",         cuisine: "Fast Food · Mexican",         scrape: scrapeTacoBell  },
  { id: "chickfila",  name: "Chick-fil-A",       cuisine: "Fast Food · Chicken",         scrape: scrapeChickfila },
  { id: "wendys",     name: "Wendy's",           cuisine: "Fast Food · Burgers",         scrape: scrapeWendys    },
  { id: "panera",     name: "Panera Bread",      cuisine: "Fast Casual · Bakery · Café", scrape: scrapePanera    },
  { id: "dunkin",     name: "Dunkin'",           cuisine: "Café · Donuts · Coffee",      scrape: scrapeDunkin    },
  { id: "innout",     name: "In-N-Out Burger",   cuisine: "Fast Food · Burgers",         scrape: scrapeInNOut    },
  { id: "fiveguys",   name: "Five Guys",         cuisine: "Fast Casual · Burgers",       scrape: scrapeFiveGuys  },
  { id: "popeyes",    name: "Popeyes",           cuisine: "Fast Food · Chicken",         scrape: scrapePopeyes   },
  { id: "kfc",        name: "KFC",               cuisine: "Fast Food · Chicken",         scrape: scrapeKFC       },
  { id: "dominos",    name: "Domino's",          cuisine: "Pizza",                       scrape: scrapeDominos   },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

const OUT_DIR = join(process.cwd(), "data", "scraped");
mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  console.log(`\nScraping ${CHAINS.length} chains with Puppeteer → data/scraped/\n`);
  console.log("─".repeat(60));

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  let succeeded = 0;
  let failed = 0;

  for (const chain of CHAINS) {
    process.stdout.write(`  ${chain.name.padEnd(20)} `);

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    try {
      const items = await chain.scrape(page);

      if (items.length === 0) {
        console.log("✗  No items extracted (JS-protected or layout changed)");
        failed++;
      } else {
        const result: ChainResult = {
          chain: chain.name,
          cuisine: chain.cuisine,
          sourceType: "official",
          scrapedAt: new Date().toISOString(),
          items,
        };
        writeFileSync(join(OUT_DIR, `${chain.id}.json`), JSON.stringify(result, null, 2));
        console.log(`✓  ${items.length} items`);
        succeeded++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : "Error";
      console.log(`✗  ${msg}`);
      failed++;
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log("─".repeat(60));
  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed`);
  if (succeeded > 0) {
    console.log("\nRun: npx tsx scripts/loadScraped.ts  to merge into mockRestaurants\n");
  }
}

main().catch(console.error);
