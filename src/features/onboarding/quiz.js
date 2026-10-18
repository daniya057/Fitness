import { parseFoodSkipList } from "../calories/foodSkip";

export const PLACE_OPTIONS = [
  { id: "home", title: "Дома без ничего" },
  { id: "homeGear", title: "Дома с гантелями" },
  { id: "gym", title: "Зал" },
  { id: "anywhere", title: "Везде" },
];

export const TIME_OPTIONS = [
  { id: "30", title: "30 мин" },
  { id: "60", title: "1 час" },
  { id: "90", title: "1,5 часа" },
  { id: "120", title: "2 часа" },
];

export const PAIN_OPTIONS = [
  { id: "knees", title: "Колени" },
  { id: "back", title: "Спина" },
  { id: "lumbar", title: "Поясница" },
  { id: "shoulders", title: "Плечи" },
  { id: "wrists", title: "Запястья" },
  { id: "neck", title: "Шея" },
];

export const DIET_OPTIONS = [
  { id: "all", title: "Всё ем" },
  { id: "noMeat", title: "Не ем мясо" },
  { id: "noFish", title: "Не ем рыбу" },
  { id: "noDairy", title: "Без лактозы" },
  { id: "noGluten", title: "Без глютена" },
  { id: "noNuts", title: "Без орехов" },
];

export const MEAL_OPTIONS = [
  { id: "2", title: "2 раза" },
  { id: "3", title: "3 раза" },
  { id: "4", title: "4 раза" },
  { id: "5", title: "5+" },
  { id: "varies", title: "По-разному" },
];

export const FOCUS_OPTIONS = [
  { id: "habit", title: "Привычка двигаться" },
  { id: "loss", title: "Похудеть" },
  { id: "strength", title: "Форма и сила" },
  { id: "energy", title: "Больше энергии" },
  { id: "posture", title: "Спина и осанка" },
];

export const ENERGY_OPTIONS = [
  { id: "low", title: "Мало" },
  { id: "ok", title: "Нормально" },
  { id: "high", title: "Много" },
];

export const SLEEP_OPTIONS = [
  { id: "bad", title: "Плохо" },
  { id: "ok", title: "Нормально" },
  { id: "good", title: "Хорошо" },
];

export const DAY_TIME_OPTIONS = [
  { id: "30", title: "30 мин" },
  { id: "60", title: "1 час" },
  { id: "90", title: "1,5 часа" },
  { id: "120", title: "2 часа" },
];

export const FEEL_OPTIONS = [
  { id: "easy", title: "Легко" },
  { id: "ok", title: "В самый раз" },
  { id: "hard", title: "Тяжеловато" },
  { id: "veryHard", title: "Очень тяжело" },
];

export const WEEK_MOOD_OPTIONS = [
  { id: "great", title: "Отлично" },
  { id: "ok", title: "Нормально" },
  { id: "hard", title: "Тяжело" },
];

export const BLOCKER_OPTIONS = [
  { id: "time", title: "Не было времени" },
  { id: "tired", title: "Устал" },
  { id: "forgot", title: "Забыл" },
  { id: "bored", title: "Скучно" },
  { id: "pain", title: "Болело" },
  { id: "none", title: "Ничего" },
];

export const FAVORITE_OPTIONS = [
  { id: "strength", title: "Силовые" },
  { id: "cardio", title: "Кардио" },
  { id: "stretch", title: "Растяжка" },
  { id: "short", title: "Короткие" },
  { id: "circuit", title: "Круги" },
];

export const PACE_OPTIONS = [
  { id: "slower", title: "Помедленнее" },
  { id: "same", title: "Так же" },
  { id: "harder", title: "Жёстче" },
];

export const WEEKDAY_OPTIONS = [
  { id: "0", title: "Пн" },
  { id: "1", title: "Вт" },
  { id: "2", title: "Ср" },
  { id: "3", title: "Чт" },
  { id: "4", title: "Пт" },
  { id: "5", title: "Сб" },
  { id: "6", title: "Вс" },
];

const SLOT_DAY_IDS = {
  1: ["0"],
  2: ["0", "3"],
  3: ["0", "2", "4"],
  4: ["0", "1", "3", "5"],
  5: ["0", "1", "2", "3", "4"],
  6: ["0", "1", "2", "3", "4", "5"],
  7: ["0", "1", "2", "3", "4", "5", "6"],
};

export const DEFAULT_TRAIN_DAYS = SLOT_DAY_IDS[3];

export function parseTrainDayIds(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => String(Math.round(Number(item)))))]
    .filter((id) => id.length === 1 && id >= "0" && id <= "6")
    .sort((a, b) => Number(a) - Number(b));
}

export function coerceTrainDayIds(value, daysPerWeek = 3) {
  const ids = parseTrainDayIds(value);
  if (ids.length) {
    return ids;
  }
  const count = Math.max(1, Math.min(7, Math.round(Number(daysPerWeek) || 3)));
  return SLOT_DAY_IDS[count] || DEFAULT_TRAIN_DAYS;
}

export function trainDayNumbers(value, daysPerWeek = 3) {
  return coerceTrainDayIds(value, daysPerWeek).map((id) => Number(id));
}

export function trainDaysLabel(value, daysPerWeek = 3) {
  const labels = labelsOf(WEEKDAY_OPTIONS);
  return coerceTrainDayIds(value, daysPerWeek)
    .map((id) => labels[id])
    .filter(Boolean)
    .join(" · ");
}

function labelsOf(list) {
  return Object.fromEntries(list.map((item) => [item.id, item.title]));
}

export const PLACE_LABELS = labelsOf(PLACE_OPTIONS);
export const TIME_LABELS = { ...labelsOf(TIME_OPTIONS), "3": "30 мин", "10": "30 мин", "20": "30 мин" };
export const PAIN_LABELS = labelsOf(PAIN_OPTIONS);
export const DIET_LABELS = labelsOf(DIET_OPTIONS);
export const MEAL_LABELS = labelsOf(MEAL_OPTIONS);
export const FOCUS_LABELS = labelsOf(FOCUS_OPTIONS);

export const QUIZ_DEFAULTS = {
  place: "anywhere",
  timeBudget: "60",
  restrictions: [],
  diet: ["all"],
  meals: "3",
  focus: "habit",
  foodSkip: [],
  foodSkipSet: false,
};

export function emptyQuiz() {
  return { place: "", timeBudget: "", restrictions: [], diet: [], meals: "", focus: "", foodSkip: [], foodSkipSet: false };
}

export function coerceTimeId(value) {
  const raw = String(value || "");
  if (raw === "30" || raw === "60" || raw === "90" || raw === "120") {
    return raw;
  }
  if (raw === "3" || raw === "10" || raw === "20") {
    return "30";
  }
  return "";
}

export function inferFocus(goals, weight) {
  const current = Number(weight?.current ?? weight);
  const goal = Number(weight?.goal);
  if (Number.isFinite(current) && Number.isFinite(goal) && goal < current - 0.5) {
    return "loss";
  }
  if (Array.isArray(goals) && goals.includes("strength")) {
    return "strength";
  }
  if (Array.isArray(goals) && goals.includes("stretch")) {
    return "posture";
  }
  if (Array.isArray(goals) && (goals.includes("walk") || goals.includes("run"))) {
    return "energy";
  }
  return "habit";
}

export function quizPayload(quiz) {
  const diet = Array.isArray(quiz?.diet) ? quiz.diet.filter(Boolean) : [];
  const cleaned = diet.includes("all") && diet.length > 1 ? diet.filter((id) => id !== "all") : diet;
  return {
    place: quiz?.place || QUIZ_DEFAULTS.place,
    timeBudget: quiz?.timeBudget || QUIZ_DEFAULTS.timeBudget,
    restrictions: Array.isArray(quiz?.restrictions) ? quiz.restrictions : [],
    diet: cleaned.length ? cleaned : ["all"],
    meals: quiz?.meals || QUIZ_DEFAULTS.meals,
    focus: quiz?.focus || QUIZ_DEFAULTS.focus,
    foodSkip: parseFoodSkipList(quiz?.foodSkip),
    foodSkipSet: Boolean(quiz?.foodSkipSet) || parseFoodSkipList(quiz?.foodSkip).length > 0,
  };
}
