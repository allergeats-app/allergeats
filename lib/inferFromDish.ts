// lib/inferFromDish.ts

type Guess = {
  inferredIngredients: string[]; // things likely in the dish
  inferredAllergens: string[];   // allergens likely present
  reason: string;                // why we guessed
};

function has(text: string, phrase: string) {
  return text.includes(phrase);
}

export function inferFromDishName(raw: string): Guess[] {
  const text = raw.toLowerCase();

  const guesses: Guess[] = [];

  // Pasta / creamy sauces
  if (has(text, "alfredo")) {
    guesses.push({
      inferredIngredients: ["cream", "butter", "parmesan"],
      inferredAllergens: ["dairy"],
      reason: "Alfredo sauce is typically cream/butter/cheese",
    });
  }

  if (has(text, "carbonara")) {
    guesses.push({
      inferredIngredients: ["egg", "cheese"],
      inferredAllergens: ["egg", "dairy"],
      reason: "Carbonara is typically egg + cheese",
    });
  }

  if (has(text, "béchamel") || has(text, "bechamel")) {
    guesses.push({
      inferredIngredients: ["milk", "butter", "flour"],
      inferredAllergens: ["dairy", "wheat"],
      reason: "Béchamel is usually milk + butter + flour",
    });
  }

  // Dressings / mayo sauces
  if (has(text, "ranch")) {
    guesses.push({
      inferredIngredients: ["buttermilk", "mayo"],
      inferredAllergens: ["dairy", "egg"],
      reason: "Ranch commonly contains dairy + mayo",
    });
  }

  if (has(text, "caesar")) {
    guesses.push({
      inferredIngredients: ["egg", "anchovy", "parmesan"],
      inferredAllergens: ["egg", "fish", "dairy"],
      reason: "Caesar dressing often has egg + anchovy + cheese",
    });
  }

  // Fried/breaded
  if (has(text, "fried") || has(text, "crispy") || has(text, "breaded") || has(text, "battered")) {
    guesses.push({
      inferredIngredients: ["flour", "egg"],
      inferredAllergens: ["wheat", "egg"],
      reason: "Breaded/fried items often use flour + egg wash",
    });
  }

  // Asian sauces
  if (has(text, "teriyaki")) {
    guesses.push({
      inferredIngredients: ["soy sauce"],
      inferredAllergens: ["soy", "wheat"],
      reason: "Teriyaki commonly uses soy sauce (often contains wheat)",
    });
  }

  if (has(text, "gochujang")) {
    guesses.push({
      inferredIngredients: ["fermented chili paste", "often contains wheat/soy"],
      inferredAllergens: ["soy", "wheat"],
      reason: "Gochujang commonly includes wheat/soy ingredients",
    });
  }

  // “House sauce” / vague
  if (has(text, "house sauce") || has(text, "secret sauce") || has(text, "signature sauce")) {
    guesses.push({
      inferredIngredients: ["unknown sauce base (could include dairy/egg/soy)"],
      inferredAllergens: ["egg", "dairy", "soy"],
      reason: "House/secret sauces often include mayo/cream/soy-based ingredients",
    });
  }

  return guesses;
}