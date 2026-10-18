import { foldName } from "./foods";

const STOP = new Set([
  "не", "ем", "есть", "люблю", "нельзя", "можно", "без", "или", "ничего",
  "нет", "все", "всё", "собой", "просто", "очень", "вообще", "типа", "блюда",
]);

const GROUP_WORDS = {
  рыба: "fish",
  рыбу: "fish",
  рыбой: "fish",
  рыбное: "fish",
  морепродукты: "fish",
  мясо: "meat",
  мяса: "meat",
  мясное: "meat",
  орехи: "nuts",
  орех: "nuts",
  глютен: "gluten",
  глютена: "gluten",
  молочное: "dairy",
  лактоза: "dairy",
  лактозу: "dairy",
};

const ALIAS = {
  гречка: ["гречк"],
  гречневая: ["гречк"],
  гречневую: ["гречк"],
  картошка: ["картоф"],
  картошку: ["картоф"],
  картофель: ["картоф"],
  яйца: ["яйц"],
  яйцо: ["яйц"],
  курица: ["курин"],
  курицу: ["курин"],
  куриное: ["курин"],
  индейка: ["индейк"],
  индейку: ["индейк"],
  свинина: ["свин"],
  свинину: ["свин"],
  говядина: ["говяд"],
  говядину: ["говяд"],
  грибы: ["гриб", "шампин", "вешен", "опят", "лис"],
  гриб: ["гриб", "шампин", "вешен"],
  молоко: ["молок"],
  молоком: ["молок"],
  творог: ["творог", "творож", "сырник"],
  сыр: ["сыр"],
  сыры: ["сыр"],
  лук: ["лук"],
  чеснок: ["чеснок", "чесноч"],
  банан: ["банан"],
  бананы: ["банан"],
  помидор: ["помидор", "томат"],
  помидоры: ["помидор", "томат"],
  огурец: ["огурец", "огурц"],
  огурцы: ["огурец", "огурц"],
  капуста: ["капуст"],
  капусту: ["капуст"],
  рис: ["рис"],
  макароны: ["макарон", "паста"],
  паста: ["паста", "макарон"],
  хлеб: ["хлеб"],
  овсянка: ["овсин", "овсян"],
  овсянку: ["овсин", "овсян"],
};

const GROUP_TO_CATEGORIES = {
  fish: ["fish"],
  meat: ["meat", "sausage"],
  nuts: ["nuts"],
  dairy: ["dairy"],
  gluten: ["bread"],
};

export function parseFoodSkipList(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[,;\n]+/);
  const seen = new Set();
  const list = [];
  for (const item of raw) {
    const label = String(item || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
    const key = foldName(label);
    if (!label || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    list.push(label);
    if (list.length >= 12) {
      break;
    }
  }
  return list;
}

export function foodSkipLabel(value) {
  return parseFoodSkipList(value).join(" · ");
}

export function parseFoodSkip(value) {
  const tokens = [];
  const groups = new Set();
  for (const chip of parseFoodSkipList(value)) {
    for (const word of foldName(chip).split(" ").filter(Boolean)) {
      if (STOP.has(word) || word.length < 3) {
        continue;
      }
      if (GROUP_WORDS[word]) {
        groups.add(GROUP_WORDS[word]);
      }
      for (const extra of ALIAS[word] || [word]) {
        tokens.push(extra);
      }
    }
  }
  return { tokens: [...new Set(tokens)], groups };
}

function wordHits(folded, token) {
  if (!token || token.length < 3 || !folded) {
    return false;
  }
  const words = folded.split(" ").filter(Boolean);
  for (const word of words) {
    if (word === token) {
      return true;
    }
    if (word.startsWith(token)) {
      return true;
    }
    if (token.length >= 4 && word.length >= 4 && token.startsWith(word)) {
      return true;
    }
  }
  return false;
}

function ingredientHitsSkip(food, skip) {
  if (!food) {
    return false;
  }
  if (skip.groups.size) {
    for (const group of skip.groups) {
      const cats = GROUP_TO_CATEGORIES[group] || [];
      if (cats.includes(food.category)) {
        return true;
      }
    }
  }
  const folded = foldName(food.name);
  return skip.tokens.some((token) => wordHits(folded, token));
}

export function recipeHitsSkip(recipe, skip, foodById) {
  if (!skip || (!skip.tokens.length && !skip.groups.size)) {
    return false;
  }
  if (skip.groups.size && (recipe.avoid || []).some((tag) => skip.groups.has(tag))) {
    return true;
  }
  if (skip.tokens.some((token) => wordHits(foldName(recipe.title), token))) {
    return true;
  }
  for (const ing of recipe.ingredients || []) {
    if (ingredientHitsSkip(foodById(ing.foodId), skip)) {
      return true;
    }
  }
  return false;
}
