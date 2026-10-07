const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { parsePack } = require("./pack");

const CACHE_FILE = path.join(__dirname, "..", "data", "cache", "barcode-list.sqlite");
const LOOKUP_URL = "https://barcode-list.ru/barcode/RU/%D0%9F%D0%BE%D0%B8%D1%81%D0%BA.htm?barcode=";
const MISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let cacheDb = null;

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function openCache() {
  if (cacheDb) {
    return cacheDb;
  }
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  cacheDb = new DatabaseSync(CACHE_FILE);
  cacheDb.exec(`
    CREATE TABLE IF NOT EXISTS hits (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );
  `);
  return cacheDb;
}

function remember(code, name) {
  openCache()
    .prepare(
      `INSERT INTO hits (code, name, fetched_at) VALUES (?, ?, ?)
       ON CONFLICT(code) DO UPDATE SET name = excluded.name, fetched_at = excluded.fetched_at`
    )
    .run(code, name || "", Date.now());
}

function cached(code) {
  const row = openCache().prepare("SELECT name, fetched_at FROM hits WHERE code = ?").get(code);
  if (!row) {
    return undefined;
  }
  if (!row.name && Date.now() - row.fetched_at > MISS_TTL_MS) {
    return undefined;
  }
  return row.name || null;
}

async function fetchHtml(url, maxBytes) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "User-Agent": "FitnessApp/1.0 (fit-project; barcode-lookup)",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!response.ok || !response.body) {
      return "";
    }
    const reader = response.body.getReader();
    const chunks = [];
    let got = 0;
    while (got < maxBytes) {
      const step = await reader.read();
      if (step.done) {
        break;
      }
      chunks.push(Buffer.from(step.value));
      got += step.value.length;
    }
    try {
      await reader.cancel();
    } catch {
      // тело уже закрыто
    }
    return Buffer.concat(chunks).toString("utf8");
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function titleName(html, code) {
  const title = html.match(/<title>([^<]+)<\/title>/i);
  if (!title) {
    return "";
  }
  const text = decodeHtml(title[1]);
  const parts = text.split(/\s+-\s*Штрих-код\s*:/i);
  if (parts.length < 2 || !text.includes(code)) {
    return "";
  }
  const name = parts[0].trim();
  if (!name || /^поиск\b/i.test(name)) {
    return "";
  }
  return name.slice(0, 80);
}

function parseRows(html) {
  const rows = [];
  const re =
    /<td[^>]*>\s*(?:<a[^>]*>)?(\d{8,14})(?:<\/a>)?\s*<\/td>\s*<td[^>]*>\s*([^<]+?)\s*<\/td>/gi;
  let match = re.exec(html);
  while (match && rows.length < 12) {
    const name = decodeHtml(match[2]).slice(0, 80);
    if (name && !/^\d+$/.test(name)) {
      rows.push({ code: match[1], name });
    }
    match = re.exec(html);
  }
  return rows;
}

function asFood(code, name) {
  const food = {
    id: `list-${code}`,
    name: name.slice(0, 80),
    protein: 0,
    fat: 0,
    carbs: 0,
    kcal: 0,
    source: "list",
  };
  const pack = parsePack(name);
  if (pack) {
    food.packGrams = pack.grams;
    food.packUnit = pack.unit;
  }
  return food;
}

async function lookupBarcodeList(code) {
  const digits = String(code || "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) {
    return null;
  }
  const known = cached(digits);
  if (known === null) {
    return null;
  }
  if (known) {
    return asFood(digits, known);
  }
  const html = await fetchHtml(`${LOOKUP_URL}${encodeURIComponent(digits)}`, 120000);
  if (!html) {
    return null;
  }
  const name = titleName(html, digits) || parseRows(html).find((row) => row.code === digits)?.name || "";
  remember(digits, name);
  return name ? asFood(digits, name) : null;
}

async function searchBarcodeList(query) {
  const q = String(query || "").trim().slice(0, 40);
  if (q.length < 3 || /^\d+$/.test(q)) {
    return [];
  }
  const html = await fetchHtml(`${LOOKUP_URL}${encodeURIComponent(q)}`, 70000);
  if (!html) {
    return [];
  }
  const rows = parseRows(html);
  for (const row of rows) {
    remember(row.code, row.name);
  }
  return rows.map((row) => asFood(row.code, row.name));
}

module.exports = { lookupBarcodeList, searchBarcodeList };
