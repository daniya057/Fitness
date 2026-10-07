const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TABLE = path.join(__dirname, "food-table.txt");
const OUT = path.join(ROOT, "data", "content", "foods.json");

const CATEGORIES = [
  { id: "meals", title: "Блюда", match: "" },
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

function isPantry(name) {
  const n = name.toLowerCase();
  if (/^мука(?:\s|$)/.test(n) || /^крахмал/.test(n)) {
    return true;
  }
  if (/какао-порошок|яичный порошок|^меланж$|^жир |спирт этиловый/.test(n)) {
    return true;
  }
  if (/макарон/.test(n) && !/варен/.test(n)) {
    return true;
  }
  if (/^рис /.test(n) && !/варен/.test(n)) {
    return true;
  }
  if (
    (/крупа|продел|толокно|зерно продовольственное|манная крупа$|кукурузная крупа|перловая крупа$|ячневая крупа$/.test(n) ||
      n === "пшено") &&
    !/варен|каша/.test(n)
  ) {
    return true;
  }
  if (
    /^(горох зерно|горох целый|горох колотый|маш|нут|соя зерно|соевые бобы|фасоль обыкновенная|чечевица|амарант крупа|киноа крупа)/.test(
      n
    ) &&
    !/варен/.test(n)
  ) {
    return true;
  }
  if (/сушен/.test(n) && /гриб|ламинар|спирулин|подберезов|подосинов|шиповник/.test(n)) {
    return true;
  }
  if (/семена конопли неочищенные/.test(n)) {
    return true;
  }
  return false;
}

function pushFood(parsed, cat) {
  const name = tidyName(parsed.name);
  if (!name || /^продукты/i.test(name) || /энергия,\s*ккал/i.test(name) || name.length > 90 || isPantry(name)) {
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

const DISHES = [
  ["Борщ", 1.6, 2, 5.7, 49],
  ["Щи", 1.2, 1.7, 2.8, 32],
  ["Куриный суп с лапшой", 2.5, 1.3, 4, 38],
  ["Солянка мясная", 5.2, 4.6, 1.7, 69],
  ["Окрошка на кефире", 2.6, 1.9, 4.5, 47],
  ["Суп-пюре из тыквы", 1.2, 2, 5.5, 45],
  ["Харчо", 4.2, 3.4, 4.8, 67],
  ["Плов с курицей", 9, 8, 20, 188],
  ["Гречка с курицей", 11, 4.5, 14, 141],
  ["Рис с овощами", 2.5, 2, 22, 116],
  ["Макароны по-флотски", 9, 8, 18, 180],
  ["Паста с томатным соусом", 5, 4, 20, 136],
  ["Паста карбонара", 10, 12, 16, 212],
  ["Лазанья", 10, 9, 13, 173],
  ["Пельмени отварные", 11.9, 12.4, 29, 275],
  ["Вареники с картошкой", 4.4, 3.7, 22, 140],
  ["Вареники с творогом", 11, 6, 24, 194],
  ["Котлета куриная", 18, 12, 8, 212],
  ["Котлета говяжья", 15, 13, 10, 217],
  ["Тефтели в томатном соусе", 10, 8, 8, 144],
  ["Гуляш", 12, 9, 4, 145],
  ["Голубцы", 6.5, 6, 8, 112],
  ["Фаршированный перец", 6, 6, 8.5, 112],
  ["Куриная грудка запечённая", 31, 3.6, 0, 157],
  ["Стейк из говядины", 26, 15, 0, 239],
  ["Рыба запечённая", 19, 4, 0, 112],
  ["Омлет", 9.9, 15.4, 1.9, 186],
  ["Яичница", 12.5, 14, 0.6, 179],
  ["Сырники", 18, 8, 18, 216],
  ["Творожная запеканка", 16, 6, 14, 174],
  ["Блины", 6.1, 8, 32, 224],
  ["Оладьи", 6, 8, 30, 216],
  ["Пюре картофельное", 2.1, 3.3, 13.5, 92],
  ["Картофель жареный", 2.8, 9.5, 23.4, 192],
  ["Картофель фри", 3.4, 15, 41, 312],
  ["Овощное рагу", 1.6, 3, 7.5, 64],
  ["Салат оливье", 5.5, 16, 7, 195],
  ["Салат цезарь с курицей", 11, 11, 5, 163],
  ["Винегрет", 1.6, 4, 8, 75],
  ["Греческий салат", 3, 8, 4, 100],
  ["Сельдь под шубой", 5, 15, 8, 187],
  ["Пицца маргарита", 9, 9, 28, 229],
  ["Шаурма с курицей", 11, 10, 18, 206],
  ["Хот-дог", 10, 15, 20, 255],
  ["Роллы с лососем", 8, 6, 20, 166],
  ["Куриные наггетсы", 15, 14, 16, 250],
];

for (const [name, protein, fat, carbs, kcal] of DISHES) {
  foods.push({
    id: uniqueId(slugify(name), used),
    category: "meals",
    name,
    protein,
    fat,
    carbs,
    kcal,
  });
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
