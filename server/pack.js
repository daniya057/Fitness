function round1(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

const UNIT =
  "(кг|kg|гр\\.?|grm|г|g|мл|ml|fl\\.?\\s*oz|oz|lb|л|l)";

function unitToPack(amount, unitRaw) {
  const unit = String(unitRaw || "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  let grams = amount;
  let kind = "g";
  if (unit === "кг" || unit === "kg") {
    grams = amount * 1000;
  } else if (unit === "л" || unit === "l") {
    grams = amount * 1000;
    kind = "ml";
  } else if (unit === "мл" || unit === "ml") {
    kind = "ml";
  } else if (unit === "floz") {
    grams = amount * 29.5735;
    kind = "ml";
  } else if (unit === "oz") {
    grams = amount * 28.3495;
  } else if (unit === "lb") {
    grams = amount * 453.592;
  }
  grams = Math.round(grams);
  if (grams < 1 || grams > 100000) {
    return null;
  }
  return { grams, unit: kind };
}

function parsePack(raw) {
  const text = String(raw || "")
    .toLowerCase()
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) {
    return null;
  }
  const multi = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*[xх×*]\\s*(\\d+(?:\\.\\d+)?)\\s*${UNIT}(?=$|[^a-zа-яё0-9])`, "i"));
  if (multi) {
    return unitToPack(Number(multi[1]) * Number(multi[2]), multi[3]);
  }
  const one = text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${UNIT}(?=$|[^a-zа-яё0-9])`, "i"));
  if (!one) {
    return null;
  }
  return unitToPack(Number(one[1]), one[2]);
}

function attachPack(food, quantity) {
  const pack = parsePack(quantity);
  if (!food || !pack) {
    return food;
  }
  food.packGrams = pack.grams;
  food.packUnit = pack.unit;
  return food;
}

module.exports = { round1, parsePack, attachPack };
