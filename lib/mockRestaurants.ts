/**
 * Official allergen data for the 5 seeded restaurant chains.
 *
 * Allergen arrays are sourced directly from each chain's published allergen guide:
 *   McDonald's  → mcdonalds.com/us/en-us/about-our-food/nutrition-calculator.html
 *   Chipotle    → chipotle.com/allergen-info
 *   Chick-fil-A → chick-fil-a.com/menu (allergen filter)
 *   Starbucks   → starbucks.com/menu (allergen info per item)
 *   Shake Shack → shakeshack.com/allergen-guide
 *
 * All items use sourceType "official" — scored with High confidence.
 * Update allergen arrays whenever a chain revises their guide.
 */

import type { Restaurant } from "./types";

/**
 * ISO date when allergen data was last manually verified against
 * each chain's published allergen guide. Update this whenever you
 * audit and confirm the data is still accurate.
 */
export const MENU_DATA_VERIFIED_DATE = "2026-04-10";

export const MOCK_RESTAURANTS: Restaurant[] = [

  // ─── McDonald's ─────────────────────────────────────────────────────────────
  {
    id: "mcdonalds",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/640px-McDonald%27s_Golden_Arches.svg.png",
    name: "McDonald's",
    cuisine: "Fast Food · Burgers",
    tags: ["burgers"],
    distance: 0.4,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Pick a drink",       category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      // Burgers
      { id: "mcd-bigmac",    name: "Big Mac",                        category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-qpc",       name: "Quarter Pounder with Cheese",    category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-dblqpc",    name: "Double Quarter Pounder",         category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-mcdbl",     name: "McDouble",                       category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-cheese",    name: "Cheeseburger",                   category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-burger",    name: "Hamburger",                      category: "Entrée",   sourceType: "official", allergens: ["wheat","soy","sesame"] },
      // Chicken & Fish
      { id: "mcd-fof",       name: "Filet-O-Fish",                   category: "Entrée",      sourceType: "official", allergens: ["fish","dairy","wheat","soy","egg"] },
      { id: "mcd-mcchicken", name: "McChicken",                      category: "Entrée",   sourceType: "official", allergens: ["egg","wheat","soy"] },
      { id: "mcd-crispy",    name: "Crispy Chicken Sandwich",        category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-spicycrispy", name: "Spicy Crispy Chicken Sandwich",category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-nuggets",   name: "10 Piece Chicken McNuggets",     category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-nuggets6",  name: "6 Piece Chicken McNuggets",      category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-nuggets4",  name: "4 Piece Chicken McNuggets",      category: "Entrée",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      // Sides
      { id: "mcd-fries",     name: "World Famous Fries",             category: "Side",     sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "mcd-hashbrown", name: "Hash Browns",                    category: "Side",     sourceType: "official", allergens: [] },
      { id: "mcd-side-salad",name: "Side Salad",                     category: "Side",     sourceType: "official", allergens: [] },
      { id: "mcd-applesli",  name: "Apple Slices",                   category: "Side",     sourceType: "official", allergens: [] },
      // Breakfast
      { id: "mcd-biscuit",   name: "Sausage Biscuit",                category: "Breakfast", sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-biscuitegg",name: "Sausage Biscuit with Egg",       category: "Breakfast", sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-emuffin",   name: "Egg McMuffin",                   category: "Breakfast", sourceType: "official", allergens: ["dairy","wheat","egg"] },
      { id: "mcd-sausmuff",  name: "Sausage McMuffin with Egg",      category: "Breakfast", sourceType: "official", allergens: ["dairy","wheat","egg"] },
      { id: "mcd-hotcakes",  name: "Hotcakes",                       category: "Breakfast", sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-burrbreak", name: "Sausage Burrito",                category: "Breakfast", sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      // Salads
      { id: "mcd-caesarsal", name: "Caesar Side Salad",              category: "Salads",    sourceType: "official", allergens: ["dairy","egg","fish","wheat"] },
      // Desserts & Drinks
      { id: "mcd-applepie",  name: "Baked Apple Pie",                category: "Dessert",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "mcd-cone",      name: "Vanilla Soft Serve Cone",        category: "Dessert",  sourceType: "official", allergens: ["dairy"] },
      { id: "mcd-mcflurry",  name: "McFlurry with Oreo Cookies",     category: "Dessert",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "mcd-shake-choc",name: "Chocolate Shake",                category: "Dessert",  sourceType: "official", allergens: ["dairy"] },
      { id: "mcd-shake-van", name: "Vanilla Shake",                  category: "Dessert",  sourceType: "official", allergens: ["dairy"] },
      { id: "mcd-coffee",    name: "McCafé Hot Coffee",               category: "Drink", sourceType: "official", allergens: [] },
      { id: "mcd-oj",        name: "Minute Maid Orange Juice",       category: "Drink", sourceType: "official", allergens: [] },
    ],
  },

  // ─── Chipotle ───────────────────────────────────────────────────────────────
  {
    id: "chipotle",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Chipotle_Mexican_Grill_logo.svg/640px-Chipotle_Mexican_Grill_logo.svg.png",
    name: "Chipotle Mexican Grill",
    cuisine: "Fast Casual · Mexican",
    tags: ["mexican"],
    distance: 0.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your vessel",  category: "Vessel",       required: true,  maxSelect: 1  },
        { label: "Add rice & beans",    category: "Rice & Beans", required: false, maxSelect: 99 },
        { label: "Choose your protein", category: "Proteins",     required: true,  maxSelect: 99 },
        { label: "Add a salsa",         category: "Salsas",       required: false, maxSelect: 99 },
        { label: "Add toppings",        category: "Toppings",     required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Vessel — pick your format
      { id: "chip-flourtort",   name: "Flour Tortilla (Burrito)",         category: "Vessel",       sourceType: "official", allergens: ["wheat","soy"] },
      { id: "chip-corntort",    name: "Corn Tortilla (Tacos)",            category: "Vessel",       sourceType: "official", allergens: ["corn"] },
      { id: "chip-bowl-base",   name: "Burrito Bowl",                     category: "Vessel",       sourceType: "official", allergens: [] },
      { id: "chip-salad-base",  name: "Salad",                            category: "Vessel",       sourceType: "official", allergens: [] },
      // Rice & Beans
      { id: "chip-rice-white",  name: "Cilantro-Lime White Rice",         category: "Rice & Beans", sourceType: "official", allergens: [] },
      { id: "chip-rice-brown",  name: "Cilantro-Lime Brown Rice",         category: "Rice & Beans", sourceType: "official", allergens: [] },
      { id: "chip-black",       name: "Black Beans",                      category: "Rice & Beans", sourceType: "official", allergens: [] },
      { id: "chip-pinto",       name: "Pinto Beans",                      category: "Rice & Beans", sourceType: "official", allergens: [] },
      // Proteins
      { id: "chip-chicken",     name: "Grilled Chicken",                  category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-steak",       name: "Carne Asada Steak",                category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-barbacoa",    name: "Barbacoa",                         category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-carnitas",    name: "Carnitas",                         category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-chorizo",     name: "Chorizo",                          category: "Proteins", sourceType: "official", allergens: ["soy"] },
      { id: "chip-sofritas",    name: "Sofritas (Tofu)",                  category: "Proteins", sourceType: "official", allergens: ["soy"] },
      // Salsas
      { id: "chip-salsa-fresh", name: "Fresh Tomato Salsa",               category: "Salsas",   sourceType: "official", allergens: [] },
      { id: "chip-salsa-roast", name: "Roasted Chili-Corn Salsa",         category: "Salsas",   sourceType: "official", allergens: ["corn"] },
      { id: "chip-salsa-green", name: "Tomatillo Green Chili Salsa",      category: "Salsas",   sourceType: "official", allergens: [] },
      { id: "chip-salsa-red",   name: "Tomatillo Red Chili Salsa",        category: "Salsas",   sourceType: "official", allergens: [] },
      // Toppings
      { id: "chip-guac",        name: "Guacamole",                        category: "Toppings", sourceType: "official", allergens: [] },
      { id: "chip-cheese",      name: "Shredded Monterey Jack Cheese",    category: "Toppings", sourceType: "official", allergens: ["dairy"] },
      { id: "chip-sourc",       name: "Sour Cream",                       category: "Toppings", sourceType: "official", allergens: ["dairy"] },
      { id: "chip-queso",       name: "Queso Blanco",                     category: "Toppings", sourceType: "official", allergens: ["dairy"] },
      { id: "chip-lettuce",     name: "Romaine Lettuce",                  category: "Toppings", sourceType: "official", allergens: [] },
      { id: "chip-fajitas",     name: "Fajita Vegetables",                category: "Toppings", sourceType: "official", allergens: [] },
      // Sides & Drinks
      { id: "chip-chips",       name: "Chips & Guacamole",                category: "Sides",    sourceType: "official", allergens: ["corn"] },
      { id: "chip-chips-salsa", name: "Chips & Fresh Salsa",              category: "Sides",    sourceType: "official", allergens: ["corn"] },
      { id: "chip-quesadilla",  name: "Quesadilla (Flour Tortilla)",      category: "Entrees",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "chip-kids-quesad", name: "Kids Quesadilla",                  category: "Entrees",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
    ],
  },

  // ─── Chick-fil-A ────────────────────────────────────────────────────────────
  {
    id: "chickfila",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Chick-fil-A.jpg/640px-Chick-fil-A.jpg",
    name: "Chick-fil-A",
    cuisine: "Fast Food · Chicken",
    tags: ["chicken"],
    distance: 1.1,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your entrée",  category: "Sandwiches", required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a side",         category: "Sides",      required: false, maxSelect: 1 },
        { label: "Add a drink",         category: "Beverages",  required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Sandwiches
      { id: "cfa-sandwich",    name: "Chick-fil-A Chicken Sandwich",      category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-spicy",       name: "Spicy Chicken Sandwich",            category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-deluxe",      name: "Chicken Sandwich Deluxe",           category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-spicy-deluxe",name: "Spicy Deluxe Chicken Sandwich",     category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-grilled",     name: "Grilled Chicken Sandwich",          category: "Sandwiches", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "cfa-grilled-dlx", name: "Grilled Chicken Club Sandwich",     category: "Sandwiches", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "cfa-wrap-cool",   name: "Grilled Cool Wrap",                 category: "Wraps",      sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-wrap-spicy",  name: "Spicy Southwest Salad",             category: "Salads",     sourceType: "official", allergens: ["dairy","egg","wheat","soy","tree-nut"] },
      // Nuggets & Strips
      { id: "cfa-nuggets",     name: "Chick-fil-A Nuggets (8 pc)",        category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-grilled-nug", name: "Grilled Nuggets (8 pc)",            category: "Chicken",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "cfa-strips",      name: "Chick-fil-A Chick-n-Strips (3 pc)", category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-minis",       name: "Chick-n-Minis (4 pc)",              category: "Breakfast",  sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      // Sides
      { id: "cfa-fries",       name: "Waffle Potato Fries",               category: "Sides",      sourceType: "official", allergens: [] },
      { id: "cfa-fries-sup",   name: "Waffle Potato Fries (Superfood)",   category: "Sides",      sourceType: "official", allergens: ["dairy","tree-nut"] },
      { id: "cfa-mac",         name: "Mac & Cheese",                      category: "Sides",      sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "cfa-soup",        name: "Chicken Noodle Soup",               category: "Sides",      sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-coleslaw",    name: "Cole Slaw",                         category: "Sides",      sourceType: "official", allergens: ["egg"] },
      { id: "cfa-fruit",       name: "Fruit Cup",                         category: "Sides",      sourceType: "official", allergens: [] },
      { id: "cfa-kale",        name: "Kale Crunch Side",                  category: "Sides",      sourceType: "official", allergens: ["dairy","egg","tree-nut"] },
      // Salads
      { id: "cfa-market-sal",  name: "Market Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","tree-nut"] },
      { id: "cfa-cobb-sal",    name: "Cobb Salad (no chicken)",           category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      // Desserts & Drinks
      { id: "cfa-shake-choc",  name: "Chocolate Milkshake",               category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-shake-van",   name: "Vanilla Milkshake",                 category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-shake-straw", name: "Strawberry Milkshake",              category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-icedream",    name: "Icedream Cone",                     category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-brownie",     name: "Chocolate Fudge Brownie",           category: "Desserts",   sourceType: "official", allergens: ["dairy","egg","wheat","soy","tree-nut"] },
      { id: "cfa-lemonade",    name: "Freshly Squeezed Lemonade",         category: "Beverages",  sourceType: "official", allergens: [] },
      { id: "cfa-tea",         name: "Iced Tea (Unsweetened)",            category: "Beverages",  sourceType: "official", allergens: [] },
    ],
  },

  // ─── Starbucks ──────────────────────────────────────────────────────────────
  {
    id: "starbucks",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/640px-Starbucks_Corporation_Logo_2011.svg.png",
    name: "Starbucks",
    cuisine: "Café · Coffee",
    tags: ["coffee"],
    distance: 0.6,
    sourceType: "official",
    menuItems: [
      // Espresso & Hot Coffee
      { id: "sbux-black",      name: "Pike Place Roast (Black)",          category: "Hot Coffee", sourceType: "official", allergens: [] },
      { id: "sbux-americano",  name: "Caffè Americano",                   category: "Hot Coffee", sourceType: "official", allergens: [] },
      { id: "sbux-latte",      name: "Caffè Latte",                       category: "Hot Coffee", sourceType: "official", allergens: ["dairy"] },
      { id: "sbux-cappuccino", name: "Cappuccino",                        category: "Hot Coffee", sourceType: "official", allergens: ["dairy"] },
      { id: "sbux-mocha",      name: "Caffè Mocha",                       category: "Hot Coffee", sourceType: "official", allergens: ["dairy","soy"] },
      { id: "sbux-psl",        name: "Pumpkin Spice Latte",               category: "Hot Coffee", sourceType: "official", allergens: ["dairy","egg"] },
      { id: "sbux-chailatte",  name: "Chai Tea Latte",                    category: "Hot Coffee", sourceType: "official", allergens: ["dairy"] },
      { id: "sbux-matcha",     name: "Matcha Tea Latte",                  category: "Hot Coffee", sourceType: "official", allergens: ["dairy"] },
      // Cold Drinks
      { id: "sbux-coldbrew",   name: "Cold Brew Coffee (Black)",          category: "Cold Coffee",sourceType: "official", allergens: [] },
      { id: "sbux-icedlatte",  name: "Iced Caffè Latte",                  category: "Cold Coffee",sourceType: "official", allergens: ["dairy"] },
      { id: "sbux-macchiato",  name: "Iced Caramel Macchiato",            category: "Cold Coffee",sourceType: "official", allergens: ["dairy","soy"] },
      { id: "sbux-icedshakenespresso", name: "Iced Shaken Espresso",      category: "Cold Coffee",sourceType: "official", allergens: ["dairy"] },
      // Frappuccinos
      { id: "sbux-frapp-caramel", name: "Caramel Frappuccino",            category: "Frappuccinos",sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "sbux-frapp-java", name: "Java Chip Frappuccino",             category: "Frappuccinos",sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "sbux-frapp-match",name: "Matcha Crème Frappuccino",          category: "Frappuccinos",sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "sbux-frapp",      name: "Green Tea Crème Frappuccino",       category: "Frappuccinos",sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      // Teas
      { id: "sbux-greenteabag",name: "Brewed Green Tea",                  category: "Teas",       sourceType: "official", allergens: [] },
      { id: "sbux-peachtea",   name: "Iced Peach Green Tea",              category: "Teas",       sourceType: "official", allergens: [] },
      // Bakery
      { id: "sbux-croissant",  name: "Butter Croissant",                  category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg"] },
      { id: "sbux-choccroiss", name: "Chocolate Croissant",               category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "sbux-scone",      name: "Blueberry Scone",                   category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg"] },
      { id: "sbux-muffin",     name: "Blueberry Muffin",                  category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "sbux-banana-bread",name: "Banana Nut Bread",                 category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg","soy","tree-nut"] },
      { id: "sbux-chocchunk",  name: "Chocolate Chunk Cookie",            category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      // Food
      { id: "sbux-eggwich",    name: "Bacon, Gouda & Egg Sandwich",       category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "sbux-egg-turkey", name: "Turkey Bacon & Egg White Sandwich", category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "sbux-oatmeal",    name: "Rolled & Steel-Cut Oatmeal",        category: "Hot Breakfast",sourceType: "official", allergens: ["oats","tree-nut"] },
      { id: "sbux-bistro-box", name: "Protein Box (Egg & Cheese)",        category: "Snacks",     sourceType: "official", allergens: ["dairy","egg","wheat","soy","tree-nut"] },
    ],
  },

  // ─── Shake Shack ────────────────────────────────────────────────────────────
  {
    id: "shakeshack",
    name: "Shake Shack",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Shake_Shack_Madison_Square.jpg/640px-Shake_Shack_Madison_Square.jpg",
    cuisine: "Burgers · Shakes",
    tags: ["burgers"],
    distance: 2.1,
    sourceType: "official",
    menuItems: [
      // Burgers
      { id: "ss-shackburger",  name: "ShackBurger",                       category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "ss-smokeshack",   name: "SmokeShack",                        category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "ss-dblsmoke",     name: "Double SmokeShack",                 category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "ss-dblshack",     name: "Double ShackBurger",                category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "ss-shackstack",   name: "Shack Stack (Burger + Mushroom)",   category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "ss-veggieshack",  name: "Veggie Shack",                      category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "ss-hamburger",    name: "Hamburger",                         category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "ss-cheeseburger", name: "Cheeseburger",                      category: "Burgers",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      // Chicken
      { id: "ss-chickenshack", name: "Chicken Shack",                     category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "ss-hotchicken",   name: "Hot Chicken Shack",                 category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "ss-chicktenders", name: "Chick'n Bites (6 pc)",              category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat"] },
      // Sides
      { id: "ss-fries",        name: "Crinkle Cut Fries",                 category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "ss-cheesefries",  name: "Cheese Fries",                      category: "Sides",      sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "ss-hotdog",       name: "Shack-cago Dog",                    category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      // Shakes & Frozen
      { id: "ss-shake-van",    name: "Vanilla Shake",                     category: "Shakes",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ss-shake",        name: "Chocolate Shake",                   category: "Shakes",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ss-shake-straw",  name: "Strawberry Shake",                  category: "Shakes",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ss-shake-caramel",name: "Salted Caramel Shake",              category: "Shakes",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ss-shake-black",  name: "Black & White Shake",               category: "Shakes",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ss-concretes",    name: "Concrete (frozen custard blend)",    category: "Shakes",     sourceType: "official", allergens: ["dairy","egg"] },
      // Drinks
      { id: "ss-lemonade",     name: "Fresh-Squeezed Lemonade",           category: "Beverages",  sourceType: "official", allergens: [] },
      { id: "ss-water",        name: "Water",                             category: "Beverages",  sourceType: "official", allergens: [] },
    ],
  },

  // ─── Subway ──────────────────────────────────────────────────────────────────
  // Source: subway.com/en-US/MenuNutrition/Nutrition/AllergenInformation
  {
    id: "subway",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/A_Subway_restaurant_in_a_strip_mall_in_Franklin%2C_North_Carolina%2C_United_States.jpg/640px-A_Subway_restaurant_in_a_strip_mall_in_Franklin%2C_North_Carolina%2C_United_States.jpg",
    name: "Subway",
    cuisine: "Fast Casual · Sandwiches",
    tags: ["sandwiches"],
    distance: 0.5,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your bread",    category: "Breads",     required: true,  maxSelect: 1  },
        { label: "Choose your protein",  category: "Proteins",   required: true,  maxSelect: 99 },
        { label: "Add cheese",           category: "Cheeses",    required: false, maxSelect: 1  },
        { label: "Add vegetables",       category: "Vegetables", required: false, maxSelect: 99 },
        { label: "Add sauces",           category: "Sauces",     required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Breads — pick your base
      { id: "sub-italian",        name: "Italian White Bread",               category: "Breads",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-multigrain",     name: "Hearty Multigrain Bread",           category: "Breads",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "sub-honey-oat",      name: "9-Grain Honey Oat Bread",           category: "Breads",      sourceType: "official", allergens: ["oats","wheat","soy"] },
      { id: "sub-herbs-cheese",   name: "Italian Herbs & Cheese Bread",      category: "Breads",      sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "sub-parmesan",       name: "Parmesan Oregano Bread",            category: "Breads",      sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "sub-wrap",           name: "Spinach Wrap",                      category: "Breads",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-flatbread",      name: "Flatbread",                         category: "Breads",      sourceType: "official", allergens: ["wheat","soy","dairy"] },
      // Proteins — pick your protein
      { id: "sub-p-turkey",       name: "Turkey Breast",                     category: "Proteins",    sourceType: "official", allergens: [] },
      { id: "sub-p-ham",          name: "Black Forest Ham",                  category: "Proteins",    sourceType: "official", allergens: [] },
      { id: "sub-p-roast-beef",   name: "Roast Beef",                        category: "Proteins",    sourceType: "official", allergens: [] },
      { id: "sub-p-chicken",      name: "Rotisserie-Style Chicken",          category: "Proteins",    sourceType: "official", allergens: ["soy"] },
      { id: "sub-p-tuna",         name: "Tuna Salad",                        category: "Proteins",    sourceType: "official", allergens: ["fish","egg"] },
      { id: "sub-p-pepperoni",    name: "Pepperoni",                         category: "Proteins",    sourceType: "official", allergens: [] },
      { id: "sub-p-salami",       name: "Salami",                            category: "Proteins",    sourceType: "official", allergens: [] },
      { id: "sub-p-bacon",        name: "Bacon",                             category: "Proteins",    sourceType: "official", allergens: [] },
      { id: "sub-p-steak",        name: "Steak",                             category: "Proteins",    sourceType: "official", allergens: ["soy"] },
      { id: "sub-p-meatball",     name: "Meatball",                          category: "Proteins",    sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "sub-p-veggie",       name: "Veggie Patty",                      category: "Proteins",    sourceType: "official", allergens: ["wheat","soy","egg"] },
      // Cheeses — pick your cheese
      { id: "sub-c-american",     name: "American Cheese",                   category: "Cheeses",     sourceType: "official", allergens: ["dairy"] },
      { id: "sub-c-provolone",    name: "Provolone",                         category: "Cheeses",     sourceType: "official", allergens: ["dairy"] },
      { id: "sub-c-pepper-jack",  name: "Pepper Jack",                       category: "Cheeses",     sourceType: "official", allergens: ["dairy"] },
      { id: "sub-c-swiss",        name: "Swiss",                             category: "Cheeses",     sourceType: "official", allergens: ["dairy"] },
      { id: "sub-c-cheddar",      name: "Cheddar",                           category: "Cheeses",     sourceType: "official", allergens: ["dairy"] },
      { id: "sub-c-mozzarella",   name: "Mozzarella",                        category: "Cheeses",     sourceType: "official", allergens: ["dairy"] },
      // Vegetables — all free of major allergens
      { id: "sub-v-lettuce",      name: "Lettuce",                           category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-tomato",       name: "Tomato",                            category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-cucumber",     name: "Cucumber",                          category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-green-pepper", name: "Green Pepper",                      category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-red-onion",    name: "Red Onion",                         category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-banana-pep",   name: "Banana Peppers",                    category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-jalapeno",     name: "Jalapeños",                         category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-olives",       name: "Olives",                            category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-spinach",      name: "Spinach",                           category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-pickles",      name: "Pickles",                           category: "Vegetables",  sourceType: "official", allergens: [] },
      { id: "sub-v-avocado",      name: "Avocado",                           category: "Vegetables",  sourceType: "official", allergens: [] },
      // Sauces — pick your sauce(s)
      { id: "sub-s-mayo",         name: "Mayonnaise",                        category: "Sauces",      sourceType: "official", allergens: ["egg","soy"] },
      { id: "sub-s-mustard",      name: "Yellow Mustard",                    category: "Sauces",      sourceType: "official", allergens: ["mustard"] },
      { id: "sub-s-honey-must",   name: "Honey Mustard",                     category: "Sauces",      sourceType: "official", allergens: ["egg","mustard"] },
      { id: "sub-s-ranch",        name: "Ranch",                             category: "Sauces",      sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "sub-s-chipotle",     name: "Chipotle Southwest Sauce",          category: "Sauces",      sourceType: "official", allergens: ["egg","soy"] },
      { id: "sub-s-sweet-onion",  name: "Sweet Onion Sauce",                 category: "Sauces",      sourceType: "official", allergens: [] },
      { id: "sub-s-caesar",       name: "Caesar Dressing",                   category: "Sauces",      sourceType: "official", allergens: ["egg","fish","dairy"] },
      { id: "sub-s-italian",      name: "Italian Dressing",                  category: "Sauces",      sourceType: "official", allergens: [] },
      { id: "sub-s-oil-vinegar",  name: "Oil & Vinegar",                     category: "Sauces",      sourceType: "official", allergens: [] },
      // Extras & Sides
      { id: "sub-cookie-choc",    name: "Chocolate Chip Cookie",             category: "Cookies",     sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "sub-cookie-oat",     name: "Oatmeal Raisin Cookie",             category: "Cookies",     sourceType: "official", allergens: ["oats","wheat","soy","dairy","egg"] },
      { id: "sub-chips",          name: "Lay's Classic Chips",               category: "Sides",       sourceType: "official", allergens: [] },
      { id: "sub-apple",          name: "Apple Slices",                      category: "Sides",       sourceType: "official", allergens: [] },
    ],
  },

  // ─── Taco Bell ───────────────────────────────────────────────────────────────
  // Source: tacobell.com/allergens
  {
    id: "tacobell",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Taco_Bell_2023.svg/640px-Taco_Bell_2023.svg.png",
    name: "Taco Bell",
    cuisine: "Fast Food · Mexican",
    tags: ["mexican"],
    distance: 0.8,
    sourceType: "official",
    menuItems: [
      // Tacos
      { id: "tb-crunchy-taco",   name: "Crunchy Taco",                       category: "Tacos",      sourceType: "official", allergens: ["corn","dairy","soy"] },
      { id: "tb-soft-taco",      name: "Soft Taco",                          category: "Tacos",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "tb-supreme-taco",   name: "Crunchy Taco Supreme",               category: "Tacos",      sourceType: "official", allergens: ["corn","dairy","soy","egg"] },
      { id: "tb-doritos-locos",  name: "Doritos Locos Taco (Nacho Cheese)",  category: "Tacos",      sourceType: "official", allergens: ["corn","dairy","soy","wheat"] },
      // Burritos
      { id: "tb-bean-burrito",   name: "Bean Burrito",                       category: "Burritos",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "tb-beefy-5",        name: "Beefy 5-Layer Burrito",              category: "Burritos",   sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-supreme-burrito",name: "Burrito Supreme",                    category: "Burritos",   sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-fiesta-veg",     name: "Fiesta Veggie Burrito",              category: "Burritos",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Specialties
      { id: "tb-crunchwrap",     name: "Crunchwrap Supreme",                 category: "Specialties",sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-chalupa",        name: "Chalupa Supreme",                    category: "Specialties",sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-gordita",        name: "Cheesy Gordita Crunch",              category: "Specialties",sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-mexican-pizza",  name: "Mexican Pizza",                      category: "Specialties",sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-quesadilla",     name: "Quesadilla (Chicken)",               category: "Specialties",sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tb-power-bowl",     name: "Power Menu Bowl (Chicken)",          category: "Bowls",      sourceType: "official", allergens: ["dairy","soy","egg"] },
      // Sides
      { id: "tb-nachos",         name: "Nachos BellGrande",                  category: "Sides",      sourceType: "official", allergens: ["corn","dairy","wheat","soy"] },
      { id: "tb-chips-cheese",   name: "Chips & Nacho Cheese Sauce",         category: "Sides",      sourceType: "official", allergens: ["corn","dairy"] },
      { id: "tb-cinnabon",       name: "Cinnabon Delights (2 pk)",           category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "tb-cinnamon-twists",name: "Cinnamon Twists",                    category: "Desserts",   sourceType: "official", allergens: ["corn","wheat","soy"] },
    ],
  },

  // ─── Burger King ─────────────────────────────────────────────────────────────
  // Source: bk.com/allergen-information
  {
    id: "burgerking",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/640px-Burger_King_2020.svg.png",
    name: "Burger King",
    cuisine: "Fast Food · Burgers",
    tags: ["burgers"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Add a shake",        category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      // Burgers
      { id: "bk-whopper",        name: "Whopper",                            category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "bk-whopper-cheese", name: "Whopper with Cheese",               category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      { id: "bk-double-whopper", name: "Double Whopper",                     category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "bk-bacon-king",     name: "Bacon King",                         category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      { id: "bk-cheeseburger",   name: "Cheeseburger",                       category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      { id: "bk-hamburger",      name: "Hamburger",                          category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "bk-rodeo",          name: "Rodeo Burger",                       category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      // Chicken & Fish
      { id: "bk-crispy-ch",      name: "Crispy Chicken Sandwich",            category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "bk-spicy-crispy",   name: "Spicy Crispy Chicken Sandwich",      category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "bk-orig-chicken",   name: "Original Chicken Sandwich",          category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "bk-nuggets",        name: "Chicken Nuggets (8 pc)",             category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "bk-fish",           name: "Big Fish Sandwich",                  category: "Entrée",       sourceType: "official", allergens: ["fish","wheat","soy","egg"] },
      // Sides
      { id: "bk-fries",          name: "French Fries",                       category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "bk-onion-rings",    name: "Onion Rings",                        category: "Side",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "bk-apple-slices",   name: "Apple Slices",                       category: "Side",      sourceType: "official", allergens: [] },
      { id: "bk-garden-salad",   name: "Garden Side Salad",                  category: "Side",      sourceType: "official", allergens: [] },
      // Breakfast
      { id: "bk-croissan-wich",  name: "Sausage, Egg & Cheese Croissan'wich",category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "bk-hash-browns",    name: "Hash Browns",                        category: "Breakfast",  sourceType: "official", allergens: ["wheat","soy"] },
      // Desserts & Drinks
      { id: "bk-shake-van",      name: "Vanilla Milkshake",                  category: "Drink",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "bk-shake-choc",     name: "Chocolate Milkshake",                category: "Drink",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
    ],
  },

  // ─── Wendy's ─────────────────────────────────────────────────────────────────
  // Source: wendys.com/allergens
  {
    id: "wendys",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/3/32/Wendy%27s_full_logo_2012.svg/640px-Wendy%27s_full_logo_2012.svg.png",
    name: "Wendy's",
    cuisine: "Fast Food · Burgers",
    tags: ["burgers"],
    distance: 1.3,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Add a Frosty",       category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      // Burgers
      { id: "wen-dave-single",   name: "Dave's Single",                      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-dave-double",   name: "Dave's Double",                      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-dave-triple",   name: "Dave's Triple",                      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-baconator",     name: "Baconator",                          category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-jr-cheese",     name: "Jr. Cheeseburger",                   category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "wen-pub-burger",    name: "Pretzel Bacon Pub Burger",           category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Chicken
      { id: "wen-crispy-ch",     name: "Classic Chicken Sandwich",           category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-spicy-ch",      name: "Spicy Chicken Sandwich",             category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-grilled-ch",    name: "Grilled Chicken Sandwich",           category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "wen-nuggets",       name: "Chicken Nuggets (4 pc)",             category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "wen-spicy-nug",     name: "Spicy Chicken Nuggets (4 pc)",       category: "Entrée",    sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      // Sides
      { id: "wen-fries",         name: "Natural Cut Fries",                  category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "wen-chili",         name: "Small Chili",                        category: "Side",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "wen-baked-potato",  name: "Plain Baked Potato",                 category: "Side",      sourceType: "official", allergens: [] },
      { id: "wen-salad",         name: "Garden Side Salad",                  category: "Side",      sourceType: "official", allergens: [] },
      // Desserts
      { id: "wen-frosty-van",    name: "Vanilla Frosty",                     category: "Drink",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "wen-frosty-choc",   name: "Chocolate Frosty",                   category: "Drink",   sourceType: "official", allergens: ["dairy","soy"] },
    ],
  },

  // ─── Panera Bread ────────────────────────────────────────────────────────────
  // Source: panerabread.com/en-us/menu/nutrition-allergen-information.html
  {
    id: "panera",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Panera_Bread_The_Villages_Florida.jpg/640px-Panera_Bread_The_Villages_Florida.jpg",
    name: "Panera Bread",
    cuisine: "Fast Casual · Bakery · Café",
    tags: ["coffee", "sandwiches"],
    distance: 1.0,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your main",      categories: ["Sandwiches","Salads","Soups"], required: true,  maxSelect: 1, category: "Sandwiches" },
        { label: "Add a pick-two side",   categories: ["Soups","Bakery"],              required: false, maxSelect: 1, category: "Soups" },
        { label: "Add a drink",           category: "Beverages",                       required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Soups
      { id: "pan-broc-chedd",    name: "Broccoli Cheddar Soup",              category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "pan-chicken-nood",  name: "Chicken Noodle Soup",                category: "Soups",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pan-french-onion",  name: "French Onion Soup",                  category: "Soups",      sourceType: "official", allergens: ["wheat","dairy"] },
      { id: "pan-tomato",        name: "Creamy Tomato Soup",                  category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      // Sandwiches & Paninis
      { id: "pan-turkey",        name: "Turkey Sandwich",                    category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "pan-blt",           name: "BLT Sandwich",                       category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "pan-frontega",      name: "Frontega Chicken Panini",            category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "pan-grilled-cheese",name: "Grilled Cheese",                     category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "pan-tuna",          name: "Tuna Salad Sandwich",                category: "Sandwiches", sourceType: "official", allergens: ["wheat","fish","egg","dairy"] },
      // Salads
      { id: "pan-caesar",        name: "Caesar Salad",                       category: "Salads",     sourceType: "official", allergens: ["dairy","egg","fish","wheat"] },
      { id: "pan-goddess-cobb",  name: "Green Goddess Cobb Salad",           category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "pan-fuji-apple",    name: "Fuji Apple Salad",                   category: "Salads",     sourceType: "official", allergens: ["tree-nut","dairy","egg","wheat"] },
      { id: "pan-greek",         name: "Greek Salad",                        category: "Salads",     sourceType: "official", allergens: ["dairy"] },
      // Breads & Bagels
      { id: "pan-sourdough",     name: "Sourdough Bread (slice)",            category: "Bakery",     sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pan-bagel-plain",   name: "Plain Bagel",                        category: "Bakery",     sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pan-bagel-cinn",    name: "Cinnamon Crunch Bagel",              category: "Bakery",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "pan-bagel-asiago",  name: "Asiago Cheese Bagel",                category: "Bakery",     sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pan-croissant",     name: "Butter Croissant",                   category: "Bakery",     sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "pan-muffin-blueberry", name: "Blueberry Muffin",               category: "Bakery",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      // Drinks
      { id: "pan-lemonade",      name: "Charged Lemonade",                   category: "Beverages",  sourceType: "official", allergens: [] },
      { id: "pan-coffee",        name: "Hot Coffee (Black)",                  category: "Beverages",  sourceType: "official", allergens: [] },
      { id: "pan-smoothie",      name: "Mango Smoothie",                     category: "Beverages",  sourceType: "official", allergens: ["dairy"] },
    ],
  },

  // ─── Dunkin' ─────────────────────────────────────────────────────────────────
  // Source: dunkindonuts.com/en/nutrition/allergen-info
  {
    id: "dunkin",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Dunkin%27_Donuts_storefront.jpg/640px-Dunkin%27_Donuts_storefront.jpg",
    name: "Dunkin'",
    cuisine: "Café · Donuts · Coffee",
    tags: ["coffee"],
    distance: 0.7,
    sourceType: "official",
    menuItems: [
      // Donuts
      { id: "dunk-glazed",       name: "Glazed Donut",                       category: "Donuts",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "dunk-choc-frosted", name: "Chocolate Frosted Donut",            category: "Donuts",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "dunk-boston-kreme", name: "Boston Kreme Donut",                 category: "Donuts",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "dunk-glazed-munchkin", name: "Glazed Munchkin Donut Holes",     category: "Donuts",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "dunk-old-fashioned",name: "Old Fashioned Donut",                category: "Donuts",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      // Bagels & Muffins
      { id: "dunk-bagel-plain",  name: "Plain Bagel",                        category: "Bakery",     sourceType: "official", allergens: ["wheat"] },
      { id: "dunk-bagel-cream",  name: "Bagel with Cream Cheese",            category: "Bakery",     sourceType: "official", allergens: ["wheat","dairy"] },
      { id: "dunk-muffin-blue",  name: "Blueberry Muffin",                   category: "Bakery",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "dunk-croissant",    name: "Croissant",                          category: "Bakery",     sourceType: "official", allergens: ["wheat","egg","dairy"] },
      // Breakfast Sandwiches
      { id: "dunk-egg-cheese",   name: "Bacon, Egg & Cheese Sandwich",       category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "dunk-sausage",      name: "Sausage, Egg & Cheese Sandwich",     category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dunk-wake-wrap",    name: "Wake-Up Wrap (Egg & Cheese)",        category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dunk-hash-browns",  name: "Hash Browns",                        category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      // Coffee & Drinks
      { id: "dunk-coffee-black", name: "Hot Coffee (Black)",                  category: "Coffee",     sourceType: "official", allergens: [] },
      { id: "dunk-iced-coffee",  name: "Iced Coffee (Black)",                 category: "Coffee",     sourceType: "official", allergens: [] },
      { id: "dunk-latte",        name: "Latte",                              category: "Coffee",     sourceType: "official", allergens: ["dairy"] },
      { id: "dunk-iced-latte",   name: "Iced Latte",                         category: "Coffee",     sourceType: "official", allergens: ["dairy"] },
      { id: "dunk-macchiato",    name: "Caramel Macchiato",                   category: "Coffee",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "dunk-coolatta-van", name: "Vanilla Bean Coolatta",               category: "Frozen",     sourceType: "official", allergens: ["dairy","soy"] },
    ],
  },

  // ─── In-N-Out Burger ─────────────────────────────────────────────────────────
  {
    id: "innout",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/InNOut_2021_logo.svg/640px-InNOut_2021_logo.svg.png",
    name: "In-N-Out Burger",
    cuisine: "Fast Food · Burgers",
    tags: ["burgers"],
    distance: 0.6,
    sourceType: "official",
    menuItems: [
      { id: "ino-hamburger",     name: "Hamburger",                         category: "Burgers",   sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "ino-cheeseburger",  name: "Cheeseburger",                      category: "Burgers",   sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "ino-dbl-dbl",       name: "Double-Double",                     category: "Burgers",   sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "ino-3x3",           name: "3x3",                               category: "Burgers",   sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "ino-4x4",           name: "4x4",                               category: "Burgers",   sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "ino-protein-burger",name: "Protein Style Hamburger",           category: "Burgers",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ino-protein-dbl",   name: "Protein Style Double-Double",       category: "Burgers",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ino-fries",         name: "French Fries",                      category: "Sides",     sourceType: "official", allergens: [] },
      { id: "ino-animal-fries",  name: "Animal Style Fries",                category: "Sides",     sourceType: "official", allergens: ["dairy","soy","egg"] },
      { id: "ino-shake-choc",    name: "Chocolate Shake",                   category: "Shakes",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ino-shake-van",     name: "Vanilla Shake",                     category: "Shakes",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ino-shake-straw",   name: "Strawberry Shake",                  category: "Shakes",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ino-shake-neap",    name: "Neapolitan Shake",                  category: "Shakes",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ino-lemonade",      name: "Lemonade",                          category: "Drinks",    sourceType: "official", allergens: [] },
      { id: "ino-iced-tea",      name: "Iced Tea",                          category: "Drinks",    sourceType: "official", allergens: [] },
      { id: "ino-soda",          name: "Soft Drink",                        category: "Drinks",    sourceType: "official", allergens: [] },
    ],
  },

  // ─── Five Guys ────────────────────────────────────────────────────────────────
  // NOTE: Five Guys openly uses peanut oil and serves peanuts in-store.
  // Cross-contact risk for peanut allergy is extremely high at all locations.
  {
    id: "fiveguys",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Five_Guys%2C_Merritt_Island.JPG/640px-Five_Guys%2C_Merritt_Island.JPG",
    name: "Five Guys",
    cuisine: "Fast Casual · Burgers",
    tags: ["burgers"],
    distance: 1.2,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Burgers",  required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a style of fries", category: "Sides", required: false, maxSelect: 1 },
        { label: "Add a shake",        category: "Shakes",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      { id: "fg-hamburger",       name: "Hamburger",                        category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-cheeseburger",    name: "Cheeseburger",                     category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-little-burger",   name: "Little Hamburger",                 category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-little-cheese",   name: "Little Cheeseburger",              category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-bacon-burger",    name: "Bacon Burger",                     category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-bacon-cheese",    name: "Bacon Cheeseburger",               category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-mushroom-burger", name: "Mushroom Burger",                  category: "Burgers",   sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-hot-dog",         name: "Hot Dog",                          category: "Sandwiches",sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-cheese-dog",      name: "Cheese Dog",                       category: "Sandwiches",sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-veggie-sand",     name: "Veggie Sandwich",                  category: "Sandwiches",sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-grilled-cheese",  name: "Grilled Cheese",                   category: "Sandwiches",sourceType: "official", allergens: ["wheat","egg","dairy","soy","peanut"] },
      { id: "fg-fries-reg",       name: "Five Guys Style Fries",            category: "Sides",     sourceType: "official", allergens: ["peanut"] },
      { id: "fg-fries-cajun",     name: "Cajun Style Fries",                category: "Sides",     sourceType: "official", allergens: ["peanut"] },
      { id: "fg-fries-nat",       name: "Fries (no seasoning)",             category: "Sides",     sourceType: "official", allergens: ["peanut"] },
      { id: "fg-shake-van",       name: "Vanilla Milkshake",                category: "Shakes",    sourceType: "official", allergens: ["dairy","soy","peanut"] },
      { id: "fg-shake-choc",      name: "Chocolate Milkshake",              category: "Shakes",    sourceType: "official", allergens: ["dairy","soy","peanut"] },
      { id: "fg-shake-straw",     name: "Strawberry Milkshake",             category: "Shakes",    sourceType: "official", allergens: ["dairy","soy","peanut"] },
      { id: "fg-shake-oreo",      name: "Oreo Milkshake",                   category: "Shakes",    sourceType: "official", allergens: ["dairy","wheat","soy","peanut"] },
    ],
  },

  // ─── Popeyes ──────────────────────────────────────────────────────────────────
  {
    id: "popeyes",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Popeyes_Louisiana_Kitchen_%2851195358373%29.jpg/640px-Popeyes_Louisiana_Kitchen_%2851195358373%29.jpg",
    name: "Popeyes",
    cuisine: "Fast Food · Chicken",
    tags: ["chicken"],
    distance: 0.8,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "pop-classic-sand",   name: "Classic Chicken Sandwich",         category: "Entrée",sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "pop-spicy-sand",     name: "Spicy Chicken Sandwich",           category: "Entrée",sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "pop-blackened-sand", name: "Blackened Ranch Chicken Sandwich", category: "Entrée",sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pop-tenders-3",      name: "3 Piece Chicken Tenders",          category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pop-tenders-5",      name: "5 Piece Chicken Tenders",          category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pop-mild-2pc",       name: "2 Piece Mild Chicken",             category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pop-mild-3pc",       name: "3 Piece Mild Chicken",             category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pop-spicy-2pc",      name: "2 Piece Spicy Chicken",            category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pop-spicy-3pc",      name: "3 Piece Spicy Chicken",            category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "pop-shrimp",         name: "Popcorn Shrimp",                   category: "Seafood",   sourceType: "official", allergens: ["shellfish","wheat","soy","dairy"] },
      { id: "pop-mac-cheese",     name: "Mac & Cheese",                     category: "Side",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "pop-red-beans",      name: "Red Beans & Rice",                 category: "Side",     sourceType: "official", allergens: ["soy"] },
      { id: "pop-mashed-potato",  name: "Mashed Potatoes & Gravy",          category: "Side",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "pop-coleslaw",       name: "Coleslaw",                         category: "Side",     sourceType: "official", allergens: ["egg","soy"] },
      { id: "pop-biscuit",        name: "Biscuit",                          category: "Side",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "pop-corn-cobbette",  name: "Corn on the Cob",                  category: "Side",     sourceType: "official", allergens: ["corn"] },
      { id: "pop-apple-pie",      name: "Cinnamon Apple Pie",               category: "Desserts",  sourceType: "official", allergens: ["wheat","soy"] },
    ],
  },

  // ─── KFC ─────────────────────────────────────────────────────────────────────
  {
    id: "kfc",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/5/57/KFC_logo-image.svg/640px-KFC_logo-image.svg.png",
    name: "KFC",
    cuisine: "Fast Food · Chicken",
    tags: ["chicken"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: true,  maxSelect: 2  },
      ],
    },
    menuItems: [
      { id: "kfc-orig-breast",    name: "Original Recipe Chicken Breast",   category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "kfc-orig-thigh",     name: "Original Recipe Chicken Thigh",    category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "kfc-orig-drum",      name: "Original Recipe Drumstick",        category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "kfc-crispy-breast",  name: "Extra Crispy Chicken Breast",      category: "Entrée",   sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "kfc-grilled-breast", name: "Kentucky Grilled Chicken Breast",  category: "Entrée",   sourceType: "official", allergens: ["soy"] },
      { id: "kfc-sand-classic",   name: "Classic Chicken Sandwich",         category: "Entrée",sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "kfc-sand-spicy",     name: "Spicy Chicken Sandwich",           category: "Entrée",sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "kfc-tenders-3",      name: "3 Piece Chicken Tenders",          category: "Entrée",   sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "kfc-popcorn",        name: "Popcorn Nuggets",                  category: "Entrée",   sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "kfc-pot-pie",        name: "Chicken Pot Pie",                  category: "Entrée",     sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "kfc-bowl",           name: "Famous Bowl",                      category: "Entrée",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "kfc-mac-cheese",     name: "Mac & Cheese",                     category: "Side",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "kfc-mashed",         name: "Mashed Potatoes & Gravy",          category: "Side",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "kfc-coleslaw",       name: "Cole Slaw",                        category: "Side",     sourceType: "official", allergens: ["egg","soy"] },
      { id: "kfc-biscuit",        name: "Biscuit",                          category: "Side",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "kfc-corn",           name: "Corn on the Cob",                  category: "Side",     sourceType: "official", allergens: ["corn"] },
      { id: "kfc-green-beans",    name: "Green Beans",                      category: "Side",     sourceType: "official", allergens: [] },
      { id: "kfc-secret-fries",   name: "Secret Recipe Fries",              category: "Side",     sourceType: "official", allergens: ["soy"] },
    ],
  },

  // ─── Domino's ────────────────────────────────────────────────────────────────
  {
    id: "dominos",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Domino%27s_Pizza_Lobby_Entrance_Domino%27s_Farms_Ann_Arbor_Township_Michigan.JPG/640px-Domino%27s_Pizza_Lobby_Entrance_Domino%27s_Farms_Ann_Arbor_Township_Michigan.JPG",
    name: "Domino's",
    cuisine: "Pizza",
    tags: ["sandwiches"],
    distance: 1.1,
    sourceType: "official",
    menuItems: [
      // Pizzas (Hand Tossed — most common)
      { id: "dom-cheese",         name: "Cheese Pizza (Hand Tossed)",       category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-pepperoni",      name: "Pepperoni Pizza (Hand Tossed)",    category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-bbq-chicken",    name: "BBQ Chicken Pizza",                category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "dom-buffalo-chick",  name: "Buffalo Chicken Pizza",            category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "dom-garden",         name: "Garden Fresh Pizza",               category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-meatzza",        name: "MeatZZa Pizza",                    category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-philly-steak",   name: "Philly Cheese Steak Pizza",        category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-thin-cheese",    name: "Cheese Pizza (Thin Crust)",        category: "Pizza",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-gf-cheese",      name: "Cheese Pizza (Gluten Free Crust)", category: "Pizza",     sourceType: "official", allergens: ["dairy","soy"], description: "Gluten-free crust, but made in shared kitchen — not safe for celiac." },
      // Chicken
      { id: "dom-wings-plain",    name: "Plain Wings",                      category: "Chicken",   sourceType: "official", allergens: [] },
      { id: "dom-wings-buffalo",  name: "Buffalo Wings",                    category: "Chicken",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "dom-wings-bbq",      name: "BBQ Wings",                        category: "Chicken",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-boneless",       name: "Boneless Chicken (Plain)",         category: "Chicken",   sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "dom-parm-bites",     name: "Parmesan Bread Bites",             category: "Chicken",   sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      // Sides & Pasta
      { id: "dom-breadsticks",    name: "Breadsticks",                      category: "Sides",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-cheesy-bread",   name: "Stuffed Cheesy Bread",             category: "Sides",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-pasta-baked",    name: "Chicken Alfredo (Pasta)",          category: "Pasta",     sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "dom-pasta-penne",    name: "Italian Sausage Marinara (Pasta)", category: "Pasta",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-salad",          name: "Garden Salad",                     category: "Sides",     sourceType: "official", allergens: [] },
      // Desserts
      { id: "dom-cinn-bread",     name: "Cinnamon Bread Twists",            category: "Desserts",  sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dom-marbled-cookie", name: "Marbled Cookie Brownie",           category: "Desserts",  sourceType: "official", allergens: ["wheat","dairy","soy","egg","tree-nut"] },
    ],
  },

  // ─── Jersey Mike's ───────────────────────────────────────────────────────────
  {
    id: "jerseymikes",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Jersey_Mike%27s_logo.svg/640px-Jersey_Mike%27s_logo.svg.png",
    name: "Jersey Mike's",
    cuisine: "Fast Casual · Sandwiches",
    tags: ["sandwiches"],
    distance: 0.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your bread",    category: "Breads",   required: true,  maxSelect: 1  },
        { label: "Choose your protein",  category: "Proteins", required: true,  maxSelect: 99 },
        { label: "Add cheese",           category: "Cheeses",  required: false, maxSelect: 1  },
        { label: "Add toppings",         category: "Toppings", required: false, maxSelect: 99 },
        { label: "Add sauces",           category: "Sauces",   required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Breads — pick your roll
      { id: "jm-b-white",         name: "White Sub Roll",                   category: "Breads",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "jm-b-wheat",         name: "Wheat Sub Roll",                   category: "Breads",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "jm-b-rosemary",      name: "Rosemary Parmesan Roll",           category: "Breads",    sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "jm-b-wrap",          name: "Wrap",                             category: "Breads",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "jm-b-lettuce",       name: "Lettuce Wrap (no bread)",          category: "Breads",    sourceType: "official", allergens: [] },
      // Proteins — pick your protein
      { id: "jm-p-roast-beef",    name: "Roast Beef",                       category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jm-p-turkey",        name: "Turkey",                           category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jm-p-ham",           name: "Ham",                              category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jm-p-tuna",          name: "Tuna Salad",                       category: "Proteins",  sourceType: "official", allergens: ["fish","egg"] },
      { id: "jm-p-capicola",      name: "Capicola",                         category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jm-p-salami",        name: "Salami",                           category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jm-p-pepperoni",     name: "Pepperoni",                        category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jm-p-chicken",       name: "Grilled Chicken",                  category: "Proteins",  sourceType: "official", allergens: ["soy"] },
      { id: "jm-p-steak",         name: "Steak",                            category: "Proteins",  sourceType: "official", allergens: ["soy"] },
      { id: "jm-p-meatball",      name: "Meatball",                         category: "Proteins",  sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "jm-p-bacon",         name: "Bacon",                            category: "Proteins",  sourceType: "official", allergens: [] },
      // Cheeses — pick your cheese
      { id: "jm-c-provolone",     name: "Provolone",                        category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      { id: "jm-c-american",      name: "American Cheese",                  category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      { id: "jm-c-swiss",         name: "Swiss",                            category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      { id: "jm-c-cheddar",       name: "Cheddar",                          category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      { id: "jm-c-pepper-jack",   name: "Pepper Jack",                      category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      // Vegetables & Toppings — all free of major allergens
      { id: "jm-v-lettuce",       name: "Lettuce",                          category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jm-v-tomato",        name: "Tomato",                           category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jm-v-onion",         name: "Onion",                            category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jm-v-hot-peppers",   name: "Hot Peppers",                      category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jm-v-bell-peppers",  name: "Bell Peppers",                     category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jm-v-banana-pep",    name: "Banana Peppers",                   category: "Toppings",  sourceType: "official", allergens: [] },
      // Sauces — pick your dressing
      { id: "jm-s-mayo",          name: "Mayonnaise",                       category: "Sauces",    sourceType: "official", allergens: ["egg","soy"] },
      { id: "jm-s-mustard",       name: "Yellow Mustard",                   category: "Sauces",    sourceType: "official", allergens: ["mustard"] },
      { id: "jm-s-oil-vinegar",   name: "Oil & Vinegar",                    category: "Sauces",    sourceType: "official", allergens: [] },
      { id: "jm-s-balsamic",      name: "Balsamic Glaze",                   category: "Sauces",    sourceType: "official", allergens: [] },
      { id: "jm-s-ranch",         name: "Ranch Dressing",                   category: "Sauces",    sourceType: "official", allergens: ["dairy","egg","soy"] },
      // Sides & Desserts
      { id: "jm-chips",           name: "Kettle Chips",                     category: "Sides",     sourceType: "official", allergens: [] },
      { id: "jm-cookie",          name: "Chocolate Chip Cookie",            category: "Desserts",  sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
    ],
  },

  // ─── Jimmy John's ────────────────────────────────────────────────────────────
  {
    id: "jimmyjohns",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Jimmy_John%27s_%28logo%29.svg/640px-Jimmy_John%27s_%28logo%29.svg.png",
    name: "Jimmy John's",
    cuisine: "Fast Casual · Sandwiches",
    tags: ["sandwiches"],
    distance: 0.5,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your bread",    category: "Breads",     required: true,  maxSelect: 1  },
        { label: "Choose your protein",  category: "Proteins",   required: true,  maxSelect: 99 },
        { label: "Add cheese",           category: "Cheeses",    required: false, maxSelect: 1  },
        { label: "Add toppings",         category: "Toppings",   required: false, maxSelect: 99 },
        { label: "Add condiments",       category: "Condiments", required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Breads — pick your bread
      { id: "jj-b-french",        name: "French Bread",                     category: "Breads",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "jj-b-wheat",         name: "Thick-Sliced Wheat Bread",         category: "Breads",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "jj-b-unwich",        name: "Unwich (Lettuce Wrap)",            category: "Breads",    sourceType: "official", allergens: [] },
      // Proteins — pick your protein
      { id: "jj-p-ham",           name: "Ham",                              category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jj-p-turkey",        name: "Turkey",                           category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jj-p-roast-beef",    name: "Roast Beef",                       category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jj-p-salami",        name: "Salami",                           category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jj-p-tuna",          name: "Tuna Salad",                       category: "Proteins",  sourceType: "official", allergens: ["fish","egg"] },
      { id: "jj-p-capicola",      name: "Capicola",                         category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jj-p-bacon",         name: "Bacon",                            category: "Proteins",  sourceType: "official", allergens: [] },
      { id: "jj-p-avocado",       name: "Avocado Spread",                   category: "Proteins",  sourceType: "official", allergens: [] },
      // Cheeses — pick your cheese
      { id: "jj-c-provolone",     name: "Provolone",                        category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      { id: "jj-c-swiss",         name: "Swiss",                            category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      { id: "jj-c-american",      name: "American Cheese",                  category: "Cheeses",   sourceType: "official", allergens: ["dairy"] },
      // Toppings — all free of major allergens
      { id: "jj-v-lettuce",       name: "Lettuce",                          category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jj-v-tomato",        name: "Tomato",                           category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jj-v-cucumber",      name: "Cucumber",                         category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jj-v-onion",         name: "Onion",                            category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jj-v-jalapeno",      name: "Jalapeños",                        category: "Toppings",  sourceType: "official", allergens: [] },
      { id: "jj-v-sprouts",       name: "Alfalfa Sprouts",                  category: "Toppings",  sourceType: "official", allergens: [] },
      // Condiments
      { id: "jj-s-mayo",          name: "Mayonnaise",                       category: "Condiments", sourceType: "official", allergens: ["egg","soy"] },
      { id: "jj-s-mustard",       name: "Yellow Mustard",                   category: "Condiments", sourceType: "official", allergens: ["mustard"] },
      { id: "jj-s-dijon",         name: "Dijon Mustard",                    category: "Condiments", sourceType: "official", allergens: ["mustard"] },
      { id: "jj-s-oil-vinegar",   name: "Oil & Vinegar",                    category: "Condiments", sourceType: "official", allergens: [] },
      // Sides & Desserts
      { id: "jj-chips",           name: "Chips",                            category: "Sides",     sourceType: "official", allergens: [] },
      { id: "jj-pickle",          name: "Pickle",                           category: "Sides",     sourceType: "official", allergens: [] },
      { id: "jj-cookie",          name: "Chocolate Chunk Cookie",           category: "Desserts",  sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
    ],
  },

  // ─── Chili's ─────────────────────────────────────────────────────────────────
  // Source: chilis.com/allergen-information
  {
    id: "chilis",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Chili%27s_Logo.svg/640px-Chili%27s_Logo.svg.png",
    name: "Chili's Grill & Bar",
    cuisine: "Casual Dining · American",
    tags: ["casual"],
    distance: 1.0,
    sourceType: "official",
    menuItems: [
      // Appetizers
      { id: "chils-blossom",       name: "Awesome Blossom Petals",           category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "chils-sw-eggrolls",   name: "Southwest Egg Rolls",              category: "Appetizers", sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "chils-loaded-skins",  name: "Loaded Potato Skins",              category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "chils-nachos",        name: "Nachos",                           category: "Appetizers", sourceType: "official", allergens: ["dairy","corn","soy","wheat"] },
      { id: "chils-chips-salsa",   name: "Chips & Salsa",                    category: "Appetizers", sourceType: "official", allergens: ["corn"] },
      { id: "chils-queso",         name: "Skillet Queso & Chips",            category: "Appetizers", sourceType: "official", allergens: ["dairy","corn","soy","wheat"] },
      // Burgers
      { id: "chils-old-timer",     name: "Old Timer Burger",                 category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "chils-bigmouth-bbq",  name: "Big Mouth Burger – Bacon BBQ",     category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "chils-mush-swiss",    name: "Mushroom Swiss Burger",            category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "chils-veggie-burger", name: "Veggie Burger",                    category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Chicken
      { id: "chils-crispers",      name: "Chicken Crispers",                 category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "chils-margarita-chk", name: "Margarita Grilled Chicken",        category: "Chicken",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "chils-ranch-chicken", name: "Crispy Chicken Ranch Sandwich",    category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Ribs & Steak
      { id: "chils-ribs",          name: "Baby Back Ribs",                   category: "Ribs",       sourceType: "official", allergens: ["soy","wheat"] },
      { id: "chils-sirloin",       name: "Classic Sirloin",                  category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "chils-fajita-trio",   name: "Fajita Trio",                      category: "Fajitas",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "chils-chicken-faj",   name: "Chicken Fajitas",                  category: "Fajitas",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "chils-steak-faj",     name: "Steak Fajitas",                    category: "Fajitas",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Tex-Mex
      { id: "chils-enchiladas",    name: "Combo Enchiladas",                 category: "Tex-Mex",    sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "chils-quesadilla",    name: "Chicken Quesadilla",               category: "Tex-Mex",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "chils-tacos",         name: "Street Corn Chicken Tacos",        category: "Tex-Mex",    sourceType: "official", allergens: ["wheat","dairy","soy","corn"] },
      // Salads
      { id: "chils-caesar",        name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "chils-house-salad",   name: "House Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "chils-santa-fe",      name: "Santa Fe Chicken Salad",           category: "Salads",     sourceType: "official", allergens: ["wheat","dairy","egg","corn"] },
      // Soups
      { id: "chils-chili",         name: "Chili",                            category: "Soups",      sourceType: "official", allergens: ["soy","wheat"] },
      // Sides
      { id: "chils-mashed",        name: "Mashed Potatoes",                  category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "chils-corn",          name: "Corn on the Cob",                  category: "Sides",      sourceType: "official", allergens: ["corn"] },
      { id: "chils-broccoli",      name: "Steamed Broccoli",                 category: "Sides",      sourceType: "official", allergens: [] },
      { id: "chils-fries",         name: "Seasoned Fries",                   category: "Sides",      sourceType: "official", allergens: ["soy","wheat"] },
      // Desserts
      { id: "chils-lava-cake",     name: "Molten Chocolate Cake",            category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "chils-skillet-brown", name: "Skillet Brownie",                  category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "chils-cheesecake",    name: "Cheesecake",                       category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
    ],
  },

  // ─── Applebee's ──────────────────────────────────────────────────────────────
  // Source: applebees.com/en/menu (allergen information)
  {
    id: "applebees",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/AB_Brand_Refresh_Logo_R.svg/640px-AB_Brand_Refresh_Logo_R.svg.png",
    name: "Applebee's",
    cuisine: "Casual Dining · American",
    tags: ["casual"],
    distance: 1.5,
    sourceType: "official",
    menuItems: [
      // Appetizers
      { id: "appb-mozz-sticks",    name: "Mozzarella Sticks",                category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "appb-sp-art-dip",     name: "Spinach & Artichoke Dip",          category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "appb-boneless-wings", name: "Boneless Wings",                   category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "appb-wonton-tacos",   name: "Chicken Wonton Tacos",             category: "Appetizers", sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "appb-nachos",         name: "Neighborhood Nachos",              category: "Appetizers", sourceType: "official", allergens: ["dairy","corn","soy","wheat"] },
      { id: "appb-brew-pretzels",  name: "Beer Pretzels & Beer Cheese Dip",  category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      // Burgers
      { id: "appb-classic-burger", name: "Classic Bacon Cheeseburger",       category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "appb-quesadilla-burg",name: "Quesadilla Burger",                category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "appb-super-smash",    name: "All-Day Brunch Burger",            category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Chicken & Sandwiches
      { id: "appb-classic-chk",    name: "Classic Chicken Sandwich",         category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "appb-bourbon-chk",    name: "Bourbon Street Chicken & Shrimp",  category: "Chicken",    sourceType: "official", allergens: ["shellfish","wheat","soy"] },
      { id: "appb-grilled-chk",    name: "Grilled Chicken",                  category: "Chicken",    sourceType: "official", allergens: ["soy"] },
      // Fish
      { id: "appb-beer-fish",      name: "Beer Battered Fish & Chips",       category: "Seafood",    sourceType: "official", allergens: ["fish","wheat","egg","soy"] },
      // Steak
      { id: "appb-sirloin",        name: "8 oz. Sirloin",                    category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "appb-ribeye",         name: "12 oz. Ribeye",                    category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      // Riblets & Ribs
      { id: "appb-riblets",        name: "Riblets",                          category: "Ribs",       sourceType: "official", allergens: ["wheat","soy"] },
      { id: "appb-half-ribs",      name: "Half Rack of Ribs",                category: "Ribs",       sourceType: "official", allergens: ["wheat","soy"] },
      // Pasta
      { id: "appb-pasta-broccoli", name: "Three Cheese Chicken Penne",       category: "Pasta",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      // Fajitas & Tex-Mex
      { id: "appb-chicken-faj",    name: "Chicken Fajitas",                  category: "Fajitas",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "appb-steak-faj",      name: "Steak Fajitas",                    category: "Fajitas",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Salads
      { id: "appb-oriental-salad", name: "Oriental Chicken Salad",           category: "Salads",     sourceType: "official", allergens: ["wheat","soy","sesame","egg","dairy","tree-nut"] },
      { id: "appb-caesar",         name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "appb-club-house",     name: "Classic Club House Grill Salad",   category: "Salads",     sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      // Sides
      { id: "appb-fries",          name: "French Fries",                     category: "Sides",      sourceType: "official", allergens: ["soy","wheat"] },
      { id: "appb-mashed",         name: "Garlic Mashed Potatoes",           category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "appb-broccoli",       name: "Steamed Broccoli",                 category: "Sides",      sourceType: "official", allergens: [] },
      { id: "appb-rice",           name: "Spanish Rice",                     category: "Sides",      sourceType: "official", allergens: ["soy"] },
      // Kids
      { id: "appb-kids-mac",       name: "Kids Macaroni & Cheese",           category: "Kids",       sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "appb-kids-chicken",   name: "Kids Grilled Chicken",             category: "Kids",       sourceType: "official", allergens: ["soy"] },
      // Desserts
      { id: "appb-triple-choc",    name: "Triple Chocolate Meltdown",        category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "appb-blondie",        name: "Blondie",                          category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","tree-nut","soy"] },
      { id: "appb-cheesecake",     name: "Blue Ribbon Cheesecake",           category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
    ],
  },

  // ─── Texas Roadhouse ─────────────────────────────────────────────────────────
  // Source: texasroadhouse.com allergen guide
  {
    id: "texas-roadhouse",
    name: "Texas Roadhouse",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Texas_Roadhouse.svg/640px-Texas_Roadhouse.svg.png",
    cuisine: "Casual Dining · Steakhouse",
    tags: ["steakhouse", "casual"],
    distance: 1.8,
    sourceType: "official",
    menuItems: [
      { id: "txrh-rolls",          name: "Fresh-Baked Rolls with Cinnamon Butter", category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "txrh-cactus",         name: "Cactus Blossom",                   category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "txrh-rattlesnake",    name: "Rattlesnake Bites",                category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "txrh-loaded-skins",   name: "Loaded Potato Skins",              category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "txrh-cheese-fries",   name: "Cheese Fries",                     category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "txrh-shrimp-app",     name: "Grilled Shrimp Appetizer",         category: "Appetizers", sourceType: "official", allergens: ["shellfish","soy"] },
      { id: "txrh-ribeye",         name: "USDA Choice Ribeye",               category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "txrh-sirloin",        name: "Hand-Cut Sirloin",                 category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "txrh-nys",            name: "New York Strip",                   category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "txrh-tbone",          name: "T-Bone",                           category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "txrh-porterhouse",    name: "Porterhouse",                      category: "Steaks",     sourceType: "official", allergens: ["soy"] },
      { id: "txrh-grilled-chk",    name: "Grilled Chicken",                  category: "Chicken",    sourceType: "official", allergens: ["soy"] },
      { id: "txrh-critters",       name: "Chicken Critters",                 category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "txrh-cfy-chicken",    name: "Country Fried Chicken",            category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "txrh-herb-chicken",   name: "Herb-Crusted Chicken",             category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "txrh-cfs",            name: "Country Fried Steak",              category: "Entrees",    sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "txrh-ribs",           name: "Fall-Off-The-Bone Ribs",           category: "Ribs",       sourceType: "official", allergens: ["soy","wheat"] },
      { id: "txrh-salmon",         name: "Grilled Salmon",                   category: "Seafood",    sourceType: "official", allergens: ["fish","soy"] },
      { id: "txrh-tilapia",        name: "Herb-Grilled Tilapia",             category: "Seafood",    sourceType: "official", allergens: ["fish","dairy","soy"] },
      { id: "txrh-shrimp-dinner",  name: "Grilled Shrimp Dinner",            category: "Seafood",    sourceType: "official", allergens: ["shellfish","soy"] },
      { id: "txrh-classic-burger", name: "Classic Cheeseburger",             category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "txrh-mushroom-swiss", name: "Mushroom Swiss Burger",            category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "txrh-bbq-burger",     name: "BBQ Bacon Cheeseburger",           category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "txrh-caesar",         name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "txrh-house-salad",    name: "House Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "txrh-mashed",         name: "Mashed Potatoes",                  category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "txrh-mac",            name: "Mac & Cheese",                     category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "txrh-sweet-potato",   name: "Loaded Sweet Potato",              category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "txrh-baked-potato",   name: "Loaded Baked Potato",              category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "txrh-broccoli",       name: "Steamed Broccoli",                 category: "Sides",      sourceType: "official", allergens: [] },
      { id: "txrh-rice",           name: "Rice Pilaf",                       category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "txrh-seasonal-veg",   name: "Seasonal Vegetables",              category: "Sides",      sourceType: "official", allergens: [] },
      { id: "txrh-cheesecake",     name: "Strawberry Cheesecake",            category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "txrh-brownie",        name: "Big Ol Brownie",                   category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
    ],
  },

  // ─── LongHorn Steakhouse ─────────────────────────────────────────────────────
  // Source: longhornsteakhouse.com allergen information
  {
    id: "longhorn-steakhouse",
    name: "LongHorn Steakhouse",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Exterior_of_a_LongHorn_Steakhouse_restaurant_in_Blairsville%2C_Georgia_01.jpg/640px-Exterior_of_a_LongHorn_Steakhouse_restaurant_in_Blairsville%2C_Georgia_01.jpg",
    cuisine: "Casual Dining · Steakhouse",
    tags: ["steakhouse", "casual"],
    distance: 2.0,
    sourceType: "official",
    menuItems: [
      { id: "lhs-wild-west-shrimp", name: "Wild West Shrimp",               category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","soy"] },
      { id: "lhs-fire-cracker",    name: "Fire-Cracker Shrimp",             category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","soy","dairy"] },
      { id: "lhs-spinach-dip",     name: "Spinach and Artichoke Dip",       category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "lhs-bread",           name: "Freshly Baked Bread",             category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "lhs-lobster-bisque",  name: "Lobster Bisque",                  category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat","soy"] },
      { id: "lhs-potato-soup",     name: "Baked Potato Soup",               category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "lhs-outlaw-ribeye",   name: "Outlaw Ribeye",                   category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-flos-filet",      name: "Flos Filet",                      category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-nys",             name: "New York Strip",                  category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-tbone",           name: "T-Bone",                          category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-porterhouse",     name: "Porterhouse",                     category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-flat-iron",       name: "Flat Iron",                       category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-parm-chicken",    name: "Parmesan Crusted Chicken",        category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "lhs-grilled-chicken", name: "Grilled Chicken",                 category: "Chicken",    sourceType: "official", allergens: ["soy"] },
      { id: "lhs-chicken-tenders", name: "Crispy Chicken Tenders",          category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "lhs-ribs",            name: "Baby Back Ribs",                  category: "Ribs",       sourceType: "official", allergens: ["soy","wheat"] },
      { id: "lhs-salmon",          name: "Grilled Salmon",                  category: "Seafood",    sourceType: "official", allergens: ["fish","dairy","soy"] },
      { id: "lhs-shrimp-pasta",    name: "Shrimp and Lobster Linguine",     category: "Seafood",    sourceType: "official", allergens: ["shellfish","wheat","dairy","egg","soy"] },
      { id: "lhs-caesar",          name: "Caesar Salad",                    category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "lhs-house",           name: "LongHorn House Salad",            category: "Salads",     sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "lhs-strawberry-salad",name: "Strawberry Harvest Chicken Salad",category: "Salads",     sourceType: "official", allergens: ["dairy","tree-nut","wheat","soy"] },
      { id: "lhs-mac",             name: "Mac and Cheese",                  category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "lhs-mashed",          name: "Seasoned Mashed Potatoes",        category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-baked-potato",    name: "Loaded Baked Potato",             category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "lhs-asparagus",       name: "Fresh Asparagus",                 category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "lhs-broccoli",        name: "Fresh Steamed Broccoli",          category: "Sides",      sourceType: "official", allergens: [] },
      { id: "lhs-fries",           name: "Seasoned Fries",                  category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "lhs-stampede",        name: "Chocolate Stampede",              category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "lhs-cheesecake",      name: "Mountain Top Cheesecake",         category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "lhs-lava",            name: "Molten Lava Cake",                category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── KJ's Steakhouse ─────────────────────────────────────────────────────────
  {
    id: "kjs-steakhouse",
    name: "KJs Steakhouse",
    cuisine: "Upscale Casual · Steakhouse",
    tags: ["steakhouse"],
    distance: 2.2,
    sourceType: "official",
    menuItems: [
      { id: "kjs-onion-rings",     name: "Onion Rings",                      category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "kjs-shrimp-cocktail", name: "Shrimp Cocktail",                  category: "Appetizers", sourceType: "official", allergens: ["shellfish"] },
      { id: "kjs-crab-cakes",      name: "Crab Cakes",                       category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","dairy"] },
      { id: "kjs-calamari",        name: "Fried Calamari",                   category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg"] },
      { id: "kjs-bread",           name: "Fresh Bread and Butter",           category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "kjs-french-onion",    name: "French Onion Soup",                category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "kjs-caesar",          name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "kjs-wedge",           name: "Wedge Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "kjs-house-salad",     name: "House Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "kjs-ribeye",          name: "Prime Ribeye",                     category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "kjs-filet",           name: "Filet Mignon",                     category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "kjs-nys",             name: "New York Strip",                   category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "kjs-tbone",           name: "T-Bone",                           category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "kjs-porterhouse",     name: "Porterhouse",                      category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "kjs-grilled-chicken", name: "Grilled Chicken Breast",           category: "Chicken",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "kjs-chicken-parm",    name: "Chicken Parmesan",                 category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "kjs-salmon",          name: "Atlantic Salmon",                  category: "Seafood",    sourceType: "official", allergens: ["fish","dairy"] },
      { id: "kjs-sea-bass",        name: "Chilean Sea Bass",                 category: "Seafood",    sourceType: "official", allergens: ["fish","dairy"] },
      { id: "kjs-lobster",         name: "Broiled Lobster Tail",             category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy"] },
      { id: "kjs-mashed",          name: "Garlic Mashed Potatoes",           category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "kjs-creamed-spinach", name: "Creamed Spinach",                  category: "Sides",      sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "kjs-au-gratin",       name: "Potatoes Au Gratin",               category: "Sides",      sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "kjs-asparagus",       name: "Grilled Asparagus",                category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "kjs-fries",           name: "Steak Fries",                      category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "kjs-mac",             name: "Mac and Cheese",                   category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "kjs-cheesecake",      name: "New York Cheesecake",              category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "kjs-lava",            name: "Chocolate Lava Cake",              category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "kjs-bread-pudding",   name: "Bread Pudding",                    category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
    ],
  },

  // ─── Ruth's Chris Steak House ────────────────────────────────────────────────
  // Source: ruthschris.com — all steaks finished with butter on 500-degree plates
  {
    id: "ruths-chris",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Ruths_Chris_Logo.svg/640px-Ruths_Chris_Logo.svg.png",
    name: "Ruths Chris Steak House",
    cuisine: "Fine Dining · Steakhouse",
    tags: ["steakhouse", "fine-dining"],
    distance: 2.5,
    sourceType: "official",
    menuItems: [
      { id: "rc-shrimp-cocktail",  name: "Shrimp Cocktail",                  category: "Appetizers", sourceType: "official", allergens: ["shellfish"] },
      { id: "rc-crab-cakes",       name: "Sizzling Blue Crab Cakes",         category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","dairy"] },
      { id: "rc-calamari",         name: "Crispy Calamari",                  category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","dairy"] },
      { id: "rc-she-crab-soup",    name: "She-Crab Soup",                    category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat"] },
      { id: "rc-mush-soup",        name: "Wild Mushroom Soup",               category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "rc-bread",            name: "House Bread",                      category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "rc-caesar",           name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "rc-wedge",            name: "Wedge Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "rc-house",            name: "House Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "rc-cowboy-ribeye",    name: "Cowboy Ribeye",                    category: "Steaks",     sourceType: "official", allergens: ["dairy"] },
      { id: "rc-filet-petite",     name: "Petite Filet",                     category: "Steaks",     sourceType: "official", allergens: ["dairy"] },
      { id: "rc-filet-11oz",       name: "Filet 11 oz",                      category: "Steaks",     sourceType: "official", allergens: ["dairy"] },
      { id: "rc-nys",              name: "New York Strip",                   category: "Steaks",     sourceType: "official", allergens: ["dairy"] },
      { id: "rc-tbone",            name: "T-Bone",                           category: "Steaks",     sourceType: "official", allergens: ["dairy"] },
      { id: "rc-porterhouse",      name: "Porterhouse for Two",              category: "Steaks",     sourceType: "official", allergens: ["dairy"] },
      { id: "rc-stuffed-chicken",  name: "Stuffed Chicken Breast",           category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "rc-lamb-chops",       name: "Lamb Chops",                       category: "Chops",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "rc-lobster",          name: "Cold Water Lobster Tail",          category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy"] },
      { id: "rc-sea-bass",         name: "Chilean Sea Bass",                 category: "Seafood",    sourceType: "official", allergens: ["fish","dairy"] },
      { id: "rc-salmon",           name: "Salmon",                           category: "Seafood",    sourceType: "official", allergens: ["fish","dairy","soy"] },
      { id: "rc-shrimp",           name: "Barbequed Shrimp",                 category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy","wheat"] },
      { id: "rc-creamed-spinach",  name: "Creamed Spinach",                  category: "Sides",      sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "rc-au-gratin",        name: "Potatoes Au Gratin",               category: "Sides",      sourceType: "official", allergens: ["dairy","wheat","egg"] },
      { id: "rc-lobster-mac",      name: "Lobster Mac and Cheese",           category: "Sides",      sourceType: "official", allergens: ["shellfish","dairy","wheat","egg"] },
      { id: "rc-mashed",           name: "Garlic Mashed Potatoes",           category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "rc-lyonnaise",        name: "Lyonnaise Potatoes",               category: "Sides",      sourceType: "official", allergens: ["dairy","egg"] },
      { id: "rc-shoestring",       name: "Shoestring Fries",                 category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "rc-asparagus",        name: "Fresh Asparagus",                  category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "rc-broccoli",         name: "Broccoli",                         category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "rc-mushrooms",        name: "Sauteed Mushrooms",                category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "rc-bread-pudding",    name: "Caramel Bread Pudding",            category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "rc-choc-cake",        name: "Chocolate Sin Cake",               category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "rc-cheesecake",       name: "Vanilla Bean Cheesecake",          category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "rc-creme-brulee",     name: "Creme Brulee",                     category: "Desserts",   sourceType: "official", allergens: ["dairy","egg"] },
    ],
  },

  // ─── Cooper's Hawk Winery & Restaurants ─────────────────────────────────────
  // Source: coopershawkwinery.com/menu
  {
    id: "coopers-hawk",
    name: "Coopers Hawk Winery and Restaurant",
    cuisine: "Casual Fine Dining · American",
    tags: ["casual", "fine-dining"],
    distance: 2.8,
    sourceType: "official",
    menuItems: [
      { id: "ch-hummus",           name: "Hummus Trio",                      category: "Appetizers", sourceType: "official", allergens: ["sesame","legumes","wheat"] },
      { id: "ch-bruschetta",       name: "Bruschetta",                       category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy"] },
      { id: "ch-spinach-dip",      name: "Spinach and Artichoke Dip",        category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "ch-flatbread",        name: "Cheese Flatbread",                 category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "ch-shrimp",           name: "Jumbo Shrimp Cocktail",            category: "Appetizers", sourceType: "official", allergens: ["shellfish"] },
      { id: "ch-calamari",         name: "Calamari",                         category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg"] },
      { id: "ch-crab-cakes",       name: "Crab Cakes",                       category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","dairy"] },
      { id: "ch-mushroom-soup",    name: "Wild Mushroom Soup",               category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "ch-caesar",           name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "ch-chopped-salad",    name: "Chopped Salad",                    category: "Salads",     sourceType: "official", allergens: ["dairy","tree-nut","egg"] },
      { id: "ch-house-salad",      name: "House Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ch-napa-chicken",     name: "Napa Chicken and Grapes",          category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "ch-marsala",          name: "Chicken Marsala",                  category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "ch-tikka-masala",     name: "Chicken Tikka Masala",             category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "ch-pork-tenderloin",  name: "Pork Tenderloin",                  category: "Entrees",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ch-flat-iron",        name: "Flat Iron Steak",                  category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ch-ribeye",           name: "Ribeye",                           category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ch-duck",             name: "Duck Confit",                      category: "Entrees",    sourceType: "official", allergens: ["soy"] },
      { id: "ch-short-rib-rav",    name: "Short Rib Ravioli",                category: "Pasta",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ch-lobster-mac",      name: "Lobster Mac and Cheese",           category: "Pasta",      sourceType: "official", allergens: ["shellfish","dairy","wheat","egg","soy"] },
      { id: "ch-salmon",           name: "Grilled Salmon",                   category: "Seafood",    sourceType: "official", allergens: ["fish","dairy","soy"] },
      { id: "ch-sea-bass",         name: "Chilean Sea Bass",                 category: "Seafood",    sourceType: "official", allergens: ["fish","dairy"] },
      { id: "ch-shrimp-scampi",    name: "Shrimp Scampi",                    category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy","wheat","soy"] },
      { id: "ch-tuna-poke",        name: "Tuna Poke Bowl",                   category: "Seafood",    sourceType: "official", allergens: ["fish","soy","sesame"] },
      { id: "ch-fish-tacos",       name: "Fish Tacos",                       category: "Seafood",    sourceType: "official", allergens: ["fish","wheat","dairy","soy"] },
      { id: "ch-truffle-fries",    name: "Truffle Parmesan Fries",           category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "ch-asparagus",        name: "Grilled Asparagus",                category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "ch-mashed",           name: "Garlic Mashed Potatoes",           category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "ch-broccoli",         name: "Roasted Broccoli",                 category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "ch-mac",              name: "Mac and Cheese",                   category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "ch-lava-cake",        name: "Chocolate Lava Cake",              category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ch-cheesecake",       name: "New York Style Cheesecake",        category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "ch-bread-pudding",    name: "Bread Pudding",                    category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ch-creme-brulee",     name: "Creme Brulee",                     category: "Desserts",   sourceType: "official", allergens: ["dairy","egg"] },
      { id: "ch-sorbet",           name: "Seasonal Sorbet",                  category: "Desserts",   sourceType: "official", allergens: [] },
    ],
  },

  // ─── Olive Garden ────────────────────────────────────────────────────────────
  // Source: olivegarden.com — Allergen Information PDF
  {
    id: "olive-garden",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/Olive_Garden_Logo.svg/640px-Olive_Garden_Logo.svg.png",
    name: "Olive Garden",
    cuisine: "Casual Dining · Italian",
    tags: ["italian", "pasta", "casual"],
    distance: 1.2,
    sourceType: "official",
    menuItems: [
      { id: "og-breadsticks",      name: "Breadsticks",                      category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "og-spinach-dip",      name: "Spinach-Artichoke Dip",            category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "og-calamari",         name: "Calamari",                         category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","dairy"] },
      { id: "og-garden-salad",     name: "Garden Salad",                     category: "Salads",     sourceType: "official", allergens: ["egg","dairy"] },
      { id: "og-caesar",           name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "og-zuppa",            name: "Zuppa Toscana",                    category: "Soups",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "og-gnocchi-soup",     name: "Chicken & Gnocchi",                category: "Soups",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "og-pasta-e-fagioli",  name: "Pasta e Fagioli",                  category: "Soups",      sourceType: "official", allergens: ["wheat","soy","legumes"] },
      { id: "og-fettuccine-alf",   name: "Fettuccine Alfredo",               category: "Pasta",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "og-spaghetti-meat",   name: "Spaghetti with Meat Sauce",        category: "Pasta",      sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "og-chicken-parm",     name: "Chicken Parmigiana",               category: "Entrees",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "og-lasagna",          name: "Lasagna Classico",                 category: "Pasta",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "og-shrimp-scampi",    name: "Shrimp Scampi",                    category: "Seafood",    sourceType: "official", allergens: ["shellfish","wheat","dairy","soy"] },
      { id: "og-tour-italy",       name: "Tour of Italy",                    category: "Entrees",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "og-carbonara",        name: "Chicken & Shrimp Carbonara",       category: "Pasta",      sourceType: "official", allergens: ["shellfish","wheat","dairy","egg","soy"] },
      { id: "og-tiramisu",         name: "Tiramisu",                         category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "og-black-tie",        name: "Black Tie Mousse Cake",            category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── Red Lobster ─────────────────────────────────────────────────────────────
  // Source: redlobster.com — Allergen Guide
  {
    id: "red-lobster",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/A_Red_Lobster_seafood_restaurant_in_Chattanooga%2C_Tennessee_09.jpg/640px-A_Red_Lobster_seafood_restaurant_in_Chattanooga%2C_Tennessee_09.jpg",
    name: "Red Lobster",
    cuisine: "Casual Dining · Seafood",
    tags: ["seafood", "casual"],
    distance: 1.5,
    sourceType: "official",
    menuItems: [
      { id: "rl-biscuits",         name: "Cheddar Bay Biscuits",             category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "rl-shrimp-cocktail",  name: "Jumbo Shrimp Cocktail",            category: "Appetizers", sourceType: "official", allergens: ["shellfish"] },
      { id: "rl-calamari",         name: "Calamari",                         category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","dairy"] },
      { id: "rl-chowder",          name: "Clam Chowder",                     category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat","soy"] },
      { id: "rl-bisque",           name: "Lobster Bisque",                   category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat","egg"] },
      { id: "rl-caesar",           name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "rl-lobster-tail",     name: "Lobster Tail",                     category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy"] },
      { id: "rl-snow-crab",        name: "Snow Crab Legs",                   category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy"] },
      { id: "rl-ultimate-feast",   name: "Ultimate Feast",                   category: "Seafood",    sourceType: "official", allergens: ["shellfish","dairy","wheat","egg"] },
      { id: "rl-walts-shrimp",     name: "Walt's Favorite Shrimp",           category: "Seafood",    sourceType: "official", allergens: ["shellfish","wheat","egg","soy"] },
      { id: "rl-admirals-feast",   name: "Admiral's Feast",                  category: "Seafood",    sourceType: "official", allergens: ["shellfish","fish","wheat","egg","soy"] },
      { id: "rl-salmon",           name: "Wood-Grilled Salmon",              category: "Seafood",    sourceType: "official", allergens: ["fish","dairy","soy"] },
      { id: "rl-shrimp-linguini",  name: "Shrimp Linguini Alfredo",          category: "Pasta",      sourceType: "official", allergens: ["shellfish","wheat","dairy","egg","soy"] },
      { id: "rl-choc-wave",        name: "Chocolate Wave",                   category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── IHOP ────────────────────────────────────────────────────────────────────
  // Source: ihop.com — Allergen Info
  {
    id: "ihop",
    name: "IHOP",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/IHOP_logo.svg/640px-IHOP_logo.svg.png",
    cuisine: "Casual Dining · Breakfast",
    tags: ["breakfast", "brunch", "pancakes"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your main",     categories: ["Pancakes","Waffles","French Toast","Eggs","Breakfast"], required: true,  maxSelect: 1, category: "Pancakes" },
        { label: "Add a side",           category: "Sides",     required: false, maxSelect: 2 },
      ],
    },
    menuItems: [
      { id: "ihop-buttermilk",     name: "Buttermilk Pancakes",              category: "Pancakes",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-belgian-waffle", name: "Belgian Waffle",                   category: "Waffles",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-french-toast",   name: "French Toast",                     category: "French Toast", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-eggs-benedict",  name: "Eggs Benedict",                    category: "Eggs",       sourceType: "official", allergens: ["egg","dairy","wheat","soy"] },
      { id: "ihop-western-omelet", name: "Western Omelette",                 category: "Eggs",       sourceType: "official", allergens: ["egg","dairy","wheat","soy"] },
      { id: "ihop-big-breakfast",  name: "Big Breakfast",                    category: "Breakfast",  sourceType: "official", allergens: ["egg","dairy","wheat","soy"] },
      { id: "ihop-ckn-waffles",    name: "Chicken & Waffles",                category: "Waffles",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-cfs",            name: "Country Fried Steak",              category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-ny-cheesecake",  name: "New York Cheesecake Pancakes",     category: "Pancakes",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-avocado-toast",  name: "Avocado Toast",                    category: "Toasts",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-strawberry-ft",  name: "Strawberry Banana French Toast",   category: "French Toast", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-harvest-grain",  name: "Harvest Grain 'N Nut Pancakes",    category: "Pancakes",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "ihop-short-stack",    name: "Short Stack (2 Buttermilk)",       category: "Pancakes",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ihop-spinach-omelet", name: "Spinach & Mushroom Omelette",      category: "Eggs",       sourceType: "official", allergens: ["egg","dairy","wheat","soy"] },
      { id: "ihop-steak-eggs",     name: "Steak & Eggs",                     category: "Breakfast",  sourceType: "official", allergens: ["egg","dairy","wheat","soy"] },
      { id: "ihop-oatmeal",        name: "Hearty Oatmeal",                   category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","soy","tree-nut"] },
      // Sides
      { id: "ihop-hash-browns",    name: "Hash Browns",                      category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "ihop-sausage-links",  name: "Pork Sausage Links",               category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "ihop-bacon-strips",   name: "Bacon Strips",                     category: "Sides",      sourceType: "official", allergens: [] },
      { id: "ihop-egg-any-style",  name: "Eggs (Any Style)",                 category: "Sides",      sourceType: "official", allergens: ["egg","dairy"] },
      { id: "ihop-fruit-cup",      name: "Seasonal Fruit Cup",               category: "Sides",      sourceType: "official", allergens: [] },
    ],
  },

  // ─── Denny's ─────────────────────────────────────────────────────────────────
  // Source: dennys.com — Allergen Menu
  {
    id: "dennys",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Denny%27s_Logo_06.2022.svg/640px-Denny%27s_Logo_06.2022.svg.png",
    name: "Denny's",
    cuisine: "Casual Dining · American Breakfast",
    tags: ["breakfast", "american", "24-hour"],
    distance: 1.1,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your main",  categories: ["Breakfast","Pancakes","French Toast","Burgers","Dinner"], required: true,  maxSelect: 1, category: "Breakfast" },
        { label: "Add a side",        category: "Sides",        required: false, maxSelect: 2 },
      ],
    },
    menuItems: [
      { id: "dens-grand-slam",     name: "Grand Slam Breakfast",             category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-pancakes",       name: "Buttermilk Pancakes",              category: "Pancakes",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-french-toast",   name: "French Toast",                     category: "French Toast", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-moons-hammy",    name: "Moons Over My Hammy",              category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-lumber-slam",    name: "Lumberjack Slam",                  category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-avocado-burger", name: "Bacon Avocado Cheeseburger",       category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "dens-ckn-tenders",    name: "Chicken Tenders",                  category: "Dinner",     sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "dens-loaded-tots",    name: "Loaded Nacho Tots",                category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "dens-clam-chowder",   name: "Clam Chowder",                     category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat"] },
      { id: "dens-club-sandwich",  name: "Club Sandwich",                    category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-pot-roast",      name: "Pot Roast Dinner",                 category: "Dinner",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dens-super-slam",     name: "Super Slam",                       category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-fit-slam",       name: "Fit Slam (egg whites & oatmeal)",  category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dens-build-omelet",   name: "Build Your Own Omelette",          category: "Breakfast",  sourceType: "official", allergens: ["egg","dairy","soy"] },
      // Sides
      { id: "dens-hash-browns",    name: "Hash Browns",                      category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "dens-sausage",        name: "Pork Sausage Patties",             category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "dens-bacon",          name: "Bacon Strips",                     category: "Sides",      sourceType: "official", allergens: [] },
      { id: "dens-toast",          name: "Toast (White or Wheat)",           category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "dens-grits",          name: "Grits",                            category: "Sides",      sourceType: "official", allergens: ["dairy","corn"] },
      { id: "dens-fruit",          name: "Fresh Fruit",                      category: "Sides",      sourceType: "official", allergens: [] },
    ],
  },

  // ─── The Cheesecake Factory ──────────────────────────────────────────────────
  // Source: thecheesecakefactory.com — Allergen Information
  {
    id: "cheesecake-factory",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/A_Cheesecake_Factory_restaurant_at_The_Summit_mall_in_Birmingham%2C_Alabama_01.jpg/640px-A_Cheesecake_Factory_restaurant_at_The_Summit_mall_in_Birmingham%2C_Alabama_01.jpg",
    name: "The Cheesecake Factory",
    cuisine: "Casual Dining · American",
    tags: ["american", "casual", "cheesecake"],
    distance: 2.0,
    sourceType: "official",
    menuItems: [
      { id: "ccf-egg-rolls",       name: "Avocado Egg Rolls",                category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","tree-nut","soy"] },
      { id: "ccf-fried-mac",       name: "Fried Macaroni and Cheese",        category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ccf-bang-bang",       name: "Bang Bang Chicken and Shrimp",     category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","soy","dairy"] },
      { id: "ccf-crab-dip",        name: "Warm Crab and Artichoke Dip",      category: "Appetizers", sourceType: "official", allergens: ["shellfish","dairy","wheat","soy"] },
      { id: "ccf-caesar",          name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "ccf-glamburger",      name: "The Factory Burger",               category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "ccf-pasta-carbonara", name: "Pasta Carbonara",                  category: "Pasta",      sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "ccf-chicken-bellagio",name: "Chicken Bellagio",                 category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "ccf-pasta-davinci",   name: "Pasta Da Vinci",                   category: "Pasta",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "ccf-chicken-madeira", name: "Chicken Madeira",                  category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "ccf-chicken-marsala", name: "Chicken Marsala",                  category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ccf-steak-diane",     name: "Steak Diane",                      category: "Steaks",     sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "ccf-jambalaya",       name: "Cajun Jambalaya Pasta",            category: "Pasta",      sourceType: "official", allergens: ["shellfish","wheat","egg","soy"] },
      { id: "ccf-chicken-piccata", name: "Chicken Piccata",                  category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ccf-nachos",          name: "Factory Nachos",                   category: "Appetizers", sourceType: "official", allergens: ["corn","dairy","wheat","soy"] },
      { id: "ccf-original-chsck",  name: "Original Cheesecake",              category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "ccf-strawberry-chsck",name: "Fresh Strawberry Cheesecake",      category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── Buffalo Wild Wings ──────────────────────────────────────────────────────
  // Source: buffalowildwings.com — Allergen Menu
  {
    id: "buffalo-wild-wings",
    name: "Buffalo Wild Wings",
    cuisine: "Casual Dining · Wings & Sports Bar",
    tags: ["wings", "sports-bar", "casual"],
    distance: 1.3,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your wings",   category: "Wings",    required: true,  maxSelect: 1  },
        { label: "Choose your sauce",   category: "Sauces",   required: true,  maxSelect: 1  },
        { label: "Add a side & dip",    category: "Sides",    required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Wings
      { id: "bww-trad-wings",      name: "Traditional Wings",                category: "Wings",      sourceType: "official", allergens: ["soy","egg"] },
      { id: "bww-boneless-wings",  name: "Boneless Wings",                   category: "Wings",      sourceType: "official", allergens: ["wheat","egg","soy"] },
      // Sauces
      { id: "bww-s-mild",          name: "Mild",                             category: "Sauces",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "bww-s-medium",        name: "Medium",                           category: "Sauces",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "bww-s-hot",           name: "Hot",                              category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "bww-s-wild",          name: "Wild",                             category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "bww-s-nashville",     name: "Nashville Hot",                    category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "bww-s-honey-bbq",     name: "Honey BBQ",                        category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "bww-s-asian-zing",    name: "Asian Zing",                       category: "Sauces",     sourceType: "official", allergens: ["soy","wheat","sesame"] },
      { id: "bww-s-parmesan-garlic",name: "Parmesan Garlic",                 category: "Sauces",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "bww-s-mango-hab",     name: "Mango Habanero",                   category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "bww-s-lemon-pepper",  name: "Lemon Pepper (Dry Rub)",           category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "bww-s-desert-heat",   name: "Desert Heat (Dry Rub)",            category: "Sauces",     sourceType: "official", allergens: [] },
      // Sides
      { id: "bww-onion-rings",     name: "Beer-Battered Onion Rings",        category: "Sides",      sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "bww-s-fries",         name: "French Fries",                     category: "Sides",      sourceType: "official", allergens: [] },
      { id: "bww-s-celery",        name: "Celery & Carrots",                 category: "Sides",      sourceType: "official", allergens: [] },
      { id: "bww-s-ranch",         name: "Ranch Dipping Sauce",              category: "Sides",      sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "bww-s-blue-cheese",   name: "Blue Cheese Dipping Sauce",        category: "Sides",      sourceType: "official", allergens: ["dairy","egg","soy"] },
      // Other menu items
      { id: "bww-mozz-sticks",     name: "Mozzarella Sticks",                category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "bww-nachos",          name: "Loaded Nachos",                    category: "Appetizers", sourceType: "official", allergens: ["corn","dairy","wheat","soy"] },
      { id: "bww-quesadilla",      name: "Chicken Quesadilla",               category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "bww-burger",          name: "Classic Cheeseburger",             category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "bww-chicken-wrap",    name: "Buffalo Chicken Wrap",             category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "bww-ckn-sandwich",    name: "Crispy Chicken Sandwich",          category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "bww-street-tacos",    name: "Street Tacos",                     category: "Tacos",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
    ],
  },

  // ─── Wingstop ────────────────────────────────────────────────────────────────
  // Source: wingstop.com — Nutrition & Allergen Info
  {
    id: "wingstop",
    name: "Wingstop",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Wingstop_logo.svg/640px-Wingstop_logo.svg.png",
    cuisine: "Fast Casual · Wings",
    tags: ["wings", "fast-casual"],
    distance: 0.8,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your wings",   category: "Wings",    required: true,  maxSelect: 1  },
        { label: "Choose your flavor",  category: "Sauces",   required: true,  maxSelect: 1  },
        { label: "Add a dip & side",    category: "Sides",    required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Wings & Tenders
      { id: "ws-classic-wings",    name: "Classic Wings",                    category: "Wings",      sourceType: "official", allergens: ["soy"] },
      { id: "ws-boneless-wings",   name: "Boneless Wings",                   category: "Wings",      sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "ws-tenders",          name: "Chicken Tenders",                  category: "Wings",      sourceType: "official", allergens: ["wheat","egg","soy"] },
      // Sauces & Dry Rubs
      { id: "ws-s-original-hot",   name: "Original Hot",                     category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "ws-s-mild",           name: "Mild",                             category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "ws-s-lemon-pepper",   name: "Lemon Pepper (Dry Rub)",           category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "ws-s-cajun",          name: "Cajun (Dry Rub)",                  category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "ws-s-bbq",            name: "Hickory Smoked BBQ",               category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "ws-s-garlic-parm",    name: "Garlic Parmesan",                  category: "Sauces",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "ws-s-mango-hab",      name: "Mango Habanero",                   category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "ws-s-atomic",         name: "Atomic",                           category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "ws-s-korean-q",       name: "Spicy Korean Q",                   category: "Sauces",     sourceType: "official", allergens: ["soy","wheat","sesame"] },
      // Sides & Dips
      { id: "ws-cajun-corn",       name: "Cajun Fried Corn",                 category: "Sides",      sourceType: "official", allergens: ["corn","dairy","wheat","soy"] },
      { id: "ws-seasoned-fries",   name: "Seasoned Fries",                   category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "ws-voodoo-fries",     name: "Louisiana Voodoo Fries",           category: "Sides",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "ws-ranch",            name: "Ranch Dip",                        category: "Sides",      sourceType: "official", allergens: ["egg","dairy","soy"] },
      { id: "ws-blue-cheese",      name: "Blue Cheese Dip",                  category: "Sides",      sourceType: "official", allergens: ["dairy","egg","soy"] },
    ],
  },

  // ─── Panda Express ───────────────────────────────────────────────────────────
  // Source: pandaexpress.com — Allergen Information
  {
    id: "panda-express",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Panda_Express_Storefront_%2848128044623%29.jpg/640px-Panda_Express_Storefront_%2848128044623%29.jpg",
    name: "Panda Express",
    cuisine: "Fast Casual · Chinese-American",
    tags: ["chinese", "fast-casual", "asian"],
    distance: 0.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your side",    category: "Sides",    required: true,  maxSelect: 1  },
        { label: "Choose your entree",  category: "Entrees",  required: true,  maxSelect: 2  },
      ],
    },
    menuItems: [
      // Sides — your plate base
      { id: "pe-white-rice",       name: "Steamed White Rice",               category: "Sides",      sourceType: "official", allergens: [] },
      { id: "pe-brown-rice",       name: "Steamed Brown Rice",               category: "Sides",      sourceType: "official", allergens: [] },
      { id: "pe-chow-mein",        name: "Chow Mein",                        category: "Sides",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pe-fried-rice",       name: "Fried Rice",                       category: "Sides",      sourceType: "official", allergens: ["soy","wheat","egg"] },
      { id: "pe-super-greens",     name: "Super Greens",                     category: "Sides",      sourceType: "official", allergens: [] },
      // Entrees
      { id: "pe-orange-chicken",   name: "Orange Chicken",                   category: "Entrees",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "pe-beijing-beef",     name: "Beijing Beef",                     category: "Entrees",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "pe-kung-pao",         name: "Kung Pao Chicken",                 category: "Entrees",    sourceType: "official", allergens: ["peanut","soy","wheat","egg"] },
      { id: "pe-broccoli-beef",    name: "Broccoli Beef",                    category: "Entrees",    sourceType: "official", allergens: ["soy","wheat"] },
      { id: "pe-honey-walnut-shr", name: "Honey Walnut Shrimp",              category: "Entrees",    sourceType: "official", allergens: ["shellfish","tree-nut","egg","dairy","soy","wheat","sesame"] },
      { id: "pe-string-bean-ckn",  name: "String Bean Chicken Breast",       category: "Entrees",    sourceType: "official", allergens: ["soy","wheat"] },
      { id: "pe-grilled-teriyaki", name: "Grilled Teriyaki Chicken",         category: "Entrees",    sourceType: "official", allergens: ["soy","wheat","sesame"] },
      // Appetizers
      { id: "pe-spring-rolls",     name: "Vegetable Spring Rolls",           category: "Appetizers", sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pe-rangoon",          name: "Cream Cheese Rangoon",             category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── P.F. Chang's ────────────────────────────────────────────────────────────
  // Source: pfchangs.com — Allergen Information
  {
    id: "pf-changs",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/P._F._Chang%27s_%2851787277577%29.jpg/640px-P._F._Chang%27s_%2851787277577%29.jpg",
    name: "P.F. Chang's",
    cuisine: "Casual Dining · Asian",
    tags: ["asian", "chinese", "casual"],
    distance: 1.8,
    sourceType: "official",
    menuItems: [
      { id: "pfc-lettuce-wraps",   name: "Chicken Lettuce Wraps",            category: "Appetizers", sourceType: "official", allergens: ["soy","wheat","tree-nut"] },
      { id: "pfc-hot-sour-soup",   name: "Hot and Sour Soup",                category: "Soups",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pfc-egg-drop-soup",   name: "Egg Drop Soup",                    category: "Soups",      sourceType: "official", allergens: ["egg","soy"] },
      { id: "pfc-wonton-soup",     name: "Wonton Soup",                      category: "Soups",      sourceType: "official", allergens: ["wheat","egg","soy","shellfish"] },
      { id: "pfc-dumplings",       name: "Chang's Pork Dumplings",           category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "pfc-crispy-honey-ckn",name: "Crispy Honey Chicken",             category: "Entrees",    sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pfc-beef-broccoli",   name: "Beef with Broccoli",               category: "Entrees",    sourceType: "official", allergens: ["soy","wheat"] },
      { id: "pfc-kung-pao",        name: "Kung Pao Chicken",                 category: "Entrees",    sourceType: "official", allergens: ["peanut","soy","wheat"] },
      { id: "pfc-mongolian-beef",  name: "Mongolian Beef",                   category: "Entrees",    sourceType: "official", allergens: ["soy","wheat"] },
      { id: "pfc-spicy-chicken",   name: "Chang's Spicy Chicken",            category: "Entrees",    sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pfc-lo-mein",         name: "Lo Mein",                          category: "Sides",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pfc-fried-rice",      name: "Fried Rice",                       category: "Sides",      sourceType: "official", allergens: ["soy","wheat","egg"] },
      { id: "pfc-great-wall-choc", name: "Great Wall of Chocolate",          category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── Raising Cane's ──────────────────────────────────────────────────────────
  // Source: raisingcanes.com — Allergen Info
  {
    id: "raising-canes",
    name: "Raising Cane's",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Raising_Cane%27s_Chicken_Fingers_logo.svg/640px-Raising_Cane%27s_Chicken_Fingers_logo.svg.png",
    cuisine: "Fast Casual · Chicken",
    tags: ["chicken", "fast-casual"],
    distance: 0.6,
    sourceType: "official",
    menuItems: [
      { id: "canes-fingers",       name: "Chicken Fingers",                  category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "canes-box-combo",     name: "Box Combo",                        category: "Combos",     sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "canes-3-finger",      name: "3 Finger Combo",                   category: "Combos",     sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "canes-sauce",         name: "Cane's Sauce",                     category: "Sauces",     sourceType: "official", allergens: ["egg","soy"] },
      { id: "canes-fries",         name: "Crinkle Fries",                    category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "canes-coleslaw",      name: "Coleslaw",                         category: "Sides",      sourceType: "official", allergens: ["egg","dairy"] },
      { id: "canes-toast",         name: "Texas Toast",                      category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "canes-lemonade",      name: "Fresh Lemonade",                   category: "Beverages",  sourceType: "official", allergens: [] },
    ],
  },

  // ─── Sonic Drive-In ──────────────────────────────────────────────────────────
  // Source: sonicdrivein.com — Allergen Information
  {
    id: "sonic",
    name: "Sonic Drive-In",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/SONIC_New_Logo_2020.svg/640px-SONIC_New_Logo_2020.svg.png",
    cuisine: "Fast Food · American",
    tags: ["fast-food", "american", "drive-in"],
    distance: 1.0,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Pick a drink",       category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "sonic-cheeseburger",  name: "Classic Cheeseburger",             category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "sonic-super-sonic",   name: "SuperSONIC Double Cheeseburger",   category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "sonic-footlong",      name: "Footlong Chili Cheese Coney",      category: "Entrée",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "sonic-corn-dog",      name: "Corn Dog",                         category: "Entrée",   sourceType: "official", allergens: ["corn","wheat","egg","soy"] },
      { id: "sonic-ckn-sandwich",  name: "Chicken Sandwich",                 category: "Entrée",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "sonic-mozz-sticks",   name: "Mozzarella Sticks",                category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "sonic-onion-rings",   name: "Onion Rings",                      category: "Side",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "sonic-tater-tots",    name: "Tater Tots",                       category: "Side",      sourceType: "official", allergens: ["soy"] },
      { id: "sonic-rt44",          name: "Route 44 Drink",                   category: "Drink",     sourceType: "official", allergens: [] },
      { id: "sonic-slush",         name: "Ocean Water Slush",                category: "Drink",     sourceType: "official", allergens: [] },
      { id: "sonic-shake",         name: "Hand-Made Milk Shake",             category: "Drink",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "sonic-blast",         name: "SONIC Blast",                      category: "Drink",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "sonic-shake-oreo",    name: "Oreo Shake",                       category: "Drink",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "sonic-chili-dog",     name: "Footlong Chili Cheese Dog",        category: "Entrée",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "sonic-tots-med",      name: "Medium Tater Tots",                category: "Side",      sourceType: "official", allergens: ["soy"] },
      { id: "sonic-tots-lg",       name: "Large Tater Tots",                 category: "Side",      sourceType: "official", allergens: ["soy"] },
      { id: "sonic-fries",         name: "Medium French Fries",              category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sonic-pretzel-dog",   name: "Pretzel Twist Hot Dog",            category: "Entrée",   sourceType: "official", allergens: ["wheat","dairy","soy","egg","sesame"] },
    ],
  },

  // ─── Arby's ──────────────────────────────────────────────────────────────────
  // Source: arbys.com — Allergen & Nutrition Info
  {
    id: "arbys",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Arby%27s_logo.svg/640px-Arby%27s_logo.svg.png",
    name: "Arby's",
    cuisine: "Fast Food · Roast Beef & Sandwiches",
    tags: ["fast-food", "sandwiches", "roast-beef"],
    distance: 1.4,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Add a shake",        category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "arbs-classic-roast",  name: "Classic Roast Beef",               category: "Entrée", sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "arbs-double-roast",   name: "Double Roast Beef",                category: "Entrée", sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "arbs-beef-cheddar",   name: "Beef 'n Cheddar",                  category: "Entrée", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "arbs-french-dip",     name: "French Dip",                       category: "Entrée", sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "arbs-crispy-ckn",     name: "Classic Crispy Chicken Sandwich",  category: "Entrée",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "arbs-gyro",           name: "Traditional Greek Gyro",           category: "Entrée", sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "arbs-curly-fries",    name: "Curly Fries",                      category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "arbs-loaded-fries",   name: "Loaded Curly Fries",               category: "Side",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "arbs-mozz-sticks",    name: "Mozzarella Sticks",                category: "Side",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "arbs-jamocha-shake",  name: "Jamocha Shake",                    category: "Drink",   sourceType: "official", allergens: ["dairy","wheat","soy"] },
    ],
  },

  // ─── Whataburger ─────────────────────────────────────────────────────────────
  // Source: whataburger.com — Allergen Listing
  {
    id: "whataburger",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Whataburger_logo.svg/640px-Whataburger_logo.svg.png",
    name: "Whataburger",
    cuisine: "Fast Food · Burgers",
    tags: ["fast-food", "burgers", "texas"],
    distance: 0.5,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "wb-whataburger",      name: "Whataburger",                      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "wb-double",           name: "Double Meat Whataburger",          category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "wb-avocado-bacon",    name: "Avocado Bacon Burger",             category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "wb-breakfast-burger", name: "Breakfast Burger",                 category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "wb-honey-bbq-ckn",    name: "Honey BBQ Chicken Strip Sandwich", category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "wb-pancakes",         name: "Pancakes",                         category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "wb-taquito",          name: "Taquito with Cheese",              category: "Breakfast",  sourceType: "official", allergens: ["corn","wheat","dairy","egg","soy"] },
      { id: "wb-fries",            name: "French Fries",                     category: "Side",      sourceType: "official", allergens: ["soy"] },
      { id: "wb-onion-rings",      name: "Onion Rings",                      category: "Side",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "wb-shake",            name: "Milkshake",                        category: "Desserts",   sourceType: "official", allergens: ["dairy","soy"] },
    ],
  },

  // ─── Dairy Queen ─────────────────────────────────────────────────────────────
  // Source: dairyqueen.com — Allergen Info
  {
    id: "dairy-queen",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Dairy_Queen_logo.svg/640px-Dairy_Queen_logo.svg.png",
    name: "Dairy Queen",
    cuisine: "Fast Food · Burgers & Ice Cream",
    tags: ["fast-food", "ice-cream", "burgers"],
    distance: 1.2,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Burgers",  required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a side",        category: "Sides",    required: false, maxSelect: 1 },
        { label: "Add a Blizzard",     category: "Blizzard", required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Burgers
      { id: "dq-original-burger",  name: "Original DQ Burger",               category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "dq-double",           name: "1/3 lb Double with Cheese",        category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "dq-stackburger",      name: "FlameThrower GrillBurger",         category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "dq-mushroom-swiss",   name: "Mushroom Swiss GrillBurger",       category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      // Chicken
      { id: "dq-ckn-strip-basket", name: "Chicken Strip Basket (3 pc)",      category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "dq-ckn-sandwich",     name: "Crispy Chicken Sandwich",          category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","dairy","soy","sesame"] },
      { id: "dq-grilled-ckn",      name: "Grilled Chicken Sandwich",         category: "Chicken",    sourceType: "official", allergens: ["wheat","soy"] },
      // Fish & Hot Dogs
      { id: "dq-fish-sandwich",    name: "Wild Alaskan Fish Sandwich",       category: "Sandwiches", sourceType: "official", allergens: ["fish","wheat","egg","dairy","soy","sesame"] },
      { id: "dq-hot-dog",          name: "All-Beef Hot Dog",                 category: "Sandwiches", sourceType: "official", allergens: ["wheat","soy"] },
      // Sides
      { id: "dq-fries",            name: "French Fries",                     category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "dq-cheese-curds",     name: "Cheese Curds",                     category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "dq-onion-rings",      name: "Onion Rings",                      category: "Sides",      sourceType: "official", allergens: ["wheat","soy","dairy"] },
      // Blizzards
      { id: "dq-blizzard",         name: "Oreo Cookie Blizzard",             category: "Blizzard",   sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "dq-blizzard-reeses",  name: "Reese's Peanut Butter Cup Blizzard",category: "Blizzard",  sourceType: "official", allergens: ["dairy","peanut","soy"] },
      { id: "dq-blizzard-mm",      name: "M&M Chocolate Candy Blizzard",     category: "Blizzard",   sourceType: "official", allergens: ["dairy","peanut","wheat","soy"] },
      { id: "dq-blizzard-snickers",name: "Snickers Blizzard",                category: "Blizzard",   sourceType: "official", allergens: ["dairy","peanut","wheat","soy","egg"] },
      // Soft Serve & Shakes
      { id: "dq-cone",             name: "Vanilla Soft Serve Cone",          category: "Desserts",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "dq-sundae",           name: "Hot Fudge Sundae",                 category: "Desserts",   sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "dq-banana-split",     name: "Banana Split",                     category: "Desserts",   sourceType: "official", allergens: ["dairy","tree-nut","soy"] },
      { id: "dq-royal-shake",      name: "Royal Shake",                      category: "Desserts",   sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "dq-misty-slush",      name: "Misty Slush",                      category: "Beverages",  sourceType: "official", allergens: [] },
    ],
  },

  // ─── Pizza Hut ───────────────────────────────────────────────────────────────
  // Source: pizzahut.com — Allergen Information
  {
    id: "pizza-hut",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Pizza_Hut_2025.svg/640px-Pizza_Hut_2025.svg.png",
    name: "Pizza Hut",
    cuisine: "Fast Casual · Pizza",
    tags: ["pizza", "fast-casual"],
    distance: 1.1,
    sourceType: "official",
    menuItems: [
      { id: "ph-orig-pan-cheese",  name: "Original Pan Cheese Pizza",        category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-thin-crispy",      name: "Thin N' Crispy Cheese Pizza",      category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-pepperoni",        name: "Pepperoni Pizza",                  category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-bbq-chicken",      name: "BBQ Chicken Pizza",                category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-stuffed-crust",    name: "Stuffed Crust Pizza",              category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-veggie",           name: "Veggie Lover's Pizza",             category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "ph-breadsticks",      name: "Breadsticks",                      category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-cinnabon-dessert", name: "Cinnabon Dessert Pizza",           category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","soy","egg","tree-nut"] },
      { id: "ph-cinnabon-mini",    name: "Cinnabon Mini Rolls",              category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "ph-wings",            name: "Bone-In Wings",                    category: "Wings",      sourceType: "official", allergens: ["soy","dairy"] },
    ],
  },

  // ─── Papa John's ─────────────────────────────────────────────────────────────
  // Source: papajohns.com — Allergen Menu
  {
    id: "papa-johns",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Papa_Johns_New_HQ_in_Atlanta%2C_Georgia.jpg/640px-Papa_Johns_New_HQ_in_Atlanta%2C_Georgia.jpg",
    name: "Papa John's",
    cuisine: "Fast Casual · Pizza",
    tags: ["pizza", "fast-casual"],
    distance: 1.3,
    sourceType: "official",
    menuItems: [
      { id: "pj-orig-cheese",      name: "Original Cheese Pizza",            category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pj-pepperoni",        name: "Pepperoni Pizza",                  category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pj-bbq-chicken",      name: "BBQ Chicken Bacon Pizza",          category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pj-works",            name: "The Works Pizza",                  category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pj-garlic-sauce",     name: "Special Garlic Dipping Sauce",     category: "Sauces",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "pj-cheesy-bread",     name: "Cheesy Breadsticks",               category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pj-garlic-knots",     name: "Garlic Parmesan Breadsticks",      category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "pj-choc-chip-cookie", name: "Chocolate Chip Cookie",            category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "pj-wings",            name: "Crispy Chicken Wings",             category: "Wings",      sourceType: "official", allergens: ["soy","dairy"] },
    ],
  },

  // ─── Qdoba Mexican Eats ───────────────────────────────────────────────────────
  // Source: qdoba.com — Allergen Information
  {
    id: "qdoba",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Qdoba_Mexican_Eats_in_Gillette%2C_Wyoming.jpg/640px-Qdoba_Mexican_Eats_in_Gillette%2C_Wyoming.jpg",
    name: "Qdoba Mexican Eats",
    cuisine: "Fast Casual · Mexican",
    tags: ["mexican", "fast-casual", "burritos"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your base",     category: "Bases",        required: true,  maxSelect: 1  },
        { label: "Choose your protein",  category: "Proteins",     required: true,  maxSelect: 99 },
        { label: "Add rice & beans",     category: "Rice & Beans", required: false, maxSelect: 99 },
        { label: "Add a salsa",          category: "Salsas",       required: false, maxSelect: 99 },
        { label: "Add toppings",         category: "Toppings",     required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Bases — choose your format
      { id: "qdb-flour-burrito",   name: "Flour Tortilla Burrito",           category: "Bases",        sourceType: "official", allergens: ["wheat","soy"] },
      { id: "qdb-burrito-bowl",    name: "Burrito Bowl",                     category: "Bases",        sourceType: "official", allergens: [] },
      { id: "qdb-corn-taco",       name: "Corn Tortilla Tacos",              category: "Bases",        sourceType: "official", allergens: ["corn"] },
      { id: "qdb-nachos",          name: "Nachos",                           category: "Bases",        sourceType: "official", allergens: ["corn"] },
      { id: "qdb-quesadilla",      name: "Cheese Quesadilla",                category: "Bases",        sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Proteins
      { id: "qdb-p-chicken",       name: "Grilled Chicken",                  category: "Proteins",     sourceType: "official", allergens: [] },
      { id: "qdb-p-steak",         name: "Carne Asada Steak",                category: "Proteins",     sourceType: "official", allergens: [] },
      { id: "qdb-p-pork",          name: "Pulled Pork Carnitas",             category: "Proteins",     sourceType: "official", allergens: [] },
      { id: "qdb-p-beef",          name: "Ground Beef",                      category: "Proteins",     sourceType: "official", allergens: [] },
      { id: "qdb-p-tinga",         name: "Chicken Tinga",                    category: "Proteins",     sourceType: "official", allergens: ["soy"] },
      { id: "qdb-p-impossible",    name: "Impossible Fajita Veggies",        category: "Proteins",     sourceType: "official", allergens: ["soy"] },
      // Rice & Beans
      { id: "qdb-rice-white",      name: "Cilantro-Lime White Rice",         category: "Rice & Beans", sourceType: "official", allergens: [] },
      { id: "qdb-rice-brown",      name: "Cilantro-Lime Brown Rice",         category: "Rice & Beans", sourceType: "official", allergens: [] },
      { id: "qdb-beans-black",     name: "Black Beans",                      category: "Rice & Beans", sourceType: "official", allergens: [] },
      { id: "qdb-beans-pinto",     name: "Pinto Beans",                      category: "Rice & Beans", sourceType: "official", allergens: [] },
      // Salsas
      { id: "qdb-salsa-fresh",     name: "Fresh Salsa",                      category: "Salsas",       sourceType: "official", allergens: [] },
      { id: "qdb-salsa-verde",     name: "Tomatillo Verde Salsa",            category: "Salsas",       sourceType: "official", allergens: [] },
      { id: "qdb-salsa-corn",      name: "Corn Salsa",                       category: "Salsas",       sourceType: "official", allergens: ["corn"] },
      { id: "qdb-queso",           name: "3-Cheese Queso",                   category: "Salsas",       sourceType: "official", allergens: ["dairy","soy"] },
      // Toppings
      { id: "qdb-sour-cream",      name: "Sour Cream",                       category: "Toppings",     sourceType: "official", allergens: ["dairy"] },
      { id: "qdb-guac",            name: "Guacamole",                        category: "Toppings",     sourceType: "official", allergens: [] },
      { id: "qdb-cheese-blend",    name: "3-Cheese Blend",                   category: "Toppings",     sourceType: "official", allergens: ["dairy"] },
      { id: "qdb-fajita-veg",      name: "Fajita Vegetables",                category: "Toppings",     sourceType: "official", allergens: [] },
      { id: "qdb-lettuce",         name: "Shredded Romaine Lettuce",         category: "Toppings",     sourceType: "official", allergens: [] },
      { id: "qdb-pico",            name: "Pico de Gallo",                    category: "Toppings",     sourceType: "official", allergens: [] },
      // Sides
      { id: "qdb-chips",           name: "Tortilla Chips",                   category: "Sides",        sourceType: "official", allergens: ["corn"] },
    ],
  },

  // ─── TGI Fridays ─────────────────────────────────────────────────────────────
  // Source: tgifridays.com — Allergen Menu
  {
    id: "tgi-fridays",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tgi_fridays_logo13.svg/640px-Tgi_fridays_logo13.svg.png",
    name: "TGI Fridays",
    cuisine: "Casual Dining · American",
    tags: ["casual", "american", "bar"],
    distance: 1.6,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Start with an appetizer", category: "Appetizers", required: false, maxSelect: 1 },
        { label: "Choose your entrée",      categories: ["Chicken", "Ribs", "Seafood", "Burgers", "Pasta"], required: true, maxSelect: 1, category: "Chicken" },
        { label: "Finish with dessert",     category: "Desserts",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Appetizers
      { id: "tgif-potato-skins",    name: "Loaded Potato Skins",                   category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "tgif-mozz-sticks",     name: "Mozzarella Sticks",                     category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "tgif-spinach-dip",     name: "Spinach & Artichoke Dip",               category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "tgif-boneless-wings",  name: "Boneless Wings",                        category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "tgif-shrimp",          name: "Crispy Fried Shrimp",                   category: "Appetizers", sourceType: "official", allergens: ["shellfish","wheat","egg","soy","dairy"] },
      // Chicken
      { id: "tgif-sizzling-ckn",    name: "Sizzling Chicken & Cheese",             category: "Chicken",    sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "tgif-jack-daniels",    name: "Jack Daniel's Chicken",                 category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "tgif-ckn-fingers",     name: "Chicken Fingers",                       category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "tgif-bbq-ckn",         name: "BBQ Chicken Flatbread",                 category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Ribs & Steak
      { id: "tgif-ribs",            name: "Tennessee Whiskey-Glazed Baby Back Ribs",category: "Ribs",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "tgif-ribs-half",       name: "Half-Rack Baby Back Ribs",              category: "Ribs",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "tgif-sirloin",         name: "6 oz Sirloin Steak",                    category: "Ribs",      sourceType: "official", allergens: ["soy"] },
      // Seafood
      { id: "tgif-salmon",          name: "Dragon Glaze Salmon",                   category: "Seafood",    sourceType: "official", allergens: ["fish","soy","wheat","sesame"] },
      { id: "tgif-shrimp-entree",   name: "Sizzling Shrimp",                       category: "Seafood",    sourceType: "official", allergens: ["shellfish","wheat","dairy","soy"] },
      // Burgers
      { id: "tgif-burger",          name: "Classic Cheeseburger",                  category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "tgif-bacon-burger",    name: "Bacon Whiskey Burger",                  category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "tgif-beyond-burger",   name: "Beyond Burger",                         category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      // Pasta
      { id: "tgif-pasta-chicken",   name: "Cajun Shrimp & Chicken Pasta",          category: "Pasta",      sourceType: "official", allergens: ["shellfish","wheat","dairy","egg","soy"] },
      { id: "tgif-mac-cheese",      name: "Three Cheese Mac & Cheese",             category: "Pasta",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      // Sides
      { id: "tgif-fries",           name: "Seasoned Fries",                        category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "tgif-coleslaw",        name: "Coleslaw",                              category: "Sides",      sourceType: "official", allergens: ["egg"] },
      { id: "tgif-broccoli",        name: "Steamed Broccoli",                      category: "Sides",      sourceType: "official", allergens: [] },
      // Desserts
      { id: "tgif-brownie",         name: "Brownie Obsession",                     category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "tgif-vanilla-bean",    name: "Vanilla Bean Cheesecake",               category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "tgif-lava-cake",       name: "Chocolate Lava Cake",                   category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── Red Robin ───────────────────────────────────────────────────────────────
  // Source: redrobin.com — Allergen Information
  {
    id: "red-robin",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Red_Robin_Restaurant_Exterior_2015.jpg/640px-Red_Robin_Restaurant_Exterior_2015.jpg",
    name: "Red Robin",
    cuisine: "Casual Dining · Burgers",
    tags: ["burgers", "casual", "american"],
    distance: 1.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Pick your starter",   category: "Appetizers", required: false, maxSelect: 1 },
        { label: "Choose your burger",  categories: ["Burgers", "Chicken", "Sandwiches"], required: true, maxSelect: 1, category: "Burgers" },
        { label: "Pick a side",         category: "Sides",      required: false, maxSelect: 1 },
        { label: "Add dessert",         category: "Desserts",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Appetizers
      { id: "rr-towering-rings",    name: "Towering Onion Rings",             category: "Appetizers", sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "rr-pretzel-bites",     name: "Salted Pretzel Bites",             category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "rr-nacho-bites",       name: "Nacho Bites",                      category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Burgers
      { id: "rr-gourmet-burger",    name: "Gourmet Cheeseburger",             category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "rr-whiskey-bbq",       name: "Whiskey River BBQ Burger",         category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "rr-burnin-love",       name: "Burnin' Love Burger",              category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "rr-royal-red-robin",   name: "Royal Red Robin Burger",           category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "rr-banzai-burger",     name: "Banzai Burger",                    category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy","fish"] },
      { id: "rr-mushroom-swiss",    name: "Mushroom & Swiss Burger",          category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "rr-impossible",        name: "Impossible Burger",                category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      // Chicken & Sandwiches
      { id: "rr-ckn-strips",        name: "Crispy Chicken Tenders",           category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "rr-ckn-sandwich",      name: "Crispy Chicken Sandwich",          category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","dairy","soy","sesame"] },
      { id: "rr-grilled-ckn",       name: "Grilled Chicken Sandwich",         category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "rr-clucks-fries",      name: "Clucks & Fries",                   category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy"] },
      // Salads
      { id: "rr-caesar",            name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "rr-house-salad",       name: "House Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      // Sides
      { id: "rr-steak-fries",       name: "Bottomless Steak Fries",           category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "rr-sweet-potato-fries",name: "Bottomless Sweet Potato Fries",    category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "rr-coleslaw",          name: "Coleslaw",                         category: "Sides",      sourceType: "official", allergens: ["egg"] },
      { id: "rr-broccoli",          name: "Steamed Broccoli",                 category: "Sides",      sourceType: "official", allergens: [] },
      // Desserts
      { id: "rr-monster-shake",     name: "Monster Milkshake",                category: "Desserts",   sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "rr-brownie-sundae",    name: "Brownie Sundae",                   category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy","tree-nut"] },
      { id: "rr-mud-pie",           name: "Mountain High Mudd Pie",           category: "Desserts",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
    ],
  },

  // ─── Cracker Barrel ──────────────────────────────────────────────────────────
  // Source: crackerbarrel.com — Allergen Menu
  {
    id: "cracker-barrel",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Cracker_Barrel_logo.svg/640px-Cracker_Barrel_logo.svg.png",
    name: "Cracker Barrel Old Country Store",
    cuisine: "Casual Dining · Southern American",
    tags: ["southern", "breakfast", "comfort-food", "casual"],
    distance: 2.2,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your main",    categories: ["Breakfast", "Dinner"],   required: true,  maxSelect: 1, category: "Dinner" },
        { label: "Pick your sides",     category: "Sides",                     required: false, maxSelect: 3 },
        { label: "Add bread",           category: "Bread",                     required: false, maxSelect: 1 },
        { label: "Add dessert",         category: "Desserts",                  required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      { id: "cb-old-timers",       name: "Old Timer's Breakfast",            category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "cb-pancakes",         name: "Buttermilk Pancakes",              category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "cb-biscuits",         name: "Buttermilk Biscuits",              category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "cb-hashbrown-cass",   name: "Hashbrown Casserole",              category: "Sides",      sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "cb-chicken-dumplin",  name: "Chicken n' Dumplins",              category: "Dinner",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "cb-meatloaf",         name: "Country Meatloaf",                 category: "Dinner",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "cb-cfs",              name: "Country Fried Chicken",            category: "Dinner",     sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "cb-mac",              name: "Macaroni n' Cheese",               category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "cb-cornbread",        name: "Corn Muffins",                     category: "Bread",      sourceType: "official", allergens: ["corn","wheat","dairy","egg"] },
      { id: "cb-choc-cake",        name: "Double Chocolate Fudge Coca-Cola Cake", category: "Desserts", sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── Jack in the Box ─────────────────────────────────────────────────────────
  // Source: jackinthebox.com — Allergen Information
  {
    id: "jack-in-the-box",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Jack_in_the_Box_2022_logo.svg/640px-Jack_in_the_Box_2022_logo.svg.png",
    name: "Jack in the Box",
    cuisine: "Fast Food · Burgers",
    tags: ["fast-food", "burgers", "tacos"],
    distance: 0.8,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Pick a drink",       category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "jitb-jumbo-jack",     name: "Jumbo Jack",                       category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "jitb-bacon-ultimate", name: "Bacon Ultimate Cheeseburger",      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "jitb-sourdough-jack", name: "Sourdough Jack",                   category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "jitb-ckn-sandwich",   name: "Crispy Chicken Sandwich",          category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "jitb-egg-rolls",      name: "Egg Rolls",                        category: "Appetizers", sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "jitb-tacos",          name: "Tacos",                            category: "Entrée",      sourceType: "official", allergens: ["corn","wheat","soy","dairy"] },
      { id: "jitb-curly-fries",    name: "Seasoned Curly Fries",             category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "jitb-mozz-sticks",    name: "Mozzarella Sticks",                category: "Side",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "jitb-shake",          name: "Oreo Cookie Ice Cream Shake",      category: "Desserts",   sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
    ],
  },

  // ─── Culver's ────────────────────────────────────────────────────────────────
  // Source: culvers.com — Allergen Guide
  {
    id: "culvers",
    name: "Culver's",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Culver%27s_headquarters.jpg/640px-Culver%27s_headquarters.jpg",
    cuisine: "Fast Casual · Burgers & Custard",
    tags: ["burgers", "custard", "fast-casual"],
    distance: 1.0,
    sourceType: "official",
    menuItems: [
      { id: "culv-butterburger",   name: "ButterBurger",                     category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "culv-double",         name: "Double ButterBurger with Cheese",  category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "culv-cheese-curds",   name: "Wisconsin Cheese Curds",           category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "culv-ckn-tenders",    name: "Chicken Tenders",                  category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "culv-fish-sandwich",  name: "North Atlantic Cod Sandwich",      category: "Fish",       sourceType: "official", allergens: ["fish","wheat","egg","dairy","soy"] },
      { id: "culv-pot-roast",      name: "Pot Roast Sandwich",               category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "culv-clam-chowder",   name: "Clam Chowder",                     category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat"] },
      { id: "culv-concrete-mixer", name: "Concrete Mixer",                   category: "Desserts",   sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "culv-turtle-sundae",  name: "Turtle Sundae",                    category: "Desserts",   sourceType: "official", allergens: ["dairy","tree-nut","soy"] },
    ],
  },

  // ─── Noodles & Company ───────────────────────────────────────────────────────
  // Source: noodles.com — Allergen Information
  {
    id: "noodles-and-company",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Noodles_and_Company_Sheboygan.jpg/640px-Noodles_and_Company_Sheboygan.jpg",
    name: "Noodles & Company",
    cuisine: "Fast Casual · Noodles",
    tags: ["noodles", "pasta", "fast-casual"],
    distance: 0.7,
    sourceType: "official",
    menuItems: [
      { id: "noco-buttered-noodle",name: "Buttered Noodles",                 category: "Noodles",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "noco-mac",            name: "Wisconsin Mac & Cheese",           category: "Noodles",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "noco-pasta-fresca",   name: "Pasta Fresca",                     category: "Noodles",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "noco-penne-rosa",     name: "Penne Rosa",                       category: "Noodles",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "noco-japan-pan",      name: "Japanese Pan Noodles",             category: "Noodles",    sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "noco-pad-thai",       name: "Pad Thai",                         category: "Noodles",    sourceType: "official", allergens: ["wheat","fish","egg","peanut","soy"] },
      { id: "noco-korean-bbq",     name: "Korean BBQ Noodles",               category: "Noodles",    sourceType: "official", allergens: ["wheat","soy","sesame","egg"] },
      { id: "noco-zucchini-pesto", name: "Zucchini Pesto with Grilled Chicken", category: "Noodles", sourceType: "official", allergens: ["wheat","tree-nut","dairy"] },
      { id: "noco-ckn-noodle-soup",name: "Chicken Noodle Soup",              category: "Soups",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
    ],
  },

  // ─── Yard House ──────────────────────────────────────────────────────────────
  // Source: yardhouse.com — Allergen Menu
  {
    id: "yard-house",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Yard_House_logo.svg/480px-Yard_House_logo.svg.png",
    name: "Yard House",
    cuisine: "Casual Dining · American & Craft Beer",
    tags: ["american", "bar", "craft-beer", "casual"],
    distance: 2.1,
    sourceType: "official",
    menuItems: [
      { id: "yh-spinach-dip",      name: "Spinach Artichoke Dip",            category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "yh-pretzel-bites",    name: "Soft Pretzel Bites",               category: "Appetizers", sourceType: "official", allergens: ["wheat","dairy","egg"] },
      { id: "yh-truffle-fries",    name: "Truffle Fries",                    category: "Sides",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "yh-ahi-poke-nachos",  name: "Ahi Poke Nachos",                  category: "Appetizers", sourceType: "official", allergens: ["fish","wheat","soy","sesame"] },
      { id: "yh-caesar",           name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "yh-cobb",             name: "Cobb Salad",                       category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "yh-bbq-ckn-pizza",    name: "BBQ Chicken Pizza",                category: "Pizza",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "yh-burger",           name: "Classic Burger",                   category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","sesame","soy"] },
      { id: "yh-ahi-tuna-sand",    name: "Ahi Tuna Sandwich",                category: "Sandwiches", sourceType: "official", allergens: ["fish","wheat","soy","sesame","egg"] },
      { id: "yh-salmon",           name: "Grilled Salmon",                   category: "Seafood",    sourceType: "official", allergens: ["fish","dairy","soy"] },
      { id: "yh-jambalaya-pasta",  name: "Jambalaya Pasta",                  category: "Pasta",      sourceType: "official", allergens: ["shellfish","wheat","soy","egg"] },
      { id: "yh-choc-cake",        name: "Chocolate Cake",                   category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "yh-cheesecake",       name: "Cheesecake",                       category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg"] },
    ],
  },
  // ─── Outback Steakhouse ──────────────────────────────────────────────────────
  {
    id: "outback",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Outback_Steakhouse.jpg/640px-Outback_Steakhouse.jpg",
    name: "Outback Steakhouse",
    cuisine: "Casual Dining · Steakhouse",
    tags: ["steakhouse", "casual"],
    distance: 1.8,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Start with an appetizer?",  category: "Appetizers", required: false, maxSelect: 1 },
        { label: "Choose your entrée",        categories: ["Steaks", "Seafood", "Chicken"], category: "Steaks", required: true,  maxSelect: 1 },
        { label: "Add a side",                category: "Sides",      required: false, maxSelect: 2 },
        { label: "Save room for dessert?",    category: "Desserts",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      { id: "ob-bloomin-onion",    name: "Bloomin\' Onion",                  category: "Appetizers", sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "ob-spinach-dip",      name: "Spinach Artichoke Dip",            category: "Appetizers", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "ob-wings",            name: "Bone-In Wings",                    category: "Appetizers", sourceType: "official", allergens: ["wheat","soy"] },
      { id: "ob-sirloin",          name: "Victoria\'s Filet Mignon",         category: "Steaks",     sourceType: "official", allergens: [] },
      { id: "ob-ribeye",           name: "Bone-In Natural Cut Ribeye",       category: "Steaks",     sourceType: "official", allergens: [] },
      { id: "ob-sirloin6",         name: "6 oz. Outback Special Sirloin",    category: "Steaks",     sourceType: "official", allergens: [] },
      { id: "ob-grilled-salmon",   name: "Grilled Salmon",                   category: "Seafood",    sourceType: "official", allergens: ["fish"] },
      { id: "ob-shrimp-skewers",   name: "Grilled Shrimp on the Barbie",     category: "Seafood",    sourceType: "official", allergens: ["shellfish"] },
      { id: "ob-chicken-tenders",  name: "Chicken Tenders",                  category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "ob-grilled-chicken",  name: "Grilled Chicken on the Barbie",    category: "Chicken",    sourceType: "official", allergens: [] },
      { id: "ob-caesar",           name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "ob-fries",            name: "Seasoned Fries",                   category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "ob-baked-potato",     name: "Baked Potato",                     category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "ob-choc-thunder",     name: "Chocolate Thunder from Down Under", category: "Desserts",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── Sweetgreen ──────────────────────────────────────────────────────────────
  {
    id: "sweetgreen",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Sweetgreen_logo.svg/640px-Sweetgreen_logo.svg.png",
    name: "Sweetgreen",
    cuisine: "Fast Casual · Salads & Bowls",
    tags: ["salads", "healthy", "fast-casual"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your bowl or salad", categories: ["Warm Bowls", "Salads"], category: "Warm Bowls", required: true,  maxSelect: 1 },
        { label: "Add a protein?",            category: "Proteins",                 required: false, maxSelect: 1 },
        { label: "Add a side?",               category: "Sides",                    required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      { id: "sg-harvest-bowl",     name: "Harvest Bowl",                     category: "Warm Bowls", sourceType: "official", allergens: ["tree-nut","dairy"] },
      { id: "sg-shroomami",        name: "Shroomami Bowl",                   category: "Warm Bowls", sourceType: "official", allergens: ["soy","sesame","wheat"] },
      { id: "sg-hot-honey-chicken",name: "Hot Honey Chicken Bowl",           category: "Warm Bowls", sourceType: "official", allergens: ["soy","wheat","dairy"] },
      { id: "sg-guacamole-greens", name: "Guacamole Greens",                 category: "Salads",     sourceType: "official", allergens: [] },
      { id: "sg-caesar",           name: "Caesar\'s Best Friend",            category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "sg-kale-caesar",      name: "Kale Caesar",                      category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat","tree-nut"] },
      { id: "sg-ripple-chips",     name: "Ripple Chips",                     category: "Sides",      sourceType: "official", allergens: [] },
      { id: "sg-roasted-chicken",  name: "Roasted Chicken",                  category: "Proteins",   sourceType: "official", allergens: [] },
      { id: "sg-crispy-rice",      name: "Crispy Rice",                      category: "Bases",      sourceType: "official", allergens: ["soy","wheat","sesame"] },
    ],
  },

  // ─── The Capital Grille ──────────────────────────────────────────────────────
  {
    id: "capital-grille",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/The_Capital_Grille_logo.svg/640px-The_Capital_Grille_logo.svg.png",
    name: "The Capital Grille",
    cuisine: "Fine Dining · Steakhouse",
    tags: ["steakhouse", "fine-dining"],
    distance: 2.5,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Start with an appetizer?",    category: "Appetizers",             required: false, maxSelect: 1 },
        { label: "Soup or salad?",              categories: ["Soups", "Salads"],    category: "Soups", required: false, maxSelect: 1 },
        { label: "Choose your entrée",          category: "Steaks",                 required: true,  maxSelect: 1 },
        { label: "Add a side",                  category: "Sides",                  required: false, maxSelect: 2 },
        { label: "Finish with dessert?",        category: "Desserts",               required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      { id: "cg-shrimp-cocktail",  name: "Chilled Shrimp Cocktail",          category: "Appetizers", sourceType: "official", allergens: ["shellfish"] },
      { id: "cg-lobster-bisque",   name: "Lobster Bisque",                   category: "Soups",      sourceType: "official", allergens: ["shellfish","dairy","wheat"] },
      { id: "cg-caesar",           name: "Classic Caesar Salad",             category: "Salads",     sourceType: "official", allergens: ["fish","egg","dairy","wheat"] },
      { id: "cg-filet",            name: "Filet Mignon 8 oz",                category: "Steaks",     sourceType: "official", allergens: [] },
      { id: "cg-bone-in-ribeye",   name: "Bone-In Ribeye 22 oz",             category: "Steaks",     sourceType: "official", allergens: [] },
      { id: "cg-kona-sirloin",     name: "Kona Crusted Sirloin",             category: "Steaks",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "cg-mashed-potatoes",  name: "Sam\'s Mashed Potatoes",           category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "cg-asparagus",        name: "Sauteed Asparagus",                category: "Sides",      sourceType: "official", allergens: [] },
      { id: "cg-flourless-choc",   name: "Flourless Chocolate Espresso Cake", category: "Desserts",  sourceType: "official", allergens: ["egg","dairy"] },
      { id: "cg-coconut-pie",      name: "Coconut Cream Pie",                category: "Desserts",   sourceType: "official", allergens: ["dairy","egg","wheat","tree-nut"] },
    ],
  },
  // ─── Steak n Shake ───────────────────────────────────────────────────────────
  {
    id: "steak-n-shake",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Steak_n_Shake_logo.svg/640px-Steak_n_Shake_logo.svg.png",
    name: "Steak n Shake",
    cuisine: "Fast Casual · Burgers & Shakes",
    tags: ["burgers", "fast-casual"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Add a milkshake",    category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "sns-steakburger",     name: "Original Double Steakburger",      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "sns-patty-melt",      name: "Steakburger Patty Melt",           category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "sns-chili",           name: "Chili",                            category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sns-chili-mac",       name: "Chili Mac",                        category: "Side",      sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "sns-fries",           name: "Fries",                            category: "Side",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sns-vanilla-shake",   name: "Vanilla Milkshake",                category: "Drink",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "sns-choc-shake",      name: "Chocolate Milkshake",              category: "Drink",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
    ],
  },

  // ─── Bojangles ───────────────────────────────────────────────────────────────
  // Source: bojangles.com — Nutrition & Allergen Info
  {
    id: "bojangles",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Bojangles_logo.svg/640px-Bojangles_logo.svg.png",
    name: "Bojangles",
    cuisine: "Fast Food · Southern Chicken",
    tags: ["chicken", "fast-food"],
    distance: 0.5,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Sandwiches", required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a side",        category: "Sides",      required: false, maxSelect: 1 },
        { label: "Add a biscuit",      category: "Biscuits",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Bone-In Chicken
      { id: "boj-breast",          name: "Breast Bone-In Chicken",           category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "boj-leg",             name: "Leg Bone-In Chicken",              category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "boj-wing",            name: "Wing Bone-In Chicken",             category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "boj-thigh",           name: "Thigh Bone-In Chicken",            category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","dairy"] },
      // Tenders
      { id: "boj-tender-3",        name: "Chicken Tenders 3 pc",             category: "Tenders",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "boj-tender-5",        name: "Chicken Tenders 5 pc",             category: "Tenders",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      // Sandwiches
      { id: "boj-cajun-fillet",    name: "Cajun Filet Sandwich",             category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","soy","egg","sesame"] },
      { id: "boj-spicy-fillet",    name: "Spicy Bo's Chicken Sandwich",      category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","soy","egg","sesame"] },
      { id: "boj-grilled-sand",    name: "Grilled Chicken Sandwich",         category: "Sandwiches", sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Biscuits (all-day)
      { id: "boj-biscuit",         name: "Plain Biscuit",                    category: "Biscuits",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "boj-butter-biscuit",  name: "Buttery Biscuit",                  category: "Biscuits",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "boj-cajun-bisc",      name: "Cajun Filet Biscuit",              category: "Biscuits",   sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      // Breakfast
      { id: "boj-egg-cheese-bisc", name: "Egg and Cheese Biscuit",           category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "boj-sausage-bisc",    name: "Sausage and Egg Biscuit",          category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "boj-country-ham",     name: "Country Ham Biscuit",              category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Sides
      { id: "boj-dirty-rice",      name: "Dirty Rice",                       category: "Sides",      sourceType: "official", allergens: ["soy","wheat"] },
      { id: "boj-mac",             name: "Macaroni n Cheese",                category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "boj-seasoned-fries",  name: "Seasoned Fries",                   category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "boj-green-beans",     name: "Seasoned Green Beans",             category: "Sides",      sourceType: "official", allergens: [] },
      { id: "boj-coleslaw",        name: "Coleslaw",                         category: "Sides",      sourceType: "official", allergens: ["egg"] },
    ],
  },

  // ─── Carl's Jr. ──────────────────────────────────────────────────────────────
  // Source: carlsjr.com — Allergen Information
  {
    id: "carls-jr",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Carl%27s_Jr._logo.svg/640px-Carl%27s_Jr._logo.svg.png",
    name: "Carl's Jr.",
    cuisine: "Fast Food · Burgers",
    tags: ["burgers", "fast-food"],
    distance: 0.8,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Burgers",  required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a side",        category: "Sides",    required: false, maxSelect: 1 },
        { label: "Add a shake",        category: "Shakes",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Burgers
      { id: "cj-famous-star",      name: "Famous Star with Cheese",          category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "cj-super-star",       name: "Super Star with Cheese",           category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "cj-western-bacon",    name: "Western Bacon Cheeseburger",       category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "cj-thick-burger",     name: "1/3 lb Original Thickburger",      category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "cj-mushroom-swiss",   name: "Mushroom & Swiss Thickburger",     category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "cj-beyond-famous",    name: "Beyond Famous Star",               category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      // Chicken
      { id: "cj-spicy-chicken",    name: "Spicy Chicken Sandwich",           category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy","dairy","sesame"] },
      { id: "cj-hand-breaded",     name: "Hand-Breaded Chicken Tenders",     category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "cj-charbroiled-ckn",  name: "Charbroiled Chicken Sandwich",     category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Breakfast
      { id: "cj-bfast-burger",     name: "Breakfast Burger",                 category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "cj-french-toast-dipper",name: "French Toast Dips",              category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      // Sides
      { id: "cj-crisscut-fries",   name: "Crisscut Fries",                   category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "cj-onion-rings",      name: "Onion Rings",                      category: "Sides",      sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "cj-zucchini",         name: "Fried Zucchini",                   category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      // Shakes
      { id: "cj-shake-van",        name: "Vanilla Hand-Scooped Shake",       category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cj-shake-choc",       name: "Chocolate Hand-Scooped Shake",     category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cj-shake-straw",      name: "Strawberry Hand-Scooped Shake",    category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
    ],
  },

  // ─── MOD Pizza ───────────────────────────────────────────────────────────────
  // Source: modpizza.com — Allergen Information
  {
    id: "mod-pizza",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/MOD_Pizza_logo.png/640px-MOD_Pizza_logo.png",
    name: "MOD Pizza",
    cuisine: "Fast Casual · Pizza",
    tags: ["pizza", "fast-casual"],
    distance: 0.8,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your crust",    category: "Crusts",    required: true,  maxSelect: 1 },
        { label: "Pick a sauce",         category: "Sauces",    required: false, maxSelect: 1 },
        { label: "Add cheese",           category: "Cheeses",   required: false, maxSelect: 99 },
        { label: "Add toppings",         category: "Toppings",  required: false, maxSelect: 99 },
      ],
    },
    menuItems: [
      // Crusts
      { id: "mod-original-crust",  name: "Original Crust",                   category: "Crusts",     sourceType: "official", allergens: ["wheat","soy"] },
      { id: "mod-thick-crust",     name: "Mega Dough Crust",                 category: "Crusts",     sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "mod-gf-crust",        name: "Gluten-Free Crust",                category: "Crusts",     sourceType: "official", allergens: ["egg","dairy","soy"] },
      { id: "mod-cauliflower",     name: "Cauliflower Crust",                category: "Crusts",     sourceType: "official", allergens: ["egg","dairy","soy"] },
      // Sauces
      { id: "mod-red-sauce",       name: "Red Sauce",                        category: "Sauces",     sourceType: "official", allergens: [] },
      { id: "mod-white-sauce",     name: "White Cream Sauce",                category: "Sauces",     sourceType: "official", allergens: ["dairy","soy"] },
      { id: "mod-bbq-sauce",       name: "BBQ Sauce",                        category: "Sauces",     sourceType: "official", allergens: ["soy"] },
      { id: "mod-pesto",           name: "Pesto Sauce",                      category: "Sauces",     sourceType: "official", allergens: ["tree-nut","dairy"] },
      // Cheeses
      { id: "mod-mozzarella",      name: "Mozzarella",                       category: "Cheeses",    sourceType: "official", allergens: ["dairy"] },
      { id: "mod-cheddar",         name: "Cheddar",                          category: "Cheeses",    sourceType: "official", allergens: ["dairy"] },
      { id: "mod-feta",            name: "Feta",                             category: "Cheeses",    sourceType: "official", allergens: ["dairy"] },
      // Toppings
      { id: "mod-pepperoni",       name: "Pepperoni",                        category: "Toppings",   sourceType: "official", allergens: [] },
      { id: "mod-sausage",         name: "Italian Sausage",                  category: "Toppings",   sourceType: "official", allergens: ["soy","wheat"] },
      { id: "mod-bacon",           name: "Bacon",                            category: "Toppings",   sourceType: "official", allergens: [] },
      { id: "mod-mushroom",        name: "Mushrooms",                        category: "Toppings",   sourceType: "official", allergens: [] },
      { id: "mod-bell-pepper",     name: "Red Peppers",                      category: "Toppings",   sourceType: "official", allergens: [] },
      { id: "mod-olives",          name: "Black Olives",                     category: "Toppings",   sourceType: "official", allergens: [] },
      { id: "mod-arugula",         name: "Arugula",                          category: "Toppings",   sourceType: "official", allergens: [] },
      // Signature Pies
      { id: "mod-white-widow",     name: "White Widow Pizza (signature)",    category: "Signature",  sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "mod-mad-dog",         name: "Mad Dog Pizza (signature)",        category: "Signature",  sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Salads
      { id: "mod-salad-chop",      name: "Chopped Salad",                    category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      { id: "mod-salad-caesar",    name: "Caesar Salad",                     category: "Salads",     sourceType: "official", allergens: ["dairy","egg","fish","wheat"] },
    ],
  },

  // ─── Smashburger ─────────────────────────────────────────────────────────────
  // Source: smashburger.com — Allergen Information
  {
    id: "smashburger",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Smashburger_logo.svg/640px-Smashburger_logo.svg.png",
    name: "Smashburger",
    cuisine: "Fast Casual · Burgers",
    tags: ["burgers", "fast-casual"],
    distance: 0.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Burgers",  required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a side",        category: "Sides",    required: false, maxSelect: 1 },
        { label: "Add a shake",        category: "Shakes",   required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Burgers
      { id: "smash-classic",       name: "Classic Smash Burger",             category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "smash-truffle-mush",  name: "Truffle Mushroom Swiss",           category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "smash-bbq-bacon",     name: "BBQ Bacon Smash Burger",           category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "smash-avocado-club",  name: "Avocado Club Smash Burger",        category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "smash-spicy-jalapeno",name: "Spicy Jalapeño Burger",            category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "smash-double-smash",  name: "Double Smash Burger",              category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Chicken
      { id: "smash-chicken",       name: "Crispy Fried Chicken Sandwich",    category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","dairy","soy","sesame"] },
      { id: "smash-grilled-ckn",   name: "Grilled Chicken Sandwich",         category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Sides
      { id: "smash-smash-fries",   name: "Smash Fries",                      category: "Sides",      sourceType: "official", allergens: ["soy","wheat"] },
      { id: "smash-sweet-fries",   name: "Sweet Potato Fries",               category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "smash-haystack",      name: "Haystack Onions",                  category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "smash-veggie-frites", name: "Veggie Frites",                    category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      // Shakes
      { id: "smash-shake-oreo",    name: "Oreo Milkshake",                   category: "Shakes",     sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "smash-shake-van",     name: "Vanilla Milkshake",                category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "smash-shake-choc",    name: "Chocolate Milkshake",              category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "smash-shake-straw",   name: "Strawberry Milkshake",             category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
    ],
  },

  // ─── Zaxby's ─────────────────────────────────────────────────────────────────
  {
    id: "zaxbys",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Zaxby%27s_logo.svg/640px-Zaxby%27s_logo.svg.png",
    name: "Zaxby's",
    cuisine: "Fast Casual · Chicken",
    tags: ["chicken", "fast-casual"],
    distance: 0.9,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 2  },
      ],
    },
    menuItems: [
      { id: "zax-boneless",        name: "Boneless Wings Basket",            category: "Entrée",      sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "zax-tenders",         name: "Chicken Fingerz Basket",           category: "Entrée",      sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "zax-sandwich",        name: "Signature Sandwich",               category: "Entrée", sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "zax-house-zalad",     name: "House Zalad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "zax-texas-toast",     name: "Texas Toast",                      category: "Side",      sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      { id: "zax-crinkle-fries",   name: "Crinkle Fries",                    category: "Side",      sourceType: "official", allergens: ["soy","wheat"] },
    ],
  },

  // ─── Habit Burger Grill ──────────────────────────────────────────────────────
  // Source: habitburger.com — Allergen Information
  {
    id: "habit-burger",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/The_Habit_Burger_Grill_logo.svg/640px-The_Habit_Burger_Grill_logo.svg.png",
    name: "The Habit Burger Grill",
    cuisine: "Fast Casual · Burgers",
    tags: ["burgers", "fast-casual"],
    distance: 0.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Burgers",   required: true,  maxSelect: 1, showAsCombo: true },
        { label: "Pick a side",        category: "Sides",     required: false, maxSelect: 1 },
        { label: "Add a shake",        category: "Shakes",    required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Burgers
      { id: "hab-charburger",      name: "Charburger",                       category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "hab-double",          name: "Double Charburger",                category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "hab-triple",          name: "Triple Charburger",                category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "hab-charburger-sw",   name: "Charburger with Bacon & Cheese",   category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "hab-bbq-bacon",       name: "BBQ Bacon Charburger",             category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "hab-santa-barbara",   name: "Santa Barbara Charburger",         category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame","tree-nut"] },
      // Chicken
      { id: "hab-chicken-sand",    name: "Crispy Chicken Sandwich",          category: "Chicken",    sourceType: "official", allergens: ["wheat","egg","dairy","soy","sesame"] },
      { id: "hab-grilled-ckn",     name: "Grilled Chicken Sandwich",         category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "hab-ckn-salad",       name: "Chargrilled Chicken Salad",        category: "Salads",     sourceType: "official", allergens: ["dairy","egg","fish","wheat"] },
      // Fish
      { id: "hab-ahi-tuna",        name: "Ahi Tuna Sandwich",                category: "Sandwiches", sourceType: "official", allergens: ["fish","wheat","soy","sesame","egg"] },
      // Sides
      { id: "hab-fries",           name: "French Fries",                     category: "Sides",      sourceType: "official", allergens: ["soy","wheat"] },
      { id: "hab-tempura-gv",      name: "Tempura Green Beans",              category: "Sides",      sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "hab-onion-rings",     name: "Onion Rings",                      category: "Sides",      sourceType: "official", allergens: ["wheat","egg","dairy","soy"] },
      { id: "hab-side-salad",      name: "Side Salad",                       category: "Sides",      sourceType: "official", allergens: ["dairy","egg"] },
      // Shakes
      { id: "hab-shake-van",       name: "Vanilla Shake",                    category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "hab-shake-choc",      name: "Chocolate Shake",                  category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "hab-shake-straw",     name: "Strawberry Shake",                 category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
    ],
  },

  // ─── Pei Wei ─────────────────────────────────────────────────────────────────
  {
    id: "pei-wei",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Pei_Wei_logo.svg/640px-Pei_Wei_logo.svg.png",
    name: "Pei Wei",
    cuisine: "Fast Casual · Asian",
    tags: ["asian", "fast-casual"],
    distance: 1.2,
    sourceType: "official",
    menuItems: [
      { id: "pw-pad-thai",         name: "Pad Thai",                         category: "Noodles",    sourceType: "official", allergens: ["peanut","egg","fish","wheat","soy"] },
      { id: "pw-orange-chicken",   name: "Orange Chicken",                   category: "Wok",        sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pw-mongolian-beef",   name: "Mongolian Beef",                   category: "Wok",        sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "pw-kung-pao-chicken", name: "Kung Pao Chicken",                 category: "Wok",        sourceType: "official", allergens: ["peanut","wheat","soy","sesame","egg"] },
      { id: "pw-spring-rolls",     name: "Chicken Spring Rolls",             category: "Appetizers", sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "pw-fried-rice",       name: "Fried Rice",                       category: "Rice",       sourceType: "official", allergens: ["soy","wheat","egg"] },
      { id: "pw-edamame",          name: "Edamame",                          category: "Sides",      sourceType: "official", allergens: ["soy"] },
    ],
  },

  // ─── Freddy's Frozen Custard ─────────────────────────────────────────────────
  {
    id: "freddys",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Freddy%27s_Frozen_Custard_logo.svg/640px-Freddy%27s_Frozen_Custard_logo.svg.png",
    name: "Freddy's Frozen Custard & Steakburgers",
    cuisine: "Fast Casual · Burgers & Custard",
    tags: ["burgers", "fast-casual"],
    distance: 1.0,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  category: "Entrée", required: true,  maxSelect: 1,  showAsCombo: true },
        { label: "Pick a side",        category: "Side",   required: false, maxSelect: 1  },
        { label: "Add custard",        category: "Drink",  required: false, maxSelect: 1  },
      ],
    },
    menuItems: [
      { id: "fred-original",       name: "Original Double Steakburger",      category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "fred-patty-melt",     name: "Steakburger Patty Melt",           category: "Entrée",    sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "fred-chicago-dog",    name: "Chicago Dog",                      category: "Entrée",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "fred-fries",          name: "Crinkle Cut Fries",                category: "Side",      sourceType: "official", allergens: ["soy","wheat"] },
      { id: "fred-cheese-curds",   name: "Wisconsin Cheese Curds",           category: "Side",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "fred-concrete",       name: "Concrete Custard Blend",           category: "Drink",    sourceType: "official", allergens: ["dairy","egg","wheat"] },
    ],
  },

  // ─── Portillo's ──────────────────────────────────────────────────────────────
  // Source: portillos.com — Allergen Information
  {
    id: "portillos",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Portillo%27s_logo.svg/640px-Portillo%27s_logo.svg.png",
    name: "Portillo's",
    cuisine: "Fast Casual · Chicago Classics",
    tags: ["burgers", "fast-casual", "american"],
    distance: 1.1,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  categories: ["Hot Dogs","Sandwiches","Burgers"], required: true,  maxSelect: 1, showAsCombo: true, category: "Sandwiches" },
        { label: "Pick a side",        category: "Sides",     required: false, maxSelect: 1 },
        { label: "Add a shake",        category: "Shakes",    required: false, maxSelect: 1 },
      ],
    },
    menuItems: [
      // Hot Dogs (Chicago style — poppyseed bun = sesame)
      { id: "por-chicago-dog",     name: "Chicago-Style Hot Dog",            category: "Hot Dogs",   sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "por-char-dog",        name: "Char-Grilled Hot Dog",             category: "Hot Dogs",   sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "por-polish-sausage",  name: "Polish Sausage",                   category: "Hot Dogs",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "por-corn-dog",        name: "Corn Dog",                         category: "Hot Dogs",   sourceType: "official", allergens: ["corn","wheat","egg","soy"] },
      // Sandwiches
      { id: "por-italian-beef",    name: "Italian Beef Sandwich (dipped)",   category: "Sandwiches", sourceType: "official", allergens: ["wheat","soy"] },
      { id: "por-combo",           name: "Combo Beef and Sausage",           category: "Sandwiches", sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "por-Maxwell-street",  name: "Maxwell Street Polish",            category: "Sandwiches", sourceType: "official", allergens: ["wheat","soy"] },
      // Burgers
      { id: "por-burger",          name: "Single Cheeseburger",              category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "por-double-burger",   name: "Double Cheeseburger",              category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Sides
      { id: "por-fries",           name: "French Fries",                     category: "Sides",      sourceType: "official", allergens: ["soy"] },
      { id: "por-cheese-fries",    name: "Cheese Fries",                     category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "por-onion-rings",     name: "Onion Rings",                      category: "Sides",      sourceType: "official", allergens: ["wheat","egg","soy"] },
      { id: "por-garden-salad",    name: "Garden Salad",                     category: "Sides",      sourceType: "official", allergens: ["dairy","egg"] },
      // Shakes
      { id: "por-choc-cake-shake", name: "Chocolate Cake Shake",             category: "Shakes",     sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "por-vanilla-shake",   name: "Vanilla Shake",                    category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
      { id: "por-strawberry-shake",name: "Strawberry Shake",                 category: "Shakes",     sourceType: "official", allergens: ["dairy","egg","soy"] },
    ],
  },

  // ─── Golden Corral ───────────────────────────────────────────────────────────
  // Source: goldencorral.com — Allergen Information
  {
    id: "golden-corral",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Golden_Corral_logo.svg/640px-Golden_Corral_logo.svg.png",
    name: "Golden Corral",
    cuisine: "Casual Dining · Buffet",
    tags: ["american", "casual", "buffet"],
    distance: 2.0,
    sourceType: "official",
    menuItems: [
      // Entrées
      { id: "gc-pot-roast",        name: "Pot Roast",                        category: "Entrees",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "gc-fried-chicken",    name: "Fried Chicken",                    category: "Entrees",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "gc-grilled-chicken",  name: "Grilled Chicken Breast",           category: "Entrees",    sourceType: "official", allergens: [] },
      { id: "gc-carved-beef",      name: "Carved Roast Beef",                category: "Entrees",    sourceType: "official", allergens: ["soy"] },
      { id: "gc-pork-ribs",        name: "Bourbon Street Pork Ribs",         category: "Entrees",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "gc-meatloaf",         name: "Meatloaf",                         category: "Entrees",    sourceType: "official", allergens: ["wheat","egg","soy","dairy"] },
      { id: "gc-salmon",           name: "Grilled Salmon",                   category: "Entrees",    sourceType: "official", allergens: ["fish","soy"] },
      { id: "gc-shrimp",           name: "Fried Shrimp",                     category: "Entrees",    sourceType: "official", allergens: ["shellfish","wheat","egg","soy"] },
      // Sides
      { id: "gc-mac",              name: "Macaroni and Cheese",              category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "gc-mashed-potatoes",  name: "Mashed Potatoes",                  category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "gc-corn",             name: "Corn on the Cob",                  category: "Sides",      sourceType: "official", allergens: ["corn"] },
      { id: "gc-green-beans",      name: "Green Beans",                      category: "Sides",      sourceType: "official", allergens: [] },
      { id: "gc-mashed-sweet-pot", name: "Mashed Sweet Potatoes",            category: "Sides",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "gc-coleslaw",         name: "Coleslaw",                         category: "Sides",      sourceType: "official", allergens: ["egg"] },
      { id: "gc-black-eyed-peas",  name: "Black-Eyed Peas",                  category: "Sides",      sourceType: "official", allergens: [] },
      // Soup & Salad
      { id: "gc-chicken-noodle",   name: "Chicken Noodle Soup",              category: "Soups",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "gc-clam-chowder",     name: "New England Clam Chowder",         category: "Soups",      sourceType: "official", allergens: ["shellfish","wheat","dairy","soy"] },
      // Bread
      { id: "gc-rolls",            name: "Yeast Rolls",                      category: "Bread",      sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "gc-cornbread",        name: "Cornbread",                        category: "Bread",      sourceType: "official", allergens: ["corn","wheat","dairy","egg","soy"] },
      // Desserts
      { id: "gc-ice-cream",        name: "Soft Serve Ice Cream",             category: "Desserts",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "gc-banana-pudding",   name: "Banana Pudding",                   category: "Desserts",   sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      { id: "gc-chocolate-cake",   name: "Chocolate Cake",                   category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "gc-cotton-candy",     name: "Cotton Candy",                     category: "Desserts",   sourceType: "official", allergens: [] },
      { id: "gc-cobbler",          name: "Peach Cobbler",                    category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
    ],
  },

  // ─── El Pollo Loco ───────────────────────────────────────────────────────────
  // Source: elpolloloco.com — Allergen Information
  {
    id: "el-pollo-loco",
    imageUrl: "/api/wiki-thumb?url=https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/El_Pollo_Loco_logo.svg/640px-El_Pollo_Loco_logo.svg.png",
    name: "El Pollo Loco",
    cuisine: "Fast Casual · Mexican",
    tags: ["mexican", "chicken", "fast-casual"],
    distance: 0.7,
    sourceType: "official",
    builderConfig: {
      steps: [
        { label: "Choose your combo",  categories: ["Burritos","Bowls","Tacos","Quesadillas"], required: true,  maxSelect: 1, showAsCombo: true, category: "Burritos" },
        { label: "Pick a side",        category: "Sides",      required: false, maxSelect: 2 },
      ],
    },
    menuItems: [
      // Chicken
      { id: "epl-chicken",         name: "Fire-Grilled Chicken (1 pc)",      category: "Chicken",    sourceType: "official", allergens: [] },
      { id: "epl-chicken-2pc",     name: "Fire-Grilled Chicken (2 pc)",      category: "Chicken",    sourceType: "official", allergens: [] },
      // Burritos
      { id: "epl-burrito",         name: "Classic Chicken Burrito",          category: "Burritos",   sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "epl-bbq-burrito",     name: "BBQ Black Bean Burrito",           category: "Burritos",   sourceType: "official", allergens: ["wheat","soy"] },
      { id: "epl-avocado-burrito", name: "Avocado Lovers Burrito",           category: "Burritos",   sourceType: "official", allergens: ["wheat","dairy","soy","egg"] },
      // Bowls
      { id: "epl-bowl",            name: "Pollo Bowl (Chicken)",             category: "Bowls",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "epl-double-bowl",     name: "Double Pollo Bowl",                category: "Bowls",      sourceType: "official", allergens: ["dairy","soy"] },
      // Tacos
      { id: "epl-taco",            name: "Chicken Taco (Corn Tortilla)",     category: "Tacos",      sourceType: "official", allergens: ["corn","soy"] },
      { id: "epl-taco-flour",      name: "Chicken Taco (Flour Tortilla)",    category: "Tacos",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "epl-crispy-taco",     name: "Crispy Taco (Shredded Chicken)",   category: "Tacos",      sourceType: "official", allergens: ["corn","wheat","soy","dairy"] },
      // Quesadillas
      { id: "epl-quesadilla",      name: "Chicken Quesadilla",               category: "Quesadillas",sourceType: "official", allergens: ["wheat","dairy","soy"] },
      // Sides
      { id: "epl-rice",            name: "Spanish Rice",                     category: "Sides",      sourceType: "official", allergens: [] },
      { id: "epl-beans",           name: "Pinto Beans",                      category: "Sides",      sourceType: "official", allergens: [] },
      { id: "epl-black-beans",     name: "Black Beans",                      category: "Sides",      sourceType: "official", allergens: [] },
      { id: "epl-coleslaw",        name: "Creamy Coleslaw",                  category: "Sides",      sourceType: "official", allergens: ["egg","dairy","soy"] },
      { id: "epl-corn-cobbette",   name: "Corn Cobbette",                    category: "Sides",      sourceType: "official", allergens: ["corn","dairy"] },
      { id: "epl-chips-salsa",     name: "Chips & Salsa",                    category: "Sides",      sourceType: "official", allergens: ["corn"] },
    ],
  },
];