const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const foodsFile = require("../data/content/foods.json");
const { attachPack } = require("./pack");
const { lookupBarcodeList, searchBarcodeList } = require("./barcode-list");

const BARCODE_FILE = path.join(__dirname, "..", "data", "content", "barcodes.sqlite");
let barcodeDb = null;
let barcodeWarned = false;

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
  const barcode = String(code || product.code || "").replace(/\D/g, "");
  const name = String(product.product_name_ru || product.product_name || product.generic_name || "")
    .trim()
    .slice(0, 80);
  if (!name) {
    return null;
  }
  return attachPack(
    {
      id: `off-${barcode || name.slice(0, 24)}`,
      name: name || (barcode ? `Код ${barcode}` : "Продукт"),
      protein,
      fat,
      carbs,
      kcal,
      source,
    },
    product.quantity || product.product_quantity
  );
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
  return attachPack(
    {
      id: gtin ? `usda-${gtin}` : `usda-${food.fdcId}`,
      name: String(food.description || food.brandName || "USDA").trim().slice(0, 80),
      protein,
      fat,
      carbs,
      kcal,
      source: "usda",
    },
    food.packageWeight
  );
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
    `&page_size=8&fields=code,product_name,product_name_ru,generic_name,nutriments,quantity` +
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
  const needle = foldName(query);
  if (needle.length < 2) {
    return [];
  }
  return (foodsFile.foods || [])
    .filter((item) => item.category !== "quick" && matchScore(item.name, needle) < 9)
    .map((item, index) => ({ item, index, score: matchScore(item.name, needle) }))
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, 36)
    .map(({ item }) => ({
      id: item.id,
      name: item.name,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      kcal: item.kcal,
      source: "local",
    }));
}

function openBarcodeDb() {
  if (barcodeDb) {
    return barcodeDb;
  }
  if (!fs.existsSync(BARCODE_FILE)) {
    if (!barcodeWarned) {
      barcodeWarned = true;
      console.log("Нет локальной базы штрихкодов (data/content/barcodes.sqlite). Собери: npm run barcodes");
    }
    return null;
  }
  try {
    barcodeDb = new DatabaseSync(BARCODE_FILE, { readOnly: true });
    const count = barcodeDb.prepare("SELECT COUNT(*) AS n FROM barcodes").get();
    console.log(`Штрихкоды: локально ${count?.n || 0}`);
    return barcodeDb;
  } catch (error) {
    if (!barcodeWarned) {
      barcodeWarned = true;
      console.log(`Не открылась база штрихкодов: ${error.message}`);
    }
    return null;
  }
}

function barcodeKeys(code) {
  const digits = String(code || "").replace(/\D/g, "");
  if (!digits) {
    return [];
  }
  const keys = new Set([digits]);
  const stripped = digits.replace(/^0+/, "");
  if (stripped) {
    keys.add(stripped);
  }
  for (const size of [8, 12, 13, 14]) {
    if (digits.length <= size) {
      keys.add(digits.padStart(size, "0"));
    }
    if (stripped && stripped.length <= size) {
      keys.add(stripped.padStart(size, "0"));
    }
  }
  return [...keys];
}

function lookupLocalBarcode(code) {
  const db = openBarcodeDb();
  if (!db) {
    return null;
  }
  const keys = barcodeKeys(code);
  if (!keys.length) {
    return null;
  }
  const marks = keys.map(() => "?").join(", ");
  const row = db
    .prepare(
      `SELECT code, name, kcal, protein, fat, carbs, pack_grams, pack_unit, source
       FROM barcodes WHERE code IN (${marks}) LIMIT 1`
    )
    .get(...keys);
  if (!row) {
    return null;
  }
  const source = row.source === "usda" ? "usda" : "off";
  const food = {
    id: `${source}-${row.code}`,
    name: row.name,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    kcal: row.kcal,
    source,
  };
  if (row.pack_grams) {
    food.packGrams = row.pack_grams;
    food.packUnit = row.pack_unit === "ml" ? "ml" : "g";
  }
  return food;
}

function translitFood(value) {
  let text = String(value || "").toLowerCase();
  if (!/[a-z]/.test(text)) {
    return text;
  }
  const pairs = [
    ["shch", "щ"],
    ["yo", "е"],
    ["zh", "ж"],
    ["kh", "х"],
    ["ts", "ц"],
    ["ch", "ч"],
    ["sh", "ш"],
    ["yu", "ю"],
    ["ya", "я"],
    ["ye", "е"],
  ];
  for (const [from, to] of pairs) {
    text = text.split(from).join(to);
  }
  text = text.replace(/y([aeiouаеёиоуыэюя])/g, "й$1").replace(/y/g, "ы");
  const letter = {
    a: "а", b: "б", c: "к", d: "д", e: "е", f: "ф", g: "г", h: "х", i: "и",
    j: "й", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "к", r: "р",
    s: "с", t: "т", u: "у", v: "в", w: "в", z: "з",
  };
  return text.replace(/[a-z]/g, (ch) => letter[ch] || ch);
}

const ESTIMATE_STOP = new Set([
  "свежий", "свежая", "свежее", "натуральный", "натуральное", "натуральная",
  "отборное", "отборный", "классический", "классическое", "домашний",
  "вареный", "вареная", "жареный", "жареная", "разных", "видов",
]);

function foldLoose(value) {
  return foldName(translitFood(value)).replace(/[ьъ]/g, "");
}

function tokenHit(hay, word) {
  const stem = word.length >= 6 ? word.slice(0, 5) : word;
  if (stem.length <= 4) {
    return new RegExp(`(?:^| )${stem}`).test(hay);
  }
  return hay.includes(stem);
}

function estimateFood(productName) {
  const hay = foldLoose(productName);
  if (hay.length < 3) {
    return null;
  }
  const hints = hay.match(/\d{1,2}/g) || [];
  let best = null;
  let bestRank = -1;
  for (const item of foodsFile.foods || []) {
    if (item.category === "quick") {
      continue;
    }
    const folded = foldLoose(item.name);
    const words = folded.split(" ").filter((word) => word.length >= 3 && !ESTIMATE_STOP.has(word));
    if (!words.length || !tokenHit(hay, words[0])) {
      continue;
    }
    let matched = 0;
    for (const word of words) {
      if (tokenHit(hay, word)) {
        matched += 1;
      }
    }
    if (!matched) {
      continue;
    }
    let rank = 12 + (matched - 1) * 10 - (words.length - matched);
    for (const token of hay.split(" ")) {
      if (token.length >= 4 && folded.includes(token.slice(0, 4))) {
        rank += 3;
      }
    }
    if (hints.length >= 2 && hints.every((hint) => new RegExp(`(?:^| )${hint}(?: |$)`).test(folded))) {
      rank += 8;
    }
    if (rank > bestRank) {
      bestRank = rank;
      best = item;
    }
  }
  if (!best || bestRank < 9) {
    return null;
  }
  return best;
}

function fillFromCatalog(food) {
  if (!food?.name) {
    return null;
  }
  if (hasMacros(food)) {
    return food;
  }
  const guess = estimateFood(food.name);
  if (!guess) {
    return null;
  }
  return {
    ...food,
    protein: guess.protein,
    fat: guess.fat,
    carbs: guess.carbs,
    kcal: Math.round(Number(guess.kcal) || 0),
    source: "guess",
  };
}

function borrowPackMacros(food) {
  if (!food?.name || hasMacros(food)) {
    return hasMacros(food) ? food : null;
  }
  const words = foldName(food.name).split(" ").filter((word) => word.length >= 4);
  if (!words.length) {
    return null;
  }
  const pack = searchPacks(food.name).find((item) => {
    if (!item.kcal) {
      return false;
    }
    const hay = foldName(item.name);
    return words.every((word) => hay.includes(word.slice(0, Math.min(5, word.length))));
  });
  if (!pack) {
    return null;
  }
  return {
    ...food,
    protein: pack.protein,
    fat: pack.fat,
    carbs: pack.carbs,
    kcal: pack.kcal,
    source: "guess",
  };
}

async function lookupBarcode(code) {
  const local = lookupLocalBarcode(code);
  if (hasMacros(local)) {
    return local;
  }
  const [world, ru, usda] = await Promise.all([
    offProduct("world.openfoodfacts.org", code),
    offProduct("ru.openfoodfacts.org", code),
    usdaSearch(code, { barcode: true }),
  ]);
  const live = ru || world || usda;
  if (hasMacros(live)) {
    return live;
  }
  const known = fillFromCatalog(local || live);
  if (known) {
    return known;
  }
  const listed = await lookupBarcodeList(code);
  if (!listed) {
    return null;
  }
  return fillFromCatalog(listed) || borrowPackMacros(listed) || listed;
}

function packStem(word) {
  if (word.length >= 5 && /[аеёиоуыэюя]$/.test(word)) {
    return word.slice(0, -1);
  }
  return word;
}

function packMatch(query) {
  const folded = foldName(query);
  const words = folded.split(" ").filter((word) => word.length >= 3).slice(0, 4);
  if (!words.length) {
    return "";
  }
  const terms = words.map((word) => `${packStem(word)}*`).join(" ");
  const extra = [];
  if (folded.includes("прингл")) {
    extra.push("pringles*");
  }
  if (folded.includes("лэйс") || folded.includes("лейс")) {
    extra.push("lays*");
  }
  if (folded.includes("доритос")) {
    extra.push("doritos*");
  }
  if (!extra.length) {
    return terms;
  }
  return `(${terms}) OR (${extra.join(" ")})`;
}

function searchPacks(query) {
  const db = openBarcodeDb();
  const match = packMatch(query);
  if (!db || !match) {
    return [];
  }
  let rows = [];
  try {
    rows = db.prepare(`
      SELECT b.code AS code, b.name AS name, b.kcal AS kcal, b.protein AS protein,
        b.fat AS fat, b.carbs AS carbs, b.pack_grams AS pack_grams,
        b.pack_unit AS pack_unit, b.source AS source
      FROM barcodes_fts
      JOIN barcodes AS b ON b.code = barcodes_fts.code
      WHERE barcodes_fts MATCH ?
        AND b.kcal > 0
      ORDER BY bm25(barcodes_fts)
      LIMIT 18
    `).all(match);
  } catch {
    return [];
  }
  return rows.map((row) => {
    const source = row.source === "usda" ? "usda" : "off";
    const food = {
      id: `${source}-${row.code}`,
      name: row.name,
      protein: row.protein,
      fat: row.fat,
      carbs: row.carbs,
      kcal: row.kcal,
      source,
    };
    if (row.pack_grams) {
      food.packGrams = row.pack_grams;
      food.packUnit = row.pack_unit === "ml" ? "ml" : "g";
    }
    return food;
  });
}

async function searchNutrition(query) {
  const q = String(query || "").trim().slice(0, 40);
  if (q.length < 2) {
    return [];
  }
  const packs = searchPacks(q);
  const [off, usda, listed] = await Promise.all([
    offSearch(q),
    usdaSearch(q),
    packs.length >= 8 ? Promise.resolve([]) : searchBarcodeList(q),
  ]);
  const named = listed
    .map((food) => fillFromCatalog(food) || borrowPackMacros(food) || food)
    .filter((food) => food?.name);
  return mergeFoods([searchLocal(q), packs, named, off, usda]).slice(0, 36);
}

openBarcodeDb();

module.exports = { lookupBarcode, searchNutrition, estimateFood };
