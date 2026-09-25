const foodsFile = require("../data/content/foods.json");

const OFF_UA = {
  Accept: "application/json",
  "User-Agent": "FitnessApp/1.0 (fit-project; calorie-log)",
};

function round1(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

function nutrient(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function hasMacros(food) {
  return Boolean(food && (food.kcal || food.protein || food.fat || food.carbs));
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function nameMatches(name, needle) {
  const hay = normalizeName(name);
  const q = String(needle || "").toLowerCase().trim();
  if (!q) {
    return true;
  }
  if (hay.includes(q)) {
    return true;
  }
  const stem = q.length >= 5 ? q.slice(0, -1) : q;
  return stem.length >= 4 && hay.includes(stem);
}

async function fetchJson(url, headers = {}, ms = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const response = await fetch(url, { headers, signal: ctrl.signal });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function fromOffProduct(product, code, source) {
  if (!product) {
    return null;
  }
  const n = product.nutriments || {};
  let kcal = nutrient(n["energy-kcal_100g"] ?? n["energy-kcal"]);
  if (!kcal && n.energy_100g) {
    kcal = nutrient(n.energy_100g) / 4.184;
  }
  const protein = round1(n.proteins_100g);
  const fat = round1(n.fat_100g);
  const carbs = round1(n.carbohydrates_100g);
  if (!kcal && (protein || fat || carbs)) {
    kcal = 4 * protein + 9 * fat + 4 * carbs;
  }
  kcal = Math.round(kcal);
  if (!kcal && !protein && !fat && !carbs) {
    return null;
  }
  const barcode = String(code || product.code || "").replace(/\D/g, "");
  const name = String(product.product_name_ru || product.product_name || product.generic_name || "")
    .trim()
    .slice(0, 80);
  return {
    id: `off-${barcode || name.slice(0, 24)}`,
    name: name || (barcode ? `Код ${barcode}` : "Продукт"),
    protein,
    fat,
    carbs,
    kcal,
    source,
  };
}

function usdaValue(food, needles) {
  const list = food.foodNutrients || [];
  for (const item of list) {
    const name = String(item.nutrientName || item.nutrient?.name || "").toLowerCase();
    const unit = String(item.unitName || item.nutrient?.unitName || "").toLowerCase();
    if (!needles.some((needle) => name.includes(needle))) {
      continue;
    }
    if (needles.includes("energy") && unit && unit !== "kcal") {
      continue;
    }
    const value = nutrient(item.value ?? item.amount);
    if (value) {
      return value;
    }
  }
  return 0;
}

function fromUsdaFood(food) {
  if (!food) {
    return null;
  }
  let protein = usdaValue(food, ["protein"]);
  let fat = usdaValue(food, ["total lipid", "total fat"]);
  let carbs = usdaValue(food, ["carbohydrate"]);
  let kcal = usdaValue(food, ["energy"]);
  protein = round1(protein);
  fat = round1(fat);
  carbs = round1(carbs);
  kcal = Math.round(kcal);
  if (!kcal && (protein || fat || carbs)) {
    kcal = Math.round(4 * protein + 9 * fat + 4 * carbs);
  }
  if (!kcal && !protein && !fat && !carbs) {
    return null;
  }
  const gtin = String(food.gtinUpc || "").replace(/\D/g, "");
  return {
    id: gtin ? `usda-${gtin}` : `usda-${food.fdcId}`,
    name: String(food.description || food.brandName || "USDA").trim().slice(0, 80),
    protein,
    fat,
    carbs,
    kcal,
    source: "usda",
  };
}

async function offProduct(host, code) {
  const data = await fetchJson(`https://${host}/api/v2/product/${code}.json`, OFF_UA);
  if (!data || data.status !== 1) {
    return null;
  }
  return fromOffProduct(data.product, code, host.startsWith("ru.") ? "off-ru" : "off");
}

async function usdaSearch(query, { barcode = false } = {}) {
  const key = process.env.USDA_API_KEY || "DEMO_KEY";
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(key)}` +
    `&query=${encodeURIComponent(query)}&pageSize=8` +
    `&dataType=${encodeURIComponent("Foundation,SR Legacy,Branded")}`;
  const data = await fetchJson(url, { Accept: "application/json" });
  const foods = Array.isArray(data?.foods) ? data.foods : [];
  if (barcode) {
    const hit = foods.find((item) => String(item.gtinUpc || "").replace(/\D/g, "") === query);
    return hit ? fromUsdaFood(hit) : null;
  }
  return foods.map(fromUsdaFood).filter(hasMacros);
}

async function offSearchHost(host, query) {
  const url =
    `https://${host}/cgi/search.pl?search_simple=1&action=process&json=1` +
    `&page_size=8&fields=code,product_name,product_name_ru,generic_name,nutriments` +
    `&search_terms=${encodeURIComponent(query)}`;
  const data = await fetchJson(url, OFF_UA);
  const products = Array.isArray(data?.products) ? data.products : [];
  const source = host.startsWith("ru.") ? "off-ru" : "off";
  return products.map((item) => fromOffProduct(item, item.code, source)).filter(hasMacros);
}

async function offSearch(query) {
  const [world, ru] = await Promise.all([
    offSearchHost("world.openfoodfacts.org", query),
    offSearchHost("ru.openfoodfacts.org", query),
  ]);
  return mergeFoods([ru, world]);
}

function mergeFoods(lists) {
  const seen = new Set();
  const out = [];
  for (const food of lists.flat()) {
    if (!hasMacros(food) || !food.name) {
      continue;
    }
    const key = food.id.startsWith("off-") || food.id.startsWith("usda-")
      ? food.id
      : normalizeName(food.name);
    if (seen.has(key) || seen.has(normalizeName(food.name))) {
      continue;
    }
    seen.add(key);
    seen.add(normalizeName(food.name));
    out.push(food);
  }
  return out;
}

function searchLocal(query) {
  const needle = String(query || "").trim().toLowerCase();
  if (needle.length < 2) {
    return [];
  }
  return (foodsFile.foods || [])
    .filter((item) => item.category !== "quick" && nameMatches(item.name, needle))
    .slice(0, 20)
    .map((item) => ({
      id: item.id,
      name: item.name,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      kcal: item.kcal,
      source: "local",
    }));
}

async function lookupBarcode(code) {
  const [world, ru, usda] = await Promise.all([
    offProduct("world.openfoodfacts.org", code),
    offProduct("ru.openfoodfacts.org", code),
    usdaSearch(code, { barcode: true }),
  ]);
  return ru || world || usda || null;
}

async function searchNutrition(query) {
  const q = String(query || "").trim().slice(0, 40);
  if (q.length < 2) {
    return [];
  }
  const [off, usda] = await Promise.all([offSearch(q), usdaSearch(q)]);
  return mergeFoods([searchLocal(q), off, usda]).slice(0, 36);
}

module.exports = { lookupBarcode, searchNutrition };
