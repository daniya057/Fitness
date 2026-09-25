const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TABLE = path.join(__dirname, "food-table.txt");
const OUT = path.join(ROOT, "data", "content", "foods.json");

const CATEGORIES = [
  { id: "bread", title: "Хлеб и крупы", match: "хлебобулочные изделия, мука, крупы, бобовые" },
  { id: "dairy", title: "Молочные", match: "молочные продукты" },
  { id: "meat", title: "Мясо", match: "мясные продукты, птица" },
  { id: "sausage", title: "Колбасы", match: "колбасные изделия, мясные консервы" },
  { id: "fish", title: "Рыба", match: "рыба и морепродукты" },
  { id: "eggs", title: "Яйца", match: "яйцепродукты" },
  { id: "fats", title: "Масла", match: "масла, жиры и жировые продукты" },
  { id: "veg", title: "Овощи", match: "овощи, картофель, зелень, грибы, овощные консервы" },
  { id: "fruit", title: "Фрукты", match: "фрукты, ягоды, бахчевые" },
  { id: "nuts", title: "Орехи", match: "орехи, семена, сухофрукты" },
  { id: "sweet", title: "Сладкое", match: "сахар, сладкое и кондитерские изделия" },
  { id: "drinks", title: "Напитки", match: "соки, напитки безалкогольные" },
  { id: "alcohol", title: "Алкоголь", match: "напитки алкогольные" },
];

const SKIP_EXACT = new Set([
  "грибы",
  "овощные консервы",
  "рыба соленая, копченая, вяленая, икра",
  "консервы рыбные",
  "источники:",
]);

const TOKEN = /(?:следы|-|(?:\d+(?:[.,]\d+)?)(?:-(?:\d+(?:[.,]\d+)?))?)/g;

const RU = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function slugify(name) {
  return name
    .toLowerCase()
    .split("")
    .map((ch) => RU[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function parseToken(raw) {
  const token = String(raw).trim().toLowerCase().replace(/,/g, ".");
  if (!token || token === "-" || token === "следы") {
    return 0;
  }
  if (token.includes("-")) {
    const [left, right] = token.split("-").map(Number);
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      return 0;
    }
    return round1((left + right) / 2);
  }
  const num = Number(token);
  return Number.isFinite(num) ? round1(num) : 0;
}

function tokensFrom(line) {
  const found = [];
  const re = new RegExp(`(^|\\s)(${TOKEN.source})(?=\\s|$)`, "g");
  let match;
  while ((match = re.exec(line))) {
    const start = match.index + match[1].length;
    const prev = line[start - 1];
    const next = line[start + match[2].length];
    if (next === "%" || prev === ".") {
      continue;
    }
    found.push({ value: match[2], start });
  }
  return found;
}

function parseProductLine(line) {
  const tokens = tokensFrom(line);
  if (tokens.length < 3) {
    return null;
  }
  const take = tokens.length >= 4 ? tokens.slice(-4) : tokens.slice(-3);
  const name = line.slice(0, take[0].start).trim();
  if (!name || name.length < 2) {
    return null;
  }
  if (take.length === 3) {
    return {
      name,
      protein: parseToken(take[0].value),
      fat: parseToken(take[1].value),
      carbs: 0,
      kcal: parseToken(take[2].value),
    };
  }
  return {
    name,
    protein: parseToken(take[0].value),
    fat: parseToken(take[1].value),
    carbs: parseToken(take[2].value),
    kcal: parseToken(take[3].value),
  };
}

function sausageKind(name) {
  if (name.startsWith("Колбаса варено-копченая")) {
    return "Колбаса варено-копченая";
  }
  if (name.startsWith("Колбаса полукопченая")) {
    return "Колбаса полукопченая";
  }
  if (name.startsWith("Колбаса сырокопченая")) {
    return "Колбаса сырокопченая";
  }
  if (name.startsWith("Колбаса вареная")) {
    return "Колбаса вареная";
  }
  if (name.startsWith("Колбаса ливерная")) {
    return "Колбаса ливерная";
  }
  if (name.startsWith("Сосиски")) {
    return "Сосиски";
  }
  if (name.startsWith("Сардельки")) {
    return "Сардельки";
  }
  return null;
}

function tidyName(name) {
  return name
    .replace(/\s+/g, " ")
    .replace(/вареный(?=[а-я])/gi, "вареный ")
    .replace(/вареная(?=[а-я])/gi, "вареная ")
    .replace(/замороженная(?=[а-я])/gi, "замороженная ")
    .replace(/коллардс\(/gi, "коллардс (")
    .replace(/брокколизамороженная/gi, "брокколи замороженная")
    .replace(/Dr\.Körner/g, "Dr. Körner")
    .replace(/^>>\s*/, "")
    .trim();
}

function uniqueId(base, used) {
  let id = base || "food";
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

const raw = fs.readFileSync(TABLE, "utf8");
const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

let category = "bread";
let pending = "";
let kind = "";
const used = new Set();
const foods = [];

function pushFood(parsed, cat) {
  const name = tidyName(parsed.name);
  if (!name || /^продукты/i.test(name) || /энергия,\s*ккал/i.test(name) || name.length > 90) {
    return;
  }
  const nextKind = sausageKind(name);
  if (nextKind) {
    kind = nextKind;
  }
  foods.push({
    id: uniqueId(slugify(name), used),
    category: cat,
    name,
    protein: parsed.protein,
    fat: parsed.fat,
    carbs: parsed.carbs,
    kcal: parsed.kcal,
  });
}

for (const line of lines) {
  if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) {
    continue;
  }
  if (/^таблица калорийности/i.test(line) || /^калорийность пищевых/i.test(line)) {
    continue;
  }
  if (/^в 100 граммах/i.test(line) || /^продуктов учитывается/i.test(line)) {
    continue;
  }
  if (/^категории продуктов/i.test(line) || /^данные usda/i.test(line)) {
    continue;
  }
  if (/^"химический состав/i.test(line) || /^б\.\s*л\.\s*смолянский/i.test(line)) {
    continue;
  }
  if (/^продукты/i.test(line) && /белк/i.test(line)) {
    pending = "";
    continue;
  }

  const lower = line.toLowerCase().replace(/\s+/g, " ");
  const foundCat = CATEGORIES.find((item) => item.match === lower);
  if (foundCat) {
    category = foundCat.id;
    pending = "";
    continue;
  }
  if (SKIP_EXACT.has(lower)) {
    pending = "";
    continue;
  }

  const combined = pending ? `${pending} ${line}` : line;
  const parsed = parseProductLine(combined);
  if (!parsed) {
    pending = combined;
    continue;
  }
  pending = "";

  if (parsed.name.startsWith(">>")) {
    const rest = tidyName(parsed.name.replace(/^>>\s*/, ""));
    parsed.name = `${kind} ${rest}`.trim();
  }

  pushFood(parsed, category);
}

foods.push({
  id: uniqueId("voda-pitievaya", used),
  category: "drinks",
  name: "Вода питьевая",
  protein: 0,
  fat: 0,
  carbs: 0,
  kcal: 0,
});
foods.push({
  id: uniqueId("quick-snack", used),
  category: "quick",
  name: "Перекус",
  protein: 6,
  fat: 6,
  carbs: 18,
  kcal: 150,
});
foods.push({
  id: uniqueId("quick-lunch", used),
  category: "quick",
  name: "Обед",
  protein: 22,
  fat: 15,
  carbs: 45,
  kcal: 400,
});

const payload = {
  source: "Скурихин/Тутельян, 2002; Смолянский, 1984; USDA. Значения на 100 г съедобной части. Диапазоны — середина, прочерк — 0.",
  categories: CATEGORIES.map(({ id, title }) => ({ id, title })),
  foods,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Записано ${foods.length} продуктов в ${path.relative(ROOT, OUT)}`);
