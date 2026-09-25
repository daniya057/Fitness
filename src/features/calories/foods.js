import data from "../../../data/content/foods.json";
import { api } from "../auth/api";

export const FOOD_CATEGORIES = data.categories;
export const FOODS = data.foods.filter((item) => item.category !== "quick");

const SOURCE_LABEL = {
  local: "таблица",
  off: "магазин",
  "off-ru": "магазин",
  usda: "USDA",
};

export function sourceLabel(food) {
  return SOURCE_LABEL[food?.source] || "";
}

export async function searchRemoteFoods(query) {
  const q = String(query || "").trim();
  if (q.length < 2) {
    return [];
  }
  const data = await api(`/foods/search?q=${encodeURIComponent(q)}`);
  return Array.isArray(data.foods) ? data.foods : [];
}

export function mergeFoodLists(local, remote) {
  const seen = new Set(
    (local || []).map((item) => String(item.name || "").toLowerCase().trim()).filter(Boolean)
  );
  const extra = [];
  for (const item of remote || []) {
    const name = String(item.name || "").toLowerCase().trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    extra.push(item);
  }
  return [...(local || []), ...extra].slice(0, 40);
}

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function nameMatches(name, needle) {
  const hay = String(name || "").toLowerCase();
  if (!needle) {
    return true;
  }
  if (hay.includes(needle)) {
    return true;
  }
  const stem = needle.length >= 5 ? needle.slice(0, -1) : needle;
  return stem.length >= 4 && hay.includes(stem);
}

export function foodById(id) {
  return data.foods.find((item) => item.id === id) || null;
}

export function searchFoods(query, categoryId) {
  const needle = String(query || "")
    .trim()
    .toLowerCase();
  return FOODS.filter((item) => {
    if (categoryId && categoryId !== "all" && item.category !== categoryId) {
      return false;
    }
    if (!needle) {
      return Boolean(categoryId && categoryId !== "all");
    }
    return nameMatches(item.name, needle);
  }).slice(0, 36);
}

export function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

export function macrosForGrams(food, grams) {
  const k = Number(grams) / 100;
  if (!food || !Number.isFinite(k) || k <= 0) {
    return { protein: 0, fat: 0, carbs: 0, kcal: 0 };
  }
  return {
    protein: round1((food.protein || 0) * k),
    fat: round1((food.fat || 0) * k),
    carbs: round1((food.carbs || 0) * k),
    kcal: Math.round((food.kcal || 0) * k),
  };
}

export function sumLog(items) {
  return (items || []).reduce(
    (acc, item) => ({
      protein: round1(acc.protein + Number(item.protein || 0)),
      fat: round1(acc.fat + Number(item.fat || 0)),
      carbs: round1(acc.carbs + Number(item.carbs || 0)),
      kcal: Math.round(acc.kcal + Number(item.kcal || 0)),
    }),
    { protein: 0, fat: 0, carbs: 0, kcal: 0 }
  );
}

export function makeLogItem(food, grams) {
  const macros = macrosForGrams(food, grams);
  return {
    id: `log-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
    foodId: food.id,
    grams: Math.round(Number(grams) || 0),
    label: food.name,
    kcal: macros.kcal,
    protein: macros.protein,
    fat: macros.fat,
    carbs: macros.carbs,
  };
}
