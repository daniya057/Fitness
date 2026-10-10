export const SEX_OPTIONS = [
  { id: "male", title: "м" },
  { id: "female", title: "ж" },
];

export const SEX_LABELS = { male: "м", female: "ж" };

export const GOALS = [
  { id: "strength", title: "Силовые" },
  { id: "run", title: "Бег" },
  { id: "nutrition", title: "Питание" },
  { id: "walk", title: "Ходьба" },
  { id: "stretch", title: "Растяжка" },
  { id: "bike", title: "Вело" },
];

export const GOAL_LABELS = Object.fromEntries(GOALS.map((item) => [item.id, item.title]));

export const EXPERIENCE = [
  { id: "none", title: "Не занимаюсь", hint: "0" },
  { id: "m1_3", title: "Только начал", hint: "1–3 месяца" },
  { id: "m3_6", title: "3–6 месяцев", hint: "" },
  { id: "m6_12", title: "6 месяцев — год", hint: "" },
  { id: "y1", title: "Больше года", hint: "" },
];

export const EXPERIENCE_LABELS = Object.fromEntries(
  EXPERIENCE.map((item) => [item.id, item.hint ? `${item.title}, ${item.hint}` : item.title])
);

export const DAILY_COPY = {
  strength: { title: "Задание дня", hint: "Силовая" },
  run: { title: "Задание дня", hint: "Бег" },
  nutrition: { title: "Задание дня", hint: "Еда" },
  walk: { title: "Задание дня", hint: "Прогулка" },
  stretch: { title: "Задание дня", hint: "Растяжка" },
  bike: { title: "Задание дня", hint: "Вело" },
};

export const MISSIONS_BY_GOAL = {
  strength: { id: "strength", title: "Силовая", time: "8 мин" },
  run: { id: "run", title: "Бег", time: "10 мин" },
  nutrition: { id: "nutrition", title: "Еда", time: "15 мин" },
  walk: { id: "walk", title: "Прогулка", time: "12 мин" },
  stretch: { id: "stretch", title: "Растяжка", time: "6 мин" },
  bike: { id: "bike", title: "Вело", time: "12 мин" },
};

export function ageFromBirthDate(iso) {
  if (!iso) {
    return null;
  }
  const birth = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
