import data from "../../../data/content/recipes.json";
import { dietFlags, macroTargets, quizOf } from "../checkins/recommend";
import { foodById, round1, utcDay } from "./foods";
import { parseFoodSkip, recipeHitsSkip } from "./foodSkip";

export const SLOT_TITLES = data.slots;

// Ответ опросника → тег ингредиента, который блюдо не должно содержать.
const FLAG_TO_AVOID = {
  noMeat: "meat",
  noFish: "fish",
  noDairy: "dairy",
  noGluten: "gluten",
  noNuts: "nuts",
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.7;
const PRICE_STEP = 5;

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function avoidTags(user) {
  const flags = dietFlags(quizOf(user));
  const tags = new Set();
  for (const flag of flags) {
    if (FLAG_TO_AVOID[flag]) {
      tags.add(FLAG_TO_AVOID[flag]);
    }
  }
  return tags;
}

function recipeAllowed(recipe, tags, skip) {
  if ((recipe.avoid || []).some((tag) => tags.has(tag))) {
    return false;
  }
  return !recipeHitsSkip(recipe, skip, foodById);
}

function pricePerKg(foodId) {
  return Number(data.prices[foodId]) || 0;
}

function roundGrams(grams) {
  if (grams < 20) {
    return Math.max(5, Math.round(grams));
  }
  return Math.max(5, Math.round(grams / 5) * 5);
}

function roundPrice(value) {
  return Math.max(PRICE_STEP, Math.ceil(value / PRICE_STEP) * PRICE_STEP);
}

function baseKcal(recipe) {
  return recipe.ingredients.reduce((sum, ing) => {
    const food = foodById(ing.foodId);
    return sum + ((food?.kcal || 0) * ing.grams) / 100;
  }, 0);
}

// Масштабирует блюдо под целевые ккал приёма, считает БЖУ и цену по продуктам.
export function scaleRecipe(recipe, targetKcal) {
  const base = baseKcal(recipe);
  const rawScale = base > 0 ? targetKcal / base : 1;
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale));
  const ingredients = [];
  let kcal = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let price = 0;
  let grams = 0;
  for (const ing of recipe.ingredients) {
    const food = foodById(ing.foodId);
    if (!food) {
      continue;
    }
    const portion = roundGrams(ing.grams * scale);
    const k = portion / 100;
    const cost = (portion / 1000) * pricePerKg(ing.foodId);
    kcal += (food.kcal || 0) * k;
    protein += (food.protein || 0) * k;
    fat += (food.fat || 0) * k;
    carbs += (food.carbs || 0) * k;
    price += cost;
    grams += portion;
    ingredients.push({
      foodId: ing.foodId,
      name: food.name,
      category: food.category,
      grams: portion,
      kcal: Math.round((food.kcal || 0) * k),
      price: Math.round(cost),
    });
  }
  return {
    id: recipe.id,
    slot: recipe.slot,
    slotLabel: SLOT_TITLES[recipe.slot] || "Приём",
    title: recipe.title,
    main: recipe.main,
    scale: round1(scale),
    targetKcal: Math.round(targetKcal),
    grams,
    kcal: Math.round(kcal),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    price: roundPrice(price),
    ingredients,
  };
}

function heroOf(recipe) {
  return recipe.ingredients[0]?.foodId || recipe.id;
}

function pickRecipe({ slot, pool, rand, usedIds, usedMains, usedHeroes, exclude }) {
  const inSlot = pool.filter((recipe) => recipe.slot === slot);
  const tiers = [
    (r) => !usedIds.has(r.id) && !usedMains.has(r.main) && !usedHeroes.has(heroOf(r)) && !exclude.has(r.id),
    (r) => !usedIds.has(r.id) && !usedMains.has(r.main) && !exclude.has(r.id),
    (r) => !usedIds.has(r.id) && !usedMains.has(r.main),
    (r) => !usedIds.has(r.id) && !usedHeroes.has(heroOf(r)),
    (r) => !usedIds.has(r.id),
    () => true,
  ];
  for (const ok of tiers) {
    const options = inSlot.filter(ok);
    if (options.length) {
      return shuffle(options, rand)[0];
    }
  }
  return null;
}

/**
 * Собирает рацион на день: приёмы по норме ккал пользователя, блюда без
 * запрещённых опросником групп, разные основы (курица/рыба/творог/бобовые…).
 * seed — произвольная строка; attempt меняет вариант; exclude — ids прошлого
 * варианта, чтобы «Другой вариант» действительно отличался.
 */
export function buildMealPlan(user, { attempt = 0, exclude = [] } = {}) {
  const macros = macroTargets(user);
  const split = data.split[String(macros.meals)] || data.split["3"];
  const tags = avoidTags(user);
  const skipFoods = parseFoodSkip(quizOf(user).foodSkip);
  const pool = data.recipes.filter((recipe) => recipeAllowed(recipe, tags, skipFoods));
  const seed = hashSeed(`${user?.id || "guest"}|${utcDay()}|${attempt}|${(quizOf(user).foodSkip || []).join("|")}`);
  const rand = mulberry32(seed);
  const usedIds = new Set();
  const usedMains = new Set();
  const usedHeroes = new Set();
  const skip = new Set(exclude);
  const meals = [];
  for (const [slot, share] of split) {
    const recipe = pickRecipe({ slot, pool, rand, usedIds, usedMains, usedHeroes, exclude: skip });
    if (!recipe) {
      continue;
    }
    usedIds.add(recipe.id);
    usedMains.add(recipe.main);
    usedHeroes.add(heroOf(recipe));
    meals.push(scaleRecipe(recipe, macros.kcal * share));
  }
  const totals = meals.reduce(
    (acc, meal) => ({
      kcal: acc.kcal + meal.kcal,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      carbs: acc.carbs + meal.carbs,
      price: acc.price + meal.price,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, price: 0 }
  );
  return {
    date: utcDay(),
    attempt,
    target: macros,
    restricted: tags.size > 0 || skipFoods.tokens.length > 0 || skipFoods.groups.size > 0,
    meals,
    totals,
  };
}

// Одна строка дневника на блюдо: КБЖУ всей порции, без распила на продукты.
export function mealLogItem(meal) {
  return {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
    foodId: `recipe:${meal.id}`,
    category: "meals",
    grams: meal.grams,
    label: meal.title,
    kcal: meal.kcal,
    protein: meal.protein,
    fat: meal.fat,
    carbs: meal.carbs,
  };
}

export function formatPrice(value) {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}
