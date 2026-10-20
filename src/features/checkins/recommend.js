import { foodById, sumLog, utcDay } from "../calories/foods";
import { dailyKcalTarget } from "../calories/target";
import { bodyMassIndex } from "../onboarding/bmi";
import { emptyQuiz, inferFocus, parseTrainDayIds, quizPayload, trainDayNumbers } from "../onboarding/quiz";
import { guessTimeZone, weekdayMon0 as weekdayMon0Local } from "../../lib/day";
import {
  fitSessionToBudget,
  isSetSession,
  openLevel,
  sessionMinutes,
  sessionsForPlan,
  sessionsInGroup,
  warmupSessions,
} from "../workouts/catalog";

export const TIME_MINUTES = { "3": 30, "10": 30, "20": 30, "30": 30, "60": 60, "90": 90, "120": 120 };

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const SLOT_DAYS = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

const FOCUS_GROUPS = {
  habit: ["full", "stretch", "cardio"],
  loss: ["cardio", "full", "legs"],
  strength: ["push", "pull", "legs"],
  energy: ["cardio", "stretch", "full"],
  posture: ["pull", "stretch", "core"],
};

const PAIN_SKIP_GROUPS = {
  knees: ["legs"],
  lumbar: ["legs"],
  shoulders: ["push"],
  wrists: ["push"],
  neck: ["pull"],
  back: [],
};

const PAIN_SKIP_SESSIONS = {
  "cardio-4": ["knees"],
  "cardio-5": ["knees", "wrists"],
  "full-4": ["knees"],
  "full-5": ["knees", "wrists"],
  "push-4": ["wrists", "shoulders"],
  "push-5": ["wrists", "shoulders"],
  "gym-full-1": ["knees", "lumbar"],
  "gym-full-2": ["knees", "lumbar"],
  "gym-full-3": ["knees", "lumbar"],
  "gym-full-4": ["knees", "lumbar"],
  "gym-full-5": ["knees", "lumbar"],
  "gym-push-1": ["shoulders", "wrists"],
  "gym-push-2": ["shoulders", "wrists"],
  "gym-push-3": ["shoulders", "wrists"],
  "gym-push-4": ["shoulders", "wrists"],
  "gym-push-5": ["shoulders", "wrists"],
  "gym-pull-1": ["neck"],
  "gym-pull-2": ["neck"],
  "gym-pull-3": ["neck"],
  "gym-pull-4": ["neck"],
  "gym-pull-5": ["neck"],
  "gym-legs-1": ["knees", "lumbar"],
  "gym-legs-2": ["knees", "lumbar"],
  "gym-legs-3": ["knees", "lumbar"],
  "gym-legs-4": ["knees", "lumbar"],
  "gym-legs-5": ["knees", "lumbar"],
  "gym-cardio-2": ["knees"],
  "gym-cardio-3": ["knees"],
  "gym-cardio-4": ["knees"],
  "gym-cardio-5": ["knees"],
};

const PROTEIN_FOODS = [
  { id: "yaytso-kurinoe", need: null },
  { id: "tvorog-nezhirnyy", need: "dairy" },
  { id: "kuritsa-1-kat", need: "meat" },
  { id: "gorbusha", need: "fish" },
  { id: "chechevitsa-varenaya", need: null },
];

const CARB_FOODS = [
  { id: "ovsyanye-hlopya", need: "gluten" },
  { id: "banan", need: null },
  { id: "chechevitsa-varenaya", need: null },
];

export function weekStartUtc(date = new Date()) {
  const iso = date.toISOString().slice(0, 10);
  const day = new Date(`${iso}T00:00:00.000Z`);
  const weekday = day.getUTCDay();
  const back = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - back);
  return day.toISOString().slice(0, 10);
}

export function weekdayMon0(date = new Date()) {
  return weekdayMon0Local(guessTimeZone(), date);
}

export function quizOf(user) {
  return quizPayload(user?.quiz || emptyQuiz());
}

export function todayCheckin(user) {
  const day = utcDay();
  return (Array.isArray(user?.checkins) ? user.checkins : []).find((item) => item.date === day) || null;
}

export function lastWeekly(user) {
  const list = Array.isArray(user?.weeklyReviews) ? user.weeklyReviews : [];
  return list[list.length - 1] || null;
}

export function dayLoad(checkin) {
  if (!checkin) {
    return "green";
  }
  const low = checkin.energy === "low";
  const bad = checkin.sleep === "bad";
  if (low && bad) {
    return "red";
  }
  if (low || bad) {
    return "yellow";
  }
  return "green";
}

export function dietFlags(quiz) {
  const list = Array.isArray(quiz?.diet) ? quiz.diet : ["all"];
  const set = new Set(list);
  if (set.has("all") && set.size > 1) {
    set.delete("all");
  }
  return set;
}

function blockedGroups(pain) {
  const set = new Set();
  for (const id of pain) {
    for (const group of PAIN_SKIP_GROUPS[id] || []) {
      set.add(group);
    }
  }
  return set;
}

function sessionBlocked(session, pain) {
  const id = String(session?.id || "").replace(/^short-/, "");
  const tags = PAIN_SKIP_SESSIONS[id] || [];
  return tags.some((tag) => pain.includes(tag));
}

function layoutForDays(days, focus) {
  const preferred = FOCUS_GROUPS[focus] || FOCUS_GROUPS.habit;
  if (days <= 1) {
    return [preferred[0] || "full"];
  }
  if (days === 2) {
    return [preferred[0] || "full", "stretch"];
  }
  if (days === 3) {
    return [preferred[0] || "full", preferred[1] || "legs", preferred[2] || "core"];
  }
  if (days === 4) {
    return [preferred[0] || "push", "legs", preferred[1] || "pull", "stretch"];
  }
  if (days === 5) {
    return [preferred[0] || "push", "legs", "pull", "core", "cardio"];
  }
  if (days === 6) {
    return ["push", "legs", "pull", "core", "cardio", "stretch"];
  }
  return ["push", "legs", "pull", "core", "cardio", "stretch", "full"];
}

function applyFavorite(groups, favorite) {
  if (!favorite) {
    return groups;
  }
  const next = [...groups];
  if (favorite === "cardio") {
    next[0] = "cardio";
    if (next.length > 2) {
      next[2] = "cardio";
    }
  } else if (favorite === "stretch") {
    next[next.length - 1] = "stretch";
  } else if (favorite === "strength") {
    next[0] = "push";
    if (next.length > 1) {
      next[1] = "legs";
    }
    if (next.length > 2) {
      next[2] = "pull";
    }
  } else if (favorite === "circuit") {
    next[0] = "full";
  } else if (favorite === "short") {
    next[0] = "short";
    if (next.length > 2) {
      next[2] = "short";
    }
  }
  return next;
}

function pickSession(groupId, user, budget, pain, load, pace) {
  const open = openLevel(user);
  const cap = load === "yellow" || pace === "slower" ? Math.max(1, open - 1) : open;
  let list = sessionsForPlan(groupId, user).filter((session) => (Number(session.level) || 1) <= cap);
  if (!list.length) {
    list = sessionsForPlan(groupId, user).filter((session) => (Number(session.level) || 1) <= open);
  }
  list = list.filter((session) => !sessionBlocked(session, pain));
  if (blockedGroups(pain).has(groupId)) {
    list = [];
  }
  if (load === "red") {
    list = [
      ...warmupSessions(),
      ...sessionsInGroup("short").filter((session) => (Number(session.level) || 1) <= Math.min(2, open)),
    ];
  }
  const fitting = list.filter((session) => isSetSession(session) || session.kind === "cardio" || sessionMinutes(session) <= budget + 10);
  const pool = fitting.length ? fitting : list;
  if (!pool.length) {
    const stretch = sessionsInGroup("stretch").filter((session) => !sessionBlocked(session, pain));
    stretch.sort((a, b) => (Number(a.level) || 1) - (Number(b.level) || 1) || sessionMinutes(a) - sessionMinutes(b));
    if (stretch[0]) {
      return fitSessionToBudget(stretch[0], budget);
    }
    return warmupSessions()[0] || null;
  }
  if (pace === "harder" || load === "green") {
    pool.sort((a, b) => (Number(b.level) || 1) - (Number(a.level) || 1) || sessionMinutes(a) - sessionMinutes(b));
  } else {
    pool.sort((a, b) => sessionMinutes(a) - sessionMinutes(b) || (Number(a.level) || 1) - (Number(b.level) || 1));
  }
  return fitSessionToBudget(pool[0], budget);
}

function planReason({ load, pain, budget, quiz }) {
  if (load === "red") {
    return "Сегодня мягкий день";
  }
  if (pain.length) {
    return "Без нагрузки на зону, которая беспокоит";
  }
  if (budget <= 35) {
    return "Слот на полчаса";
  }
  if (quiz.place === "gym") {
    return "Зал, подходы на тренажёрах";
  }
  if (quiz.focus === "loss") {
    return "Больше кругов и кардио";
  }
  if (quiz.focus === "strength") {
    return "Силовой акцент";
  }
  if (quiz.focus === "posture") {
    return "Спина и осанка";
  }
  if (quiz.focus === "energy") {
    return "Коротко, чтобы были силы";
  }
  return "Под твои дни и стаж";
}

export function planWeekdays(user) {
  const picked = parseTrainDayIds(user?.trainDays).map((id) => Number(id));
  if (picked.length) {
    return picked;
  }
  const days = Math.max(1, Math.min(7, Math.round(Number(user?.daysPerWeek) || 3)));
  return SLOT_DAYS[days] || SLOT_DAYS[3];
}

export function weekPlan(user) {
  const quiz = quizOf(user);
  const checkin = todayCheckin(user);
  const weekly = lastWeekly(user);
  const pain = [...new Set([...(quiz.restrictions || []), ...(checkin?.pain || [])])].filter((id) => id && id !== "none");
  const load = dayLoad(checkin);
  const slots = planWeekdays(user);
  const groups = applyFavorite(layoutForDays(slots.length, quiz.focus), weekly?.favorite);
  const budgetId = checkin?.time || quiz.timeBudget;
  const budget = TIME_MINUTES[budgetId] || 60;
  const todayIndex = weekdayMon0();
  const reason = planReason({ load, pain, budget, quiz });

  return groups
    .map((group, index) => {
      const weekday = slots[index] ?? index;
      const today = weekday === todayIndex;
      const todayLoad = today ? load : "green";
      const minutes = todayLoad === "red" ? 20 : budget;
      const session = pickSession(group, user, minutes, pain, todayLoad, weekly?.pace);
      if (!session) {
        return null;
      }
      return {
        weekday,
        dayLabel: DAY_NAMES[weekday],
        group,
        session,
        minutes: sessionMinutes(session),
        today,
        reason: today ? reason : "",
      };
    })
    .filter(Boolean);
}

export function todayPlanItem(user) {
  const plan = weekPlan(user);
  const today = plan.find((item) => item.today);
  if (today) {
    return today;
  }
  const session = warmupSessions()[0];
  return {
    weekday: weekdayMon0(),
    dayLabel: DAY_NAMES[weekdayMon0()],
    group: "stretch",
    session,
    minutes: session ? sessionMinutes(session) : 1,
    today: true,
    rest: true,
    reason: "Сегодня по плану отдых. Разминка тоже считается.",
  };
}

export function macroTargets(user) {
  const kg = Number(user?.weight?.current);
  const age = Number(user?.age);
  const bmi = bodyMassIndex(kg, user?.heightCm);
  const quiz = quizOf(user);
  const target = dailyKcalTarget(user);
  const safe = age < 18 || (Number.isFinite(bmi) && bmi < 18.5);
  const kcal = target.kcal;
  const proteinPerKg = quiz.focus === "loss" || quiz.focus === "strength" ? 1.6 : 1.2;
  const protein = Number.isFinite(kg) ? Math.round(kg * proteinPerKg) : 90;
  const fat = Number.isFinite(kg) ? Math.round(kg * 0.9) : 65;
  const leftover = Math.max(0, kcal - protein * 4 - fat * 9);
  const carbs = Math.round(leftover / 4);
  const mealsRaw = quiz.meals === "varies" ? 3 : Number(quiz.meals) || 3;
  return {
    kcal,
    protein,
    fat,
    carbs,
    mode: target.mode,
    guessedSex: target.guessedSex,
    safe,
    meals: Math.max(2, Math.min(5, mealsRaw)),
  };
}

function foodAllowed(food, flags) {
  if (!food) {
    return false;
  }
  if (flags.has("all") && flags.size === 1) {
    return true;
  }
  if (flags.has("noMeat") && (food.category === "meat" || food.category === "sausage")) {
    return false;
  }
  if (flags.has("noFish") && food.category === "fish") {
    return false;
  }
  if (flags.has("noDairy") && food.category === "dairy") {
    return false;
  }
  if (flags.has("noGluten") && food.category === "bread") {
    return false;
  }
  if (flags.has("noNuts") && food.category === "nuts") {
    return false;
  }
  return true;
}

function pickFoods(list, flags, limit) {
  const found = [];
  for (const item of list) {
    if (item.need === "meat" && flags.has("noMeat")) {
      continue;
    }
    if (item.need === "fish" && flags.has("noFish")) {
      continue;
    }
    if (item.need === "dairy" && flags.has("noDairy")) {
      continue;
    }
    if (item.need === "gluten" && flags.has("noGluten")) {
      continue;
    }
    const food = foodById(item.id);
    if (!foodAllowed(food, flags)) {
      continue;
    }
    found.push(food);
    if (found.length >= limit) {
      break;
    }
  }
  return found;
}

export function foodTips(user, macros) {
  const flags = dietFlags(quizOf(user));
  const today = utcDay();
  const items = user?.fuelLog?.date === today ? user.fuelLog.items || [] : [];
  const eaten = sumLog(items);
  const proteinLow = eaten.protein < macros.protein * 0.45;
  const carbsLow = eaten.carbs < macros.carbs * 0.35;
  if (proteinLow) {
    return { kind: "protein", title: "Сегодня не хватает белка", foods: pickFoods(PROTEIN_FOODS, flags, 3) };
  }
  if (carbsLow && (quizOf(user).focus === "loss" || quizOf(user).focus === "energy")) {
    return { kind: "carbs", title: "Можно добавить углеводов", foods: pickFoods(CARB_FOODS, flags, 3) };
  }
  return { kind: "ok", title: "", foods: pickFoods(PROTEIN_FOODS, flags, 2) };
}

export function nutrientHints(user) {
  const flags = dietFlags(quizOf(user));
  const hints = [];
  if (flags.has("noMeat") && flags.has("noFish")) {
    hints.push("Без мяса и рыбы витамин B12 и железо часто ниже. Бобовые и обогащённые продукты. Добавки не назначаем — это к врачу.");
  } else if (flags.has("noFish") && flags.has("noDairy")) {
    hints.push("В рационе может быть мало витамина D. Яйца и свет помогают. Это ориентир, не диагноз.");
  } else if (flags.has("noFish")) {
    hints.push("Рыбы в ответах нет. Витамин D часто берут из неё и яиц. Если сомневаешься — с врачом.");
  }
  if (flags.has("noDairy")) {
    hints.push("Без молочного кальций чаще берут из зелени, бобовых и обогащённых напитков.");
  }
  if (flags.has("noMeat") && !flags.has("noFish")) {
    hints.push("Без мяса железо чаще ищут в рыбе, яйцах и бобовых. Не диагноз.");
  }
  return hints.slice(0, 2);
}

export function loadLabel(load) {
  if (load === "red") {
    return "Мягкий день";
  }
  if (load === "yellow") {
    return "Полегче";
  }
  return "";
}

export function draftUser(base, fields) {
  const weight = {
    start: Number(fields.weight) || Number(base?.weight?.start) || 70,
    current: Number(fields.weight) || Number(base?.weight?.current) || 70,
    goal: Number(fields.goal) || Number(base?.weight?.goal) || 70,
  };
  const quiz = quizPayload({
    ...emptyQuiz(),
    ...fields.quiz,
    focus: fields.quiz?.focus || inferFocus(fields.goals || base?.goals, weight),
  });
  return {
    ...base,
    weight,
    heightCm: Number(fields.heightCm) || base?.heightCm,
    sex: fields.sex || base?.sex,
    birthDate: fields.birthDate || base?.birthDate,
    age: Number(fields.age) || base?.age,
    goals: fields.goals || base?.goals || [],
    daysPerWeek: Array.isArray(fields.trainDays) && fields.trainDays.length
      ? fields.trainDays.length
      : Number(fields.daysPerWeek) || base?.daysPerWeek || 3,
    trainDays: Array.isArray(fields.trainDays) && fields.trainDays.length
      ? trainDayNumbers(fields.trainDays, fields.daysPerWeek)
      : base?.trainDays,
    experience: fields.experience || base?.experience,
    quiz,
    quizDone: true,
    checkins: base?.checkins || [],
    weeklyReviews: base?.weeklyReviews || [],
    fuelLog: base?.fuelLog,
  };
}

export function entryNudge(user, date = new Date()) {
  if (!user) {
    return null;
  }
  const today = utcDay();
  if (user.lastActivityDate === today) {
    return null;
  }
  const done = new Set(Array.isArray(user.todaySessions) ? user.todaySessions : []);
  const plan = todayPlanItem(user);
  const hour = date.getHours();
  const morning = warmupSessions().find((item) => item.id === "warmup-morning") || warmupSessions()[0];
  const evening = warmupSessions().find((item) => item.id === "warmup-evening") || warmupSessions()[1] || morning;

  if (plan?.session && !plan.rest && !done.has(plan.session.id)) {
    return {
      kind: "workout",
      title: "Сегодня тренировка",
      text: plan.session.title,
      session: plan.session,
      cta: "Начать",
    };
  }
  if (hour < 16 && morning && !done.has(morning.id)) {
    return {
      kind: "warmup",
      title: "Утренняя разминка",
      text: "Минута. Серия от этого тоже живёт.",
      session: morning,
      cta: "Размяться",
    };
  }
  if (hour >= 16 && evening && !done.has(evening.id)) {
    return {
      kind: "warmup",
      title: "Вечерняя разминка",
      text: "Минута перед покоем. Любое движение считается.",
      session: evening,
      cta: "Размяться",
    };
  }
  if (plan?.rest && hour >= 8 && hour < 22) {
    const warmup = hour < 16 ? morning : evening;
    if (warmup && !done.has(warmup.id)) {
      return {
        kind: "rest",
        title: "Сегодня отдых",
        text: "Разминка тоже считается.",
        session: warmup,
        cta: "Размяться",
      };
    }
  }
  return null;
}

export function needsWeeklyReview(user, date = new Date()) {
  const start = weekStartUtc(date);
  const list = Array.isArray(user?.weeklyReviews) ? user.weeklyReviews : [];
  if (list.some((item) => item.weekStart === start)) {
    return false;
  }
  const weekday = weekdayMon0(date);
  return weekday >= 5;
}
