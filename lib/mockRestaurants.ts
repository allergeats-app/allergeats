/**
 * Seeded restaurant data for the discovery flow.
 * All items use rich descriptions so the detection pipeline can score them accurately.
 * sourceType drives confidence; distances are mock values around a San Francisco center point.
 *
 * To add a real restaurant: copy the structure, set sourceType appropriately,
 * and provide ingredient-rich item descriptions.
 */

import type { Restaurant } from "./types";

export const MOCK_RESTAURANTS: Restaurant[] = [
  // ─── McDonald's ────────────────────────────────────────────────────────────
  {
    id: "mcdonalds",
    name: "McDonald's",
    cuisine: "Fast Food",
    address: "123 Market St, San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    distance: 0.4,
    sourceType: "verified-dataset",
    menuItems: [
      {
        id: "mcd-bigmac",
        name: "Big Mac",
        description: "Two beef patties, Big Mac sauce (mayo, pickle relish, mustard), shredded lettuce, American cheese, pickles, onion on a sesame seed bun",
        category: "Burgers",
      },
      {
        id: "mcd-qpc",
        name: "Quarter Pounder with Cheese",
        description: "Fresh beef patty, two slices American cheese, lettuce, tomato, onion, pickles, ketchup, mustard on sesame seed bun",
        category: "Burgers",
      },
      {
        id: "mcd-fof",
        name: "Filet-O-Fish",
        description: "Pollock fish fillet, tartar sauce (mayo, pickle relish), half slice American cheese on a steamed wheat bun",
        category: "Fish",
      },
      {
        id: "mcd-mcchicken",
        name: "McChicken",
        description: "Crispy fried chicken breast in wheat flour coating, mayo, shredded lettuce on a regular bun",
        category: "Chicken",
      },
      {
        id: "mcd-nuggets",
        name: "10 Piece Chicken McNuggets",
        description: "White chicken meat in a crispy tempura-style batter with wheat flour and egg wash, served with dipping sauces",
        category: "Chicken",
      },
      {
        id: "mcd-fries",
        name: "World Famous Fries",
        description: "Potatoes fried in canola oil blend with natural beef flavor (contains milk and wheat derivatives)",
        category: "Sides",
      },
      {
        id: "mcd-biscuit",
        name: "Sausage Biscuit",
        description: "Pork sausage patty on a buttermilk biscuit with butter and wheat flour",
        category: "Breakfast",
      },
      {
        id: "mcd-emuffin",
        name: "Egg McMuffin",
        description: "Whole egg, Canadian bacon, American cheese on an English muffin with butter",
        category: "Breakfast",
      },
      {
        id: "mcd-hotcakes",
        name: "Hotcakes",
        description: "Fluffy wheat flour pancakes served with creamy butter and maple-flavored syrup",
        category: "Breakfast",
      },
      {
        id: "mcd-applepie",
        name: "Baked Apple Pie",
        description: "Flaky pastry crust made with wheat flour and butter, apple and cinnamon filling",
        category: "Desserts",
      },
      {
        id: "mcd-cone",
        name: "Vanilla Soft Serve Cone",
        description: "Low-fat soft serve ice cream with milk, cream, and sugar",
        category: "Desserts",
      },
    ],
  },

  // ─── Chipotle ──────────────────────────────────────────────────────────────
  {
    id: "chipotle",
    name: "Chipotle Mexican Grill",
    cuisine: "Fast Casual · Mexican",
    address: "456 Mission St, San Francisco, CA",
    lat: 37.7859,
    lng: -122.4009,
    distance: 0.7,
    sourceType: "verified-dataset",
    menuItems: [
      {
        id: "chip-burrito",
        name: "Burrito",
        description: "Large flour tortilla filled with cilantro-lime rice, black or pinto beans, choice of protein, salsa, optional sour cream and cheese",
        category: "Entrées",
      },
      {
        id: "chip-bowl",
        name: "Burrito Bowl",
        description: "Cilantro-lime rice, black beans, grilled chicken or steak, fresh tomato salsa, optional cheese, sour cream, and guacamole",
        category: "Entrées",
      },
      {
        id: "chip-quesadilla",
        name: "Cheese Quesadilla",
        description: "Flour tortilla grilled with butter, filled with Monterey Jack cheese, served with sour cream",
        category: "Entrées",
      },
      {
        id: "chip-chicken",
        name: "Grilled Chicken",
        description: "Achiote-marinated chicken thighs with rice bran oil, chipotle pepper, and garlic — no allergens beyond poultry",
        category: "Proteins",
      },
      {
        id: "chip-steak",
        name: "Carne Asada Steak",
        description: "Responsibly raised beef marinated with chipotle pepper, garlic, and guajillo pepper",
        category: "Proteins",
      },
      {
        id: "chip-barbacoa",
        name: "Barbacoa",
        description: "Slow-cooked shredded beef braised with bay leaves, garlic, cumin, and chipotle adobo",
        category: "Proteins",
      },
      {
        id: "chip-carnitas",
        name: "Carnitas",
        description: "Pork shoulder slow-roasted with thyme, juniper, and bay leaf",
        category: "Proteins",
      },
      {
        id: "chip-sofritas",
        name: "Sofritas",
        description: "Organic braised tofu with chipotle chili, roasted poblano, and spices (contains soy)",
        category: "Proteins",
      },
      {
        id: "chip-sourc",
        name: "Sour Cream",
        description: "Pasteurized cream and culture (contains dairy)",
        category: "Toppings",
      },
      {
        id: "chip-queso",
        name: "Queso Blanco",
        description: "Melted white cheese sauce with tomatillo, corn, and jalapeño (contains dairy, corn)",
        category: "Toppings",
      },
      {
        id: "chip-guac",
        name: "Guacamole",
        description: "Fresh avocado, tomatillo, red onion, jalapeño, lime juice, cilantro",
        category: "Toppings",
      },
      {
        id: "chip-cheese",
        name: "Shredded Cheese",
        description: "Monterey Jack shredded cheese (contains dairy)",
        category: "Toppings",
      },
    ],
  },

  // ─── Chick-fil-A ──────────────────────────────────────────────────────────
  {
    id: "chickfila",
    name: "Chick-fil-A",
    cuisine: "Fast Food · Chicken",
    address: "789 Powell St, San Francisco, CA",
    lat: 37.7851,
    lng: -122.4082,
    distance: 1.1,
    sourceType: "verified-dataset",
    menuItems: [
      {
        id: "cfa-sandwich",
        name: "Original Chicken Sandwich",
        description: "Pressure-cooked chicken breast with dill pickle chips on a butter-toasted bun (contains wheat, dairy, egg)",
        category: "Sandwiches",
      },
      {
        id: "cfa-spicy",
        name: "Spicy Deluxe Chicken Sandwich",
        description: "Spicy seasoned chicken breast, pepper jack cheese, green leaf lettuce, tomato, pickles on toasted bun (dairy, wheat, egg)",
        category: "Sandwiches",
      },
      {
        id: "cfa-grilled",
        name: "Grilled Chicken Sandwich",
        description: "Lemon-herb marinated grilled chicken breast, green leaf lettuce, tomato, honey roasted BBQ sauce on multigrain brioche bun",
        category: "Sandwiches",
      },
      {
        id: "cfa-nuggets",
        name: "Grilled Nuggets",
        description: "All-natural grilled chicken breast pieces marinated in lemon-herb seasoning",
        category: "Chicken",
      },
      {
        id: "cfa-fries",
        name: "Waffle Fries",
        description: "Sliced whole potatoes fried in canola oil, seasoned with salt",
        category: "Sides",
      },
      {
        id: "cfa-soup",
        name: "Chicken Noodle Soup",
        description: "Shredded chicken, egg noodles, carrots, celery, onion in chicken broth (contains wheat, egg)",
        category: "Soups",
      },
      {
        id: "cfa-mac",
        name: "Mac & Cheese",
        description: "Macaroni pasta in a blend of cheddar, Parmesan, and Romano cheeses (contains dairy, wheat, egg)",
        category: "Sides",
      },
      {
        id: "cfa-shake",
        name: "Chocolate Milkshake",
        description: "Icedream frozen dessert made with milk and cream, chocolate syrup (contains dairy)",
        category: "Beverages",
      },
    ],
  },

  // ─── Starbucks ────────────────────────────────────────────────────────────
  {
    id: "starbucks",
    name: "Starbucks",
    cuisine: "Café · Coffee",
    address: "321 Grant Ave, San Francisco, CA",
    lat: 37.7887,
    lng: -122.4065,
    distance: 0.6,
    sourceType: "verified-dataset",
    menuItems: [
      {
        id: "sbux-latte",
        name: "Caffè Latte",
        description: "Espresso shots with steamed whole milk and light milk foam",
        category: "Hot Drinks",
      },
      {
        id: "sbux-macchiato",
        name: "Iced Caramel Macchiato",
        description: "Vanilla syrup, cold milk, ice, espresso, caramel sauce drizzle (contains dairy)",
        category: "Cold Drinks",
      },
      {
        id: "sbux-frapp",
        name: "Green Tea Crème Frappuccino",
        description: "Matcha green tea blend, milk, ice, topped with whipped cream (contains dairy)",
        category: "Frappuccinos",
      },
      {
        id: "sbux-psl",
        name: "Pumpkin Spice Latte",
        description: "Espresso, pumpkin spice sauce with pumpkin puree and cinnamon, steamed milk, whipped cream (contains dairy)",
        category: "Hot Drinks",
      },
      {
        id: "sbux-croissant",
        name: "Chocolate Croissant",
        description: "Flaky butter croissant with dark chocolate filling (contains wheat, dairy, egg)",
        category: "Bakery",
      },
      {
        id: "sbux-scone",
        name: "Blueberry Scone",
        description: "Wheat flour, butter, eggs, fresh blueberries, topped with powdered sugar glaze (contains dairy, egg, wheat)",
        category: "Bakery",
      },
      {
        id: "sbux-eggwich",
        name: "Bacon, Gouda & Egg Sandwich",
        description: "Applewood smoked bacon, aged gouda cheese, whole egg frittata on an artisan roll (contains dairy, egg, wheat)",
        category: "Sandwiches",
      },
      {
        id: "sbux-oatmeal",
        name: "Rolled & Steel-Cut Oatmeal",
        description: "Whole-grain rolled oats with dried blueberries, cranberries, almonds, and brown sugar topping",
        category: "Hot Breakfast",
      },
      {
        id: "sbux-black",
        name: "Pike Place Roast (Black)",
        description: "Medium-roast brewed coffee, black — no additives",
        category: "Hot Drinks",
      },
    ],
  },

  // ─── Shake Shack (scraped — lower confidence) ─────────────────────────────
  {
    id: "shakeshack",
    name: "Shake Shack",
    cuisine: "Burgers · Shakes",
    address: "999 Columbus Ave, San Francisco, CA",
    lat: 37.8007,
    lng: -122.4095,
    distance: 2.1,
    sourceType: "scraped",          // lower confidence — scraped from menu page
    menuItems: [
      {
        id: "ss-shackburger",
        name: "ShackBurger",
        description: "Ground beef patty, American cheese, ShackSauce (house mayo blend), green leaf lettuce, tomato, potato bun",
        category: "Burgers",
      },
      {
        id: "ss-smokeshack",
        name: "SmokeShack",
        description: "Beef patty, cheddar cheese, applewood smoked bacon, cherry peppers, ShackSauce on potato bun",
        category: "Burgers",
      },
      {
        id: "ss-chickenshack",
        name: "Chicken Shack",
        description: "Crispy fried chicken breast, pickles, buttermilk herb mayo on potato bun (contains dairy, egg, wheat)",
        category: "Chicken",
      },
      {
        id: "ss-fries",
        name: "Crinkle Cut Fries",
        description: "Potatoes fried in canola and soybean oil blend, salted (contains soy)",
        category: "Sides",
      },
      {
        id: "ss-shake",
        name: "Chocolate Shake",
        description: "Frozen chocolate custard blended with whole milk (contains dairy, egg in custard)",
        category: "Shakes",
      },
      {
        id: "ss-veggieshack",
        name: "Veggie Shack",
        description: "Portobello mushroom, roasted red pepper, goat cheese on potato bun (contains dairy)",
        category: "Burgers",
      },
    ],
  },
];
