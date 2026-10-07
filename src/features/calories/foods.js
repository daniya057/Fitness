import data from "../../../data/content/foods.json";
import { api } from "../auth/api";

export const FOOD_CATEGORIES = data.categories;
export const FOODS = data.foods.filter((item) => item.category !== "quick");

const SOURCE_LABEL = {
  local: "таблица",
  off: "магазин",
  "off-ru": "магазин",
  usda: "USDA",
  guess: "ориентир",
  list: "Barcode List",
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
    if (!name || seen.has(name) || isPantryName(item.name)) {
      continue;
    }
    seen.add(name);
    extra.push(item);
  }
  const merged = [...(local || []), ...extra];
  return extra.length ? merged.slice(0, 40) : merged;
}

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function foldName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WORD_ENDINGS = [
  "ами", "ями", "ого", "его", "ыми", "ими",
  "ая", "яя", "ое", "ее", "ые", "ие", "ый", "ий", "ой",
  "ов", "ев", "ам", "ям", "ах", "ях", "ом", "ем",
  "ок", "ек", "ки", "ка", "цы", "ец",
  "у", "ю", "а", "я", "ы", "и", "е", "о",
];

function extraNeedles(query) {
  const list = [];
  if (query.includes("гречн")) {
    list.push("гречк");
  }
  if (query.includes("картош")) {
    list.push("картоф");
  }
  if (query.startsWith("творог")) {
    list.push("творож");
  }
  return list;
}

function stemsOf(query) {
  if (query.length <= 3) {
    return [];
  }
  const stems = [];
  for (const ending of WORD_ENDINGS) {
    if (!query.endsWith(ending)) {
      continue;
    }
    const stem = query.slice(0, -ending.length);
    const min = ending.length === 1 ? 3 : 4;
    if (stem.length >= min) {
      stems.push(stem);
    }
  }
  return stems;
}

function scoreNeedle(folded, words, needle) {
  if (!needle || !words.length) {
    return 9;
  }
  if (words[0].startsWith(needle)) {
    return 0;
  }
  if (words.some((word) => word === needle)) {
    return 1;
  }
  if (words.some((word) => word.startsWith(needle))) {
    return 2;
  }
  return 9;
}

function matchScore(name, query) {
  const folded = foldName(name);
  const q = foldName(query);
  if (!q || !folded) {
    return 9;
  }
  const words = folded.split(" ").filter(Boolean);
  let best = 9;
  for (const needle of [q, ...extraNeedles(q)]) {
    best = Math.min(best, scoreNeedle(folded, words, needle));
  }
  if (q.length <= 3) {
    return best;
  }
  if (words.some((word) => stemsOf(q).some((stem) => word.startsWith(stem)))) {
    best = Math.min(best, 3);
  }
  return best;
}

export function foodById(id) {
  return data.foods.find((item) => item.id === id) || null;
}

export function isPantryName(name) {
  const n = String(name || "").toLowerCase();
  if (!n) {
    return true;
  }
  if (/^мука(?:\s|$)|\bflour\b|^крахмал|\bstarch\b|какао-порошок|cocoa powder/.test(n)) {
    return true;
  }
  if (/яичный порошок|^меланж$|^жир |спирт этиловый|yeast|дрожж/.test(n)) {
    return true;
  }
  if (/макарон/.test(n) && !/варен|cooked/.test(n)) {
    return true;
  }
  if ((/^рис /.test(n) && !/варен| с /.test(n)) || (/^rice,/.test(n) && !/cooked|boiled/.test(n)) || /, raw\b|\buncooked\b/.test(n)) {
    return true;
  }
  return false;
}

export function searchFoods(query, categoryId) {
  const needle = foldName(query);
  const list = FOODS.filter((item) => {
    if (categoryId && categoryId !== "all" && item.category !== categoryId) {
      return false;
    }
    if (!needle) {
      return Boolean(categoryId && categoryId !== "all");
    }
    return matchScore(item.name, needle) < 9 && !isPantryName(item.name);
  });
  if (!needle) {
    return list;
  }
  return list
    .map((item, index) => ({ item, index, score: matchScore(item.name, needle) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((row) => row.item)
    .slice(0, 36);
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
