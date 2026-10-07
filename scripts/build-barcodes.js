const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { execFileSync } = require("child_process");
const { Readable, Transform } = require("stream");
const { pipeline } = require("stream/promises");
const { DatabaseSync } = require("node:sqlite");
const { parsePack } = require("../server/pack");

const ROOT = path.join(__dirname, "..");
const CACHE = path.join(ROOT, "data", "cache");
const BUILD_FILE = path.join(ROOT, "data", "content", "barcodes.build.sqlite");
const FINAL_FILE = path.join(ROOT, "data", "content", "barcodes.sqlite");
const OFF_URL = "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz";
const OFF_FILE = path.join(CACHE, "off-products.csv.gz");
const USDA_ZIP = path.join(CACHE, "usda-branded.zip");
const USDA_DIR = path.join(CACHE, "usda");

function round1(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

function splitQuoted(line, delimiter) {
  const out = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(field);
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

async function download(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1024 * 1024) {
    console.log(`Уже скачано: ${path.basename(dest)}`);
    return;
  }
  const tmp = `${dest}.part`;
  if (fs.existsSync(tmp)) {
    fs.unlinkSync(tmp);
  }
  console.log(`Качаю ${url}`);
  const response = await fetch(url, {
    headers: { "User-Agent": "FitnessApp/1.0 (fit-project; barcode-build)" },
    redirect: "follow",
  });
  if (!response.ok || !response.body) {
    throw new Error(`Не скачалось ${response.status} ${url}`);
  }
  const total = Number(response.headers.get("content-length")) || 0;
  let got = 0;
  let mark = 0;
  const out = fs.createWriteStream(tmp);
  const counter = new Transform({
    transform(chunk, _enc, done) {
      got += chunk.length;
      if (got - mark >= 50 * 1024 * 1024) {
        mark = got;
        const pct = total ? ` ${Math.round((got / total) * 100)}%` : "";
        console.log(`  ${Math.round(got / (1024 * 1024))} МБ${pct}`);
      }
      done(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body), counter, out);
  fs.renameSync(tmp, dest);
  console.log(`Готово: ${path.basename(dest)}`);
}

async function forEachRow(file, onRow, onHeader) {
  const input = fs.createReadStream(file);
  const source = file.endsWith(".gz") ? input.pipe(zlib.createGunzip()) : input;
  const rl = readline.createInterface({ input: source, crlfDelay: Infinity });
  let header = null;
  let delimiter = "\t";
  let seen = 0;
  for await (const line of rl) {
    if (!header) {
      const clean = line.replace(/^\uFEFF/, "");
      delimiter = clean.includes("\t") ? "\t" : ",";
      header = splitQuoted(clean, delimiter);
      if (onHeader) {
        onHeader(header);
      }
      continue;
    }
    if (!line) {
      continue;
    }
    seen += 1;
    const cells = splitQuoted(line, delimiter);
    if (cells.length < Math.min(header.length, 8)) {
      continue;
    }
    const row = {};
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = cells[i] || "";
    }
    onRow(row, seen);
  }
}

function eanOk(code) {
  if (![8, 12, 13, 14].includes(code.length)) {
    return false;
  }
  const digits = [...code].map(Number);
  const check = digits.pop();
  let sum = 0;
  digits.reverse().forEach((digit, index) => {
    sum += digit * (index % 2 === 0 ? 3 : 1);
  });
  return (10 - (sum % 10)) % 10 === check;
}

function soldInRussia(row, code) {
  if (/^46[0-9]/.test(code)) {
    return true;
  }
  const countries = `${row.countries || ""} ${row.countries_tags || ""}`.toLowerCase();
  return /росси|russia/.test(countries);
}

function saneMacros(kcal, protein, fat, carbs) {
  if (kcal > 950 || protein > 100 || fat > 100 || carbs > 100) {
    return false;
  }
  return Boolean(kcal || protein || fat || carbs);
}

function offFood(row) {
  const code = String(row.code || "").replace(/\D/g, "");
  if (code.length < 8 || code.length > 14) {
    return null;
  }
  const name = String(row.product_name_ru || row.product_name || row.generic_name || "")
    .trim()
    .slice(0, 80);
  if (name.length < 2 || /^\d+$/.test(name)) {
    return null;
  }
  let kcal = Number(row["energy-kcal_100g"]);
  if (!Number.isFinite(kcal) || kcal <= 0) {
    const kj = Number(row.energy_100g);
    kcal = Number.isFinite(kj) && kj > 0 ? kj / 4.184 : 0;
  }
  let protein = round1(row.proteins_100g);
  let fat = round1(row.fat_100g);
  let carbs = round1(row.carbohydrates_100g);
  if (!kcal && (protein || fat || carbs)) {
    kcal = 4 * protein + 9 * fat + 4 * carbs;
  }
  kcal = Math.round(kcal) || 0;
  if (!saneMacros(kcal, protein, fat, carbs)) {
    if (!soldInRussia(row, code)) {
      return null;
    }
    kcal = 0;
    protein = 0;
    fat = 0;
    carbs = 0;
  }
  const pack = parsePack(row.quantity) || parsePack(row.product_quantity);
  return {
    code,
    name,
    kcal,
    protein,
    fat,
    carbs,
    packGrams: pack ? pack.grams : null,
    packUnit: pack ? pack.unit : null,
  };
}

function openBuildDb() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = BUILD_FILE + suffix;
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
  const db = new DatabaseSync(BUILD_FILE);
  db.exec(`
    PRAGMA journal_mode = OFF;
    PRAGMA synchronous = OFF;
    PRAGMA temp_store = MEMORY;
    PRAGMA cache_size = -200000;
    CREATE TABLE barcodes (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kcal INTEGER NOT NULL,
      protein REAL NOT NULL,
      fat REAL NOT NULL,
      carbs REAL NOT NULL,
      pack_grams INTEGER,
      pack_unit TEXT,
      source TEXT NOT NULL
    );
  `);
  return db;
}

function makeInserter(db) {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO barcodes
      (code, name, kcal, protein, fat, carbs, pack_grams, pack_unit, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  let pending = 0;
  db.exec("BEGIN");
  return {
    add(food, source) {
      insert.run(
        food.code,
        food.name,
        food.kcal,
        food.protein,
        food.fat,
        food.carbs,
        food.packGrams,
        food.packUnit,
        source
      );
      pending += 1;
      if (pending >= 5000) {
        db.exec("COMMIT");
        db.exec("BEGIN");
        pending = 0;
      }
    },
    flush() {
      db.exec("COMMIT");
      pending = 0;
    },
  };
}

async function importMissing(db) {
  const exists = db.prepare("SELECT 1 AS ok FROM barcodes WHERE code = ?");
  const batch = makeInserter(db);
  let kept = 0;
  console.log("Добавляю российские пачки без КБЖУ…");
  await forEachRow(OFF_FILE, (row, seen) => {
    const food = offFood(row);
    if (!food || food.kcal || food.protein || food.fat || food.carbs) {
      return;
    }
    if (!eanOk(food.code) || exists.get(food.code)) {
      return;
    }
    batch.add(food, "off");
    kept += 1;
    if (kept % 5000 === 0) {
      console.log(`  без КБЖУ ${kept}`);
    }
    if (seen % 1000000 === 0) {
      console.log(`  строки ${seen}`);
    }
  });
  batch.flush();
  console.log(`Добавлено пачек без КБЖУ: ${kept}`);
}

async function importOff(db) {
  await download(OFF_URL, OFF_FILE);
  const batch = makeInserter(db);
  let kept = 0;
  console.log("Разбираю Open Food Facts…");
  await forEachRow(OFF_FILE, (row, seen) => {
    const food = offFood(row);
    if (food) {
      batch.add(food, "off");
      kept += 1;
    }
    if (seen % 500000 === 0) {
      console.log(`  OFF строки ${seen}, в базе ${kept}`);
    }
  }, (header) => {
    console.log(header.includes("energy-kcal_100g") ? "Колонка ккал на месте" : `Колонки: ${header.slice(0, 12).join(", ")}`);
  });
  batch.flush();
  console.log(`Open Food Facts: ${kept} штрихкодов`);
}

async function findUsdaUrl() {
  try {
    const response = await fetch("https://fdc.nal.usda.gov/download-datasets/", {
      headers: { "User-Agent": "FitnessApp/1.0 (fit-project; barcode-build)" },
    });
    const html = await response.text();
    const links = [...html.matchAll(/href="([^"]*branded_food_csv_[^"]+\.zip)"/gi)].map((match) => {
      const href = match[1];
      return href.startsWith("http") ? href : new URL(href, "https://fdc.nal.usda.gov").href;
    });
    if (links.length) {
      return links[0];
    }
  } catch (error) {
    console.log(`Страница USDA недоступна: ${error.message}`);
  }
  const guesses = [
    "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2026-04-30.zip",
    "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2026-04-23.zip",
    "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2025-12-18.zip",
  ];
  for (const url of guesses) {
    try {
      const head = await fetch(url, { method: "HEAD" });
      if (head.ok) {
        return url;
      }
    } catch {
      // следующий адрес
    }
  }
  return "";
}

function extractUsda(zipPath) {
  fs.mkdirSync(USDA_DIR, { recursive: true });
  const listing = execFileSync("tar", ["-tf", zipPath], { encoding: "utf8" });
  const wanted = ["branded_food.csv", "food.csv", "food_nutrient.csv"];
  const baseName = (line) => line.split(/[/\\]/).pop();
  const paths = listing
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => wanted.includes(baseName(line)));
  const pick = {};
  for (const name of wanted) {
    const hit = paths.find((line) => baseName(line) === name);
    if (!hit) {
      throw new Error(`В архиве USDA нет ${name}`);
    }
    pick[name] = hit;
  }
  execFileSync("tar", ["-xf", zipPath, "-C", USDA_DIR, pick["branded_food.csv"], pick["food.csv"], pick["food_nutrient.csv"]], {
    stdio: "inherit",
  });
  const found = {};
  const stack = [USDA_DIR];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        stack.push(full);
      } else if (wanted.includes(name)) {
        found[name] = full;
      }
    }
  }
  return found;
}

async function importUsda(db) {
  const url = await findUsdaUrl();
  if (!url) {
    console.log("Архив USDA не найден. Остаётся живой запрос USDA.");
    return;
  }
  await download(url, USDA_ZIP);
  console.log("Распаковываю USDA…");
  const files = extractUsda(USDA_ZIP);
  db.exec(`
    CREATE TABLE usda_food (
      fdc_id INTEGER PRIMARY KEY,
      gtin TEXT NOT NULL,
      name TEXT,
      package_weight TEXT
    );
    CREATE TABLE usda_nut (
      fdc_id INTEGER NOT NULL,
      nutrient_id INTEGER NOT NULL,
      amount REAL NOT NULL
    );
  `);
  const insertFood = db.prepare(
    "INSERT OR IGNORE INTO usda_food (fdc_id, gtin, name, package_weight) VALUES (?, ?, ?, ?)"
  );
  db.exec("BEGIN");
  let foods = 0;
  await forEachRow(files["branded_food.csv"], (row, seen) => {
    const gtin = String(row.gtin_upc || "").replace(/\D/g, "");
    const fdcId = Number(row.fdc_id);
    if (!gtin || gtin.length < 8 || gtin.length > 14 || !fdcId) {
      return;
    }
    const name = String(row.short_description || row.brand_name || "").trim().slice(0, 80);
    insertFood.run(fdcId, gtin, name, String(row.package_weight || "").slice(0, 80));
    foods += 1;
    if (seen % 500000 === 0) {
      console.log(`  USDA пачки ${seen}`);
    }
  });
  db.exec("COMMIT");
  const updateName = db.prepare("UPDATE usda_food SET name = ? WHERE fdc_id = ?");
  db.exec("BEGIN");
  await forEachRow(files["food.csv"], (row) => {
    const fdcId = Number(row.fdc_id);
    const name = String(row.description || "").trim().slice(0, 80);
    if (fdcId && name) {
      updateName.run(name, fdcId);
    }
  });
  db.exec("COMMIT");
  const insertNut = db.prepare("INSERT INTO usda_nut (fdc_id, nutrient_id, amount) VALUES (?, ?, ?)");
  const keep = new Set([1003, 1004, 1005, 1008, 2047, 2048]);
  db.exec("BEGIN");
  let nuts = 0;
  await forEachRow(files["food_nutrient.csv"], (row, seen) => {
    const nutrientId = Number(row.nutrient_id);
    if (!keep.has(nutrientId)) {
      return;
    }
    const amount = Number(row.amount);
    const fdcId = Number(row.fdc_id);
    if (!fdcId || !Number.isFinite(amount)) {
      return;
    }
    insertNut.run(fdcId, nutrientId, amount);
    nuts += 1;
    if (seen % 2000000 === 0) {
      console.log(`  USDA нутриенты, строки ${seen}`);
    }
  });
  db.exec("COMMIT");
  console.log(`USDA продукты ${foods}, строки нутриентов ${nuts}`);
  db.exec("CREATE INDEX usda_nut_fdc ON usda_nut(fdc_id)");
  const query = db.prepare(`
    SELECT f.gtin AS code, f.name AS name, f.package_weight AS package_weight,
      MAX(CASE WHEN n.nutrient_id = 1008 THEN n.amount END) AS kcal,
      MAX(CASE WHEN n.nutrient_id = 2047 THEN n.amount END) AS kcal_atwater,
      MAX(CASE WHEN n.nutrient_id = 2048 THEN n.amount END) AS kcal_specific,
      MAX(CASE WHEN n.nutrient_id = 1003 THEN n.amount END) AS protein,
      MAX(CASE WHEN n.nutrient_id = 1004 THEN n.amount END) AS fat,
      MAX(CASE WHEN n.nutrient_id = 1005 THEN n.amount END) AS carbs
    FROM usda_food f
    JOIN usda_nut n ON n.fdc_id = f.fdc_id
    GROUP BY f.fdc_id
  `);
  const batch = makeInserter(db);
  let kept = 0;
  for (const row of query.iterate()) {
    const name = String(row.name || "").trim().slice(0, 80);
    if (!name) {
      continue;
    }
    let kcal = Number(row.kcal);
    if (!Number.isFinite(kcal) || kcal <= 0) {
      kcal = Number(row.kcal_atwater);
    }
    if (!Number.isFinite(kcal) || kcal <= 0) {
      kcal = Number(row.kcal_specific);
    }
    const protein = round1(row.protein);
    const fat = round1(row.fat);
    const carbs = round1(row.carbs);
    if (!Number.isFinite(kcal) || kcal <= 0) {
      kcal = protein || fat || carbs ? 4 * protein + 9 * fat + 4 * carbs : 0;
    }
    kcal = Math.round(kcal) || 0;
    if (!saneMacros(kcal, protein, fat, carbs)) {
      continue;
    }
    const pack = parsePack(row.package_weight);
    batch.add(
      {
        code: String(row.code),
        name,
        kcal,
        protein,
        fat,
        carbs,
        packGrams: pack ? pack.grams : null,
        packUnit: pack ? pack.unit : null,
      },
      "usda"
    );
    kept += 1;
  }
  batch.flush();
    db.exec("DROP TABLE IF EXISTS usda_food; DROP TABLE IF EXISTS usda_nut;");
    console.log(`USDA: ${kept} новых штрихкодов`);
  }

async function finishUsda(db) {
  try {
    await importUsda(db);
  } catch (error) {
    console.log(`USDA пропущен: ${error.message}`);
    try {
      db.exec("DROP TABLE IF EXISTS usda_food; DROP TABLE IF EXISTS usda_nut;");
    } catch {
      // временных таблиц могло не быть
    }
  }
  try {
    db.exec("COMMIT");
  } catch {
    try {
      db.exec("ROLLBACK");
    } catch {
      // транзакции нет
    }
  }
  console.log("Уплотняю базу…");
  db.exec("VACUUM");
  const count = db.prepare("SELECT COUNT(*) AS n FROM barcodes").get();
  console.log(`Всего штрихкодов: ${count?.n || 0}`);
  buildPackIndex(db);
  db.close();
}

function buildPackIndex(db) {
  const has = db.prepare(
    "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'barcodes_fts'"
  ).get();
  if (has) {
    console.log("Индекс названий уже есть");
    return;
  }
  console.log("Индекс названий пачек…");
  db.exec(`
    CREATE VIRTUAL TABLE barcodes_fts USING fts5(
      name,
      code UNINDEXED,
      tokenize = 'unicode61 remove_diacritics 0'
    );
  `);
  const insert = db.prepare("INSERT INTO barcodes_fts(name, code) VALUES (?, ?)");
  db.exec("BEGIN");
  let n = 0;
  for (const row of db.prepare("SELECT name, code FROM barcodes").iterate()) {
    insert.run(row.name, row.code);
    n += 1;
    if (n % 400000 === 0) {
      console.log(`  названия ${n}`);
    }
  }
  db.exec("COMMIT");
  console.log(`Индекс названий: ${n}`);
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(path.dirname(FINAL_FILE), { recursive: true });
  if (process.argv.includes("--fts")) {
    if (!fs.existsSync(FINAL_FILE)) {
      throw new Error("Нет data/content/barcodes.sqlite");
    }
    const db = new DatabaseSync(FINAL_FILE);
    db.exec("PRAGMA busy_timeout = 8000");
    buildPackIndex(db);
    db.close();
    return;
  }
  if (process.argv.includes("--missing")) {
    if (!fs.existsSync(FINAL_FILE)) {
      throw new Error("Нет data/content/barcodes.sqlite");
    }
    if (!fs.existsSync(OFF_FILE)) {
      await download(OFF_URL, OFF_FILE);
    }
    const db = new DatabaseSync(FINAL_FILE);
    db.exec("PRAGMA busy_timeout = 8000");
    await importMissing(db);
    const count = db.prepare("SELECT COUNT(*) AS n FROM barcodes").get();
    console.log(`Всего штрихкодов: ${count?.n || 0}`);
    db.close();
    return;
  }
  if (process.argv.includes("--usda")) {
    if (!fs.existsSync(FINAL_FILE)) {
      throw new Error("Нет data/content/barcodes.sqlite");
    }
    const db = new DatabaseSync(FINAL_FILE);
    db.exec(`
      PRAGMA journal_mode = OFF;
      PRAGMA synchronous = OFF;
      PRAGMA temp_store = MEMORY;
      PRAGMA cache_size = -200000;
    `);
    await finishUsda(db);
    return;
  }
  const db = openBuildDb();
  try {
    await importOff(db);
    await finishUsda(db);
    if (fs.existsSync(FINAL_FILE)) {
      fs.unlinkSync(FINAL_FILE);
    }
    fs.renameSync(BUILD_FILE, FINAL_FILE);
    console.log(`База: ${FINAL_FILE}`);
  } catch (error) {
    try {
      db.close();
    } catch {
      // файл сборки можно удалить следующим запуском
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
