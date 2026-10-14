export const MACRO_TONE = {
  protein: { label: "Б", ink: "#90CAF9", fill: "rgba(100,181,246,0.22)" },
  fat: { label: "Ж", ink: "#FFE082", fill: "rgba(255,213,79,0.22)" },
  carbs: { label: "У", ink: "#A5D6A7", fill: "rgba(129,199,132,0.22)" },
};

const CATEGORY_LOOK = {
  meals: { emoji: "🍲", tint: "rgba(255,183,77,0.22)" },
  bread: { emoji: "🍞", tint: "rgba(255,213,79,0.22)" },
  dairy: { emoji: "🥛", tint: "rgba(179,229,252,0.22)" },
  meat: { emoji: "🥩", tint: "rgba(239,154,154,0.22)" },
  sausage: { emoji: "🌭", tint: "rgba(255,171,145,0.22)" },
  fish: { emoji: "🐟", tint: "rgba(128,222,234,0.22)" },
  eggs: { emoji: "🥚", tint: "rgba(255,245,157,0.22)" },
  fats: { emoji: "🧈", tint: "rgba(255,224,130,0.22)" },
  veg: { emoji: "🥕", tint: "rgba(165,214,167,0.22)" },
  fruit: { emoji: "🍎", tint: "rgba(239,154,154,0.22)" },
  nuts: { emoji: "🥜", tint: "rgba(188,170,164,0.28)" },
  sweet: { emoji: "🍪", tint: "rgba(255,204,128,0.22)" },
  drinks: { emoji: "☕", tint: "rgba(188,170,164,0.28)" },
  alcohol: { emoji: "🍷", tint: "rgba(206,147,216,0.22)" },
};

export function lookOfFood(food) {
  const id = food?.category && CATEGORY_LOOK[food.category] ? food.category : "meals";
  return CATEGORY_LOOK[id];
}
