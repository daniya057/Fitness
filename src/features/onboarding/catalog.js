export const GOALS = [
  { id: "strength", title: "Силовые", hint: "Приседания, корпус" },
  { id: "run", title: "Бег", hint: "Лёгкий кардио" },
  { id: "nutrition", title: "Питание", hint: "Забота, не запреты" },
  { id: "walk", title: "Ходьба", hint: "Прогулки" },
  { id: "stretch", title: "Растяжка", hint: "Мягкая подвижность" },
  { id: "bike", title: "Вело", hint: "Крутить педали" },
];

export const GOAL_LABELS = Object.fromEntries(GOALS.map((item) => [item.id, item.title]));

export const DAILY_COPY = {
  strength: { title: "Задание дня", hint: "Силовая микро-сессия" },
  run: { title: "Задание дня", hint: "Лёгкий бег" },
  nutrition: { title: "Задание дня", hint: "Осознанный приём пищи" },
  walk: { title: "Задание дня", hint: "Тихая прогулка" },
  stretch: { title: "Задание дня", hint: "Растяжка на 2 мин" },
  bike: { title: "Задание дня", hint: "Короткая велосессия" },
};

export const MISSIONS_BY_GOAL = {
  strength: { id: "strength", title: "Силовая разминка", time: "8 мин", xp: 16 },
  run: { id: "run", title: "Лёгкий бег", time: "10 мин", xp: 18 },
  nutrition: { id: "nutrition", title: "Спокойный приём пищи", time: "15 мин", xp: 10 },
  walk: { id: "walk", title: "Тихая прогулка", time: "12 мин", xp: 14 },
  stretch: { id: "stretch", title: "Растяжка", time: "6 мин", xp: 12 },
  bike: { id: "bike", title: "Велосессия", time: "12 мин", xp: 16 },
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
