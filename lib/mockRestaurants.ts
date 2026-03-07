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

export const MOCK_RESTAURANTS: Restaurant[] = [

  // ─── McDonald's ─────────────────────────────────────────────────────────────
  {
    id: "mcdonalds",
    name: "McDonald's",
    cuisine: "Fast Food · Burgers",
    address: "123 Market St, San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    distance: 0.4,
    sourceType: "official",
    menuItems: [
      // Burgers
      { id: "mcd-bigmac",    name: "Big Mac",                        category: "Burgers",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-qpc",       name: "Quarter Pounder with Cheese",    category: "Burgers",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-dblqpc",    name: "Double Quarter Pounder",         category: "Burgers",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-mcdbl",     name: "McDouble",                       category: "Burgers",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-cheese",    name: "Cheeseburger",                   category: "Burgers",   sourceType: "official", allergens: ["dairy","wheat","soy","egg","sesame"] },
      { id: "mcd-burger",    name: "Hamburger",                      category: "Burgers",   sourceType: "official", allergens: ["wheat","soy","sesame"] },
      // Chicken & Fish
      { id: "mcd-fof",       name: "Filet-O-Fish",                   category: "Fish",      sourceType: "official", allergens: ["fish","dairy","wheat","soy","egg"] },
      { id: "mcd-mcchicken", name: "McChicken",                      category: "Chicken",   sourceType: "official", allergens: ["egg","wheat","soy"] },
      { id: "mcd-crispy",    name: "Crispy Chicken Sandwich",        category: "Chicken",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-spicycrispy", name: "Spicy Crispy Chicken Sandwich",category: "Chicken",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-nuggets",   name: "10 Piece Chicken McNuggets",     category: "Chicken",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-nuggets6",  name: "6 Piece Chicken McNuggets",      category: "Chicken",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      { id: "mcd-nuggets4",  name: "4 Piece Chicken McNuggets",      category: "Chicken",   sourceType: "official", allergens: ["dairy","wheat","soy","egg"] },
      // Sides
      { id: "mcd-fries",     name: "World Famous Fries",             category: "Sides",     sourceType: "official", allergens: ["dairy","wheat"] },
      { id: "mcd-hashbrown", name: "Hash Browns",                    category: "Sides",     sourceType: "official", allergens: [] },
      { id: "mcd-side-salad",name: "Side Salad",                     category: "Sides",     sourceType: "official", allergens: [] },
      { id: "mcd-applesli",  name: "Apple Slices",                   category: "Sides",     sourceType: "official", allergens: [] },
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
      { id: "mcd-applepie",  name: "Baked Apple Pie",                category: "Desserts",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "mcd-cone",      name: "Vanilla Soft Serve Cone",        category: "Desserts",  sourceType: "official", allergens: ["dairy"] },
      { id: "mcd-mcflurry",  name: "McFlurry with Oreo Cookies",     category: "Desserts",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "mcd-shake-choc",name: "Chocolate Shake",                category: "Desserts",  sourceType: "official", allergens: ["dairy"] },
      { id: "mcd-shake-van", name: "Vanilla Shake",                  category: "Desserts",  sourceType: "official", allergens: ["dairy"] },
      { id: "mcd-coffee",    name: "McCafé Hot Coffee",               category: "Beverages", sourceType: "official", allergens: [] },
      { id: "mcd-oj",        name: "Minute Maid Orange Juice",       category: "Beverages", sourceType: "official", allergens: [] },
    ],
  },

  // ─── Chipotle ───────────────────────────────────────────────────────────────
  {
    id: "chipotle",
    name: "Chipotle Mexican Grill",
    cuisine: "Fast Casual · Mexican",
    address: "456 Mission St, San Francisco, CA",
    lat: 37.7859,
    lng: -122.4009,
    distance: 0.7,
    sourceType: "official",
    menuItems: [
      // Bases
      { id: "chip-flourtort",   name: "Flour Tortilla (Burrito)",         category: "Bases",    sourceType: "official", allergens: ["wheat","soy"] },
      { id: "chip-corntort",    name: "Corn Tortilla (Tacos)",            category: "Bases",    sourceType: "official", allergens: [] },
      { id: "chip-bowl-base",   name: "Burrito Bowl Base",                category: "Bases",    sourceType: "official", allergens: [] },
      { id: "chip-rice-white",  name: "Cilantro-Lime White Rice",         category: "Bases",    sourceType: "official", allergens: [] },
      { id: "chip-rice-brown",  name: "Cilantro-Lime Brown Rice",         category: "Bases",    sourceType: "official", allergens: [] },
      { id: "chip-black",       name: "Black Beans",                      category: "Bases",    sourceType: "official", allergens: [] },
      { id: "chip-pinto",       name: "Pinto Beans",                      category: "Bases",    sourceType: "official", allergens: [] },
      // Proteins
      { id: "chip-chicken",     name: "Grilled Chicken",                  category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-steak",       name: "Carne Asada Steak",                category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-barbacoa",    name: "Barbacoa",                         category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-carnitas",    name: "Carnitas",                         category: "Proteins", sourceType: "official", allergens: [] },
      { id: "chip-sofritas",    name: "Sofritas (Tofu)",                  category: "Proteins", sourceType: "official", allergens: ["soy"] },
      // Salsas
      { id: "chip-salsa-fresh", name: "Fresh Tomato Salsa",               category: "Salsas",   sourceType: "official", allergens: [] },
      { id: "chip-salsa-roast", name: "Roasted Chili-Corn Salsa",         category: "Salsas",   sourceType: "official", allergens: [] },
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
      { id: "chip-chips",       name: "Chips & Guacamole",                category: "Sides",    sourceType: "official", allergens: [] },
      { id: "chip-chips-salsa", name: "Chips & Fresh Salsa",              category: "Sides",    sourceType: "official", allergens: [] },
      { id: "chip-quesadilla",  name: "Quesadilla (Flour Tortilla)",      category: "Entrees",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "chip-kids-quesad", name: "Kids Quesadilla",                  category: "Entrees",  sourceType: "official", allergens: ["dairy","wheat","soy"] },
    ],
  },

  // ─── Chick-fil-A ────────────────────────────────────────────────────────────
  {
    id: "chickfila",
    name: "Chick-fil-A",
    cuisine: "Fast Food · Chicken",
    address: "789 Powell St, San Francisco, CA",
    lat: 37.7851,
    lng: -122.4082,
    distance: 1.1,
    sourceType: "official",
    menuItems: [
      // Sandwiches
      { id: "cfa-sandwich",    name: "Chick-fil-A Chicken Sandwich",      category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-spicy",       name: "Spicy Chicken Sandwich",            category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-deluxe",      name: "Chicken Sandwich Deluxe",           category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-spicy-deluxe",name: "Spicy Deluxe Chicken Sandwich",     category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-grilled",     name: "Grilled Chicken Sandwich",          category: "Sandwiches", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "cfa-grilled-dlx", name: "Grilled Chicken Club Sandwich",     category: "Sandwiches", sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "cfa-wrap-cool",   name: "Grilled Cool Wrap",                 category: "Wraps",      sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-wrap-spicy",  name: "Spicy Southwest Salad",             category: "Salads",     sourceType: "official", allergens: ["dairy","egg","wheat","soy","nuts"] },
      // Nuggets & Strips
      { id: "cfa-nuggets",     name: "Chick-fil-A Nuggets (8 pc)",        category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-grilled-nug", name: "Grilled Nuggets (8 pc)",            category: "Chicken",    sourceType: "official", allergens: ["dairy","soy"] },
      { id: "cfa-strips",      name: "Chick-fil-A Chick-n-Strips (3 pc)", category: "Chicken",    sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-minis",       name: "Chick-n-Minis (4 pc)",              category: "Breakfast",  sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      // Sides
      { id: "cfa-fries",       name: "Waffle Potato Fries",               category: "Sides",      sourceType: "official", allergens: [] },
      { id: "cfa-fries-sup",   name: "Waffle Potato Fries (Superfood)",   category: "Sides",      sourceType: "official", allergens: ["dairy","nuts"] },
      { id: "cfa-mac",         name: "Mac & Cheese",                      category: "Sides",      sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "cfa-soup",        name: "Chicken Noodle Soup",               category: "Sides",      sourceType: "official", allergens: ["dairy","egg","wheat","soy"] },
      { id: "cfa-coleslaw",    name: "Cole Slaw",                         category: "Sides",      sourceType: "official", allergens: ["egg"] },
      { id: "cfa-fruit",       name: "Fruit Cup",                         category: "Sides",      sourceType: "official", allergens: [] },
      { id: "cfa-kale",        name: "Kale Crunch Side",                  category: "Sides",      sourceType: "official", allergens: ["dairy","egg","nuts"] },
      // Salads
      { id: "cfa-market-sal",  name: "Market Salad",                      category: "Salads",     sourceType: "official", allergens: ["dairy","nuts"] },
      { id: "cfa-cobb-sal",    name: "Cobb Salad (no chicken)",           category: "Salads",     sourceType: "official", allergens: ["dairy","egg"] },
      // Desserts & Drinks
      { id: "cfa-shake-choc",  name: "Chocolate Milkshake",               category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-shake-van",   name: "Vanilla Milkshake",                 category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-shake-straw", name: "Strawberry Milkshake",              category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-icedream",    name: "Icedream Cone",                     category: "Desserts",   sourceType: "official", allergens: ["dairy"] },
      { id: "cfa-brownie",     name: "Chocolate Fudge Brownie",           category: "Desserts",   sourceType: "official", allergens: ["dairy","egg","wheat","soy","nuts"] },
      { id: "cfa-lemonade",    name: "Freshly Squeezed Lemonade",         category: "Beverages",  sourceType: "official", allergens: [] },
      { id: "cfa-tea",         name: "Iced Tea (Unsweetened)",            category: "Beverages",  sourceType: "official", allergens: [] },
    ],
  },

  // ─── Starbucks ──────────────────────────────────────────────────────────────
  {
    id: "starbucks",
    name: "Starbucks",
    cuisine: "Café · Coffee",
    address: "321 Grant Ave, San Francisco, CA",
    lat: 37.7887,
    lng: -122.4065,
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
      { id: "sbux-banana-bread",name: "Banana Nut Bread",                 category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg","soy","nuts"] },
      { id: "sbux-chocchunk",  name: "Chocolate Chunk Cookie",            category: "Bakery",     sourceType: "official", allergens: ["dairy","wheat","egg","soy"] },
      // Food
      { id: "sbux-eggwich",    name: "Bacon, Gouda & Egg Sandwich",       category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "sbux-egg-turkey", name: "Turkey Bacon & Egg White Sandwich", category: "Sandwiches", sourceType: "official", allergens: ["dairy","egg","wheat"] },
      { id: "sbux-oatmeal",    name: "Rolled & Steel-Cut Oatmeal",        category: "Hot Breakfast",sourceType: "official", allergens: ["nuts"] },
      { id: "sbux-bistro-box", name: "Protein Box (Egg & Cheese)",        category: "Snacks",     sourceType: "official", allergens: ["dairy","egg","wheat","soy","nuts"] },
    ],
  },

  // ─── Shake Shack ────────────────────────────────────────────────────────────
  {
    id: "shakeshack",
    name: "Shake Shack",
    cuisine: "Burgers · Shakes",
    address: "999 Columbus Ave, San Francisco, CA",
    lat: 37.8007,
    lng: -122.4095,
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
    name: "Subway",
    cuisine: "Fast Casual · Sandwiches",
    address: "500 Market St, San Francisco, CA",
    lat: 37.7905,
    lng: -122.3998,
    distance: 0.5,
    sourceType: "official",
    menuItems: [
      // Breads
      { id: "sub-italian",       name: "Italian White Bread",                category: "Breads",     sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-multigrain",    name: "Hearty Multigrain Bread",            category: "Breads",     sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "sub-honey-oat",     name: "9-Grain Honey Oat Bread",            category: "Breads",     sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-wrap",          name: "Spinach Wrap",                       category: "Breads",     sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-flatbread",     name: "Flatbread",                          category: "Breads",     sourceType: "official", allergens: ["wheat","soy","dairy"] },
      // Subs
      { id: "sub-bmt",           name: "Italian B.M.T.",                     category: "Subs",       sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "sub-turkey",        name: "Turkey Breast",                      category: "Subs",       sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-tuna",          name: "Tuna",                               category: "Subs",       sourceType: "official", allergens: ["wheat","soy","fish","egg"] },
      { id: "sub-meatball",      name: "Meatball Marinara",                  category: "Subs",       sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "sub-veggie",        name: "Veggie Delite",                      category: "Subs",       sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-chicken",       name: "Rotisserie-Style Chicken",           category: "Subs",       sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-steak",         name: "Steak & Cheese",                     category: "Subs",       sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "sub-spicy-italian", name: "Spicy Italian",                      category: "Subs",       sourceType: "official", allergens: ["wheat","soy","dairy"] },
      { id: "sub-black-forest",  name: "Black Forest Ham",                   category: "Subs",       sourceType: "official", allergens: ["wheat","soy"] },
      { id: "sub-roast-beef",    name: "Roast Beef",                         category: "Subs",       sourceType: "official", allergens: ["wheat","soy"] },
      // Breakfast
      { id: "sub-egg-cheese",    name: "Egg & Cheese Sandwich",              category: "Breakfast",  sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "sub-steak-egg",     name: "Steak, Egg & Cheese",                category: "Breakfast",  sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      // Sides & Extras
      { id: "sub-cookie-choc",   name: "Chocolate Chip Cookie",              category: "Cookies",    sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "sub-cookie-oat",    name: "Oatmeal Raisin Cookie",              category: "Cookies",    sourceType: "official", allergens: ["wheat","soy","dairy","egg"] },
      { id: "sub-chips",         name: "Lay's Classic Chips",                category: "Sides",      sourceType: "official", allergens: [] },
      { id: "sub-apple",         name: "Apple Slices",                       category: "Sides",      sourceType: "official", allergens: [] },
    ],
  },

  // ─── Taco Bell ───────────────────────────────────────────────────────────────
  // Source: tacobell.com/allergens
  {
    id: "tacobell",
    name: "Taco Bell",
    cuisine: "Fast Food · Mexican",
    address: "600 Mission St, San Francisco, CA",
    lat: 37.7875,
    lng: -122.4016,
    distance: 0.8,
    sourceType: "official",
    menuItems: [
      // Tacos
      { id: "tb-crunchy-taco",   name: "Crunchy Taco",                       category: "Tacos",      sourceType: "official", allergens: ["dairy","soy"] },
      { id: "tb-soft-taco",      name: "Soft Taco",                          category: "Tacos",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "tb-supreme-taco",   name: "Crunchy Taco Supreme",               category: "Tacos",      sourceType: "official", allergens: ["dairy","soy","egg"] },
      { id: "tb-doritos-locos",  name: "Doritos Locos Taco (Nacho Cheese)",  category: "Tacos",      sourceType: "official", allergens: ["dairy","soy","wheat"] },
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
      { id: "tb-power-bowl",     name: "Power Menu Bowl (Chicken)",          category: "Bowls",      sourceType: "official", allergens: ["dairy","soy"] },
      // Sides
      { id: "tb-nachos",         name: "Nachos BellGrande",                  category: "Sides",      sourceType: "official", allergens: ["dairy","wheat","soy"] },
      { id: "tb-chips-cheese",   name: "Chips & Nacho Cheese Sauce",         category: "Sides",      sourceType: "official", allergens: ["dairy"] },
      { id: "tb-cinnabon",       name: "Cinnabon Delights (2 pk)",           category: "Desserts",   sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "tb-cinnamon-twists",name: "Cinnamon Twists",                    category: "Desserts",   sourceType: "official", allergens: ["wheat","soy"] },
    ],
  },

  // ─── Burger King ─────────────────────────────────────────────────────────────
  // Source: bk.com/allergen-information
  {
    id: "burgerking",
    name: "Burger King",
    cuisine: "Fast Food · Burgers",
    address: "700 Market St, San Francisco, CA",
    lat: 37.7892,
    lng: -122.4056,
    distance: 0.9,
    sourceType: "official",
    menuItems: [
      // Burgers
      { id: "bk-whopper",        name: "Whopper",                            category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "bk-whopper-cheese", name: "Whopper with Cheese",               category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      { id: "bk-double-whopper", name: "Double Whopper",                     category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "bk-bacon-king",     name: "Bacon King",                         category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      { id: "bk-cheeseburger",   name: "Cheeseburger",                       category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      { id: "bk-hamburger",      name: "Hamburger",                          category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","sesame"] },
      { id: "bk-rodeo",          name: "Rodeo Burger",                       category: "Burgers",    sourceType: "official", allergens: ["wheat","soy","dairy","sesame"] },
      // Chicken & Fish
      { id: "bk-crispy-ch",      name: "Crispy Chicken Sandwich",            category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "bk-spicy-crispy",   name: "Spicy Crispy Chicken Sandwich",      category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "bk-orig-chicken",   name: "Original Chicken Sandwich",          category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","egg","sesame"] },
      { id: "bk-nuggets",        name: "Chicken Nuggets (8 pc)",             category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "bk-fish",           name: "Big Fish Sandwich",                  category: "Fish",       sourceType: "official", allergens: ["fish","wheat","soy","egg"] },
      // Sides
      { id: "bk-fries",          name: "French Fries",                       category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "bk-onion-rings",    name: "Onion Rings",                        category: "Sides",      sourceType: "official", allergens: ["wheat","dairy","soy"] },
      { id: "bk-apple-slices",   name: "Apple Slices",                       category: "Sides",      sourceType: "official", allergens: [] },
      { id: "bk-garden-salad",   name: "Garden Side Salad",                  category: "Sides",      sourceType: "official", allergens: [] },
      // Breakfast
      { id: "bk-croissan-wich",  name: "Sausage, Egg & Cheese Croissan'wich",category: "Breakfast",  sourceType: "official", allergens: ["wheat","dairy","egg","soy"] },
      { id: "bk-hash-browns",    name: "Hash Browns",                        category: "Breakfast",  sourceType: "official", allergens: ["wheat","soy"] },
      // Desserts & Drinks
      { id: "bk-shake-van",      name: "Vanilla Milkshake",                  category: "Shakes",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
      { id: "bk-shake-choc",     name: "Chocolate Milkshake",                category: "Shakes",     sourceType: "official", allergens: ["dairy","soy","wheat"] },
    ],
  },

  // ─── Wendy's ─────────────────────────────────────────────────────────────────
  // Source: wendys.com/allergens
  {
    id: "wendys",
    name: "Wendy's",
    cuisine: "Fast Food · Burgers",
    address: "800 Kearny St, San Francisco, CA",
    lat: 37.7961,
    lng: -122.4059,
    distance: 1.3,
    sourceType: "official",
    menuItems: [
      // Burgers
      { id: "wen-dave-single",   name: "Dave's Single",                      category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-dave-double",   name: "Dave's Double",                      category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-dave-triple",   name: "Dave's Triple",                      category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-baconator",     name: "Baconator",                          category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-jr-cheese",     name: "Jr. Cheeseburger",                   category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "wen-pub-burger",    name: "Pretzel Bacon Pub Burger",           category: "Burgers",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      // Chicken
      { id: "wen-crispy-ch",     name: "Classic Chicken Sandwich",           category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-spicy-ch",      name: "Spicy Chicken Sandwich",             category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","egg","soy","sesame"] },
      { id: "wen-grilled-ch",    name: "Grilled Chicken Sandwich",           category: "Chicken",    sourceType: "official", allergens: ["wheat","dairy","soy","sesame"] },
      { id: "wen-nuggets",       name: "Chicken Nuggets (4 pc)",             category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      { id: "wen-spicy-nug",     name: "Spicy Chicken Nuggets (4 pc)",       category: "Chicken",    sourceType: "official", allergens: ["wheat","soy","egg","dairy"] },
      // Sides
      { id: "wen-fries",         name: "Natural Cut Fries",                  category: "Sides",      sourceType: "official", allergens: ["wheat","soy"] },
      { id: "wen-chili",         name: "Small Chili",                        category: "Sides",      sourceType: "official", allergens: ["wheat","soy","egg"] },
      { id: "wen-baked-potato",  name: "Plain Baked Potato",                 category: "Sides",      sourceType: "official", allergens: [] },
      { id: "wen-salad",         name: "Garden Side Salad",                  category: "Sides",      sourceType: "official", allergens: [] },
      // Desserts
      { id: "wen-frosty-van",    name: "Vanilla Frosty",                     category: "Desserts",   sourceType: "official", allergens: ["dairy","soy"] },
      { id: "wen-frosty-choc",   name: "Chocolate Frosty",                   category: "Desserts",   sourceType: "official", allergens: ["dairy","soy"] },
    ],
  },

  // ─── Panera Bread ────────────────────────────────────────────────────────────
  // Source: panerabread.com/en-us/menu/nutrition-allergen-information.html
  {
    id: "panera",
    name: "Panera Bread",
    cuisine: "Fast Casual · Bakery · Café",
    address: "900 Market St, San Francisco, CA",
    lat: 37.7834,
    lng: -122.4076,
    distance: 1.0,
    sourceType: "official",
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
      { id: "pan-fuji-apple",    name: "Fuji Apple Salad",                   category: "Salads",     sourceType: "official", allergens: ["nuts","dairy","egg","wheat"] },
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
    name: "Dunkin'",
    cuisine: "Café · Donuts · Coffee",
    address: "150 New Montgomery St, San Francisco, CA",
    lat: 37.7872,
    lng: -122.3998,
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
];
