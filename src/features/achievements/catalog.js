import { Award, Bike, Calendar, ClipboardList, Dumbbell, Flame, Footprints, Layers, ListChecks, Medal, MessageCircle, Moon, PenLine, RotateCcw, Salad, Shield, ShieldCheck, Sparkles, Star, Sun, Sunrise, Sunset, Timer, Trophy, User, Users, Utensils, Zap } from "lucide-react-native";
import data from "../../../data/content/achievements.json";

const ICONS = {
  first: Medal,
  streak3: Star,
  streak7: Flame,
  streak30: Trophy,
  quiz: User,
  fuel: Utensils,
  shield: Shield,
  hundred: Sparkles,
  ten: Zap,
  return: RotateCcw,
  fuel3: Utensils,
  fuel5: Utensils,
  kindStrength: Dumbbell,
  kindRun: Flame,
  kindWalk: Footprints,
  kindBike: Bike,
  allKinds: Layers,
  shieldSave: ShieldCheck,
  dawn: Sunrise,
  late: Moon,
  weekend: Calendar,
  short: Timer,
  daily1: Zap,
  daily5: Layers,
  dailyDay: Shield,
  dailyWeek: Calendar,
  warmupMorning: Sun,
  warmupEvening: Sunset,
  warmupDay: Sparkles,
  week3: Calendar,
  week5: Flame,
  week7: Trophy,
  checkin: MessageCircle,
  checkin7: ClipboardList,
  weekly: ListChecks,
  custom: PenLine,
  customPlay: Sparkles,
  express: Timer,
  longDone: Dumbbell,
  kindMeal: Salad,
  friend: Users,
};

const ALL_KINDS = ["strength", "run", "nutrition", "walk", "stretch", "bike"];
const FUEL_GAP_MS = 20000;

function countedFuelItems(items) {
  const times = (Array.isArray(items) ? items : [])
    .map((item) => Date.parse(item?.loggedAt))
    .filter((at) => Number.isFinite(at))
    .sort((a, b) => a - b);
  let count = 0;
  let last = 0;
  for (const at of times) {
    if (!count || at - last >= FUEL_GAP_MS) {
      count += 1;
      last = at;
    }
  }
  return count;
}

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

function weekStartOf(iso) {
  const day = new Date(`${String(iso || utcToday())}T00:00:00.000Z`);
  if (Number.isNaN(day.getTime())) {
    return utcToday();
  }
  const weekday = day.getUTCDay();
  const back = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - back);
  return day.toISOString().slice(0, 10);
}

function weekActivityCount(user) {
  const start = weekStartOf(utcToday());
  const endDate = new Date(`${start}T00:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 7);
  const end = endDate.toISOString().slice(0, 10);
  const dates = Array.isArray(user?.activityDates) ? user.activityDates : [];
  return dates.filter((day) => day >= start && day < end).length;
}

export const ACHIEVEMENTS = data;

export function iconOf(id) {
  return ICONS[id] || Award;
}

export function earnedSet(user) {
  return new Set(Array.isArray(user?.achievements) ? user.achievements : []);
}

export function shownAchievements(user) {
  const earned = earnedSet(user);
  const rank = (item) => {
    if (earned.has(item.id)) {
      return 0;
    }
    return item.secret ? 2 : 1;
  };
  return [...ACHIEVEMENTS].sort((a, b) => rank(a) - rank(b));
}

export function isHidden(user, item) {
  return Boolean(item?.secret) && !earnedSet(user).has(item.id);
}

function ruNoun(count, one, few, many) {
  const n = Math.abs(Math.round(Number(count) || 0));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }
  return many;
}

function dayWord(count) {
  return ruNoun(count, "день", "дня", "дней");
}

export function conditionOf(item) {
  const need = Math.max(1, Number(item?.need) || 1);
  if (item?.rule === "streak" || item?.rule === "clean" || (item?.rule === "dailyClear" && need > 1)) {
    return `${need} ${dayWord(need)}`;
  }
  if (item?.rule === "activity") {
    return `${need} ${ruNoun(need, "тренировка", "тренировки", "тренировок")}`;
  }
  if (item?.rule === "fuel") {
    return `${need} ${ruNoun(need, "запись", "записи", "записей")}`;
  }
  if (item?.rule === "dailyCount") {
    return `${need} ${ruNoun(need, "задание", "задания", "заданий")}`;
  }
  if (item?.rule === "kinds") {
    return `${need} типов`;
  }
  if (item?.rule === "weekDays") {
    return `${need} ${dayWord(need)} на неделе`;
  }
  if (item?.rule === "checkins") {
    return need === 1 ? "1 опрос" : `${need} опросов`;
  }
  if (item?.rule === "weeklyReviews") {
    return "1 обзор";
  }
  if (item?.rule === "customMade") {
    return "1 своя";
  }
  if (item?.rule === "friends") {
    return "1 друг";
  }
  return item?.hint || "";
}

export function progressValue(user, item) {
  if (item.rule === "streak") {
    return Number(user?.streak) || 0;
  }
  if (item.rule === "activity") {
    return Number(user?.activityCount) || 0;
  }
  if (item.rule === "fuel") {
    const log = user?.fuelLog;
    if (!log || log.date !== utcToday() || !Array.isArray(log.items)) {
      return 0;
    }
    return countedFuelItems(log.items);
  }
  if (item.rule === "onboarding") {
    return user?.onboardingDone ? 1 : 0;
  }
  if (item.rule === "clean") {
    return Number(user?.cleanStreak) || 0;
  }
  if (item.rule === "return") {
    return user?.returned ? 1 : 0;
  }
  if (item.rule === "kind") {
    const done = Array.isArray(user?.kindsDone) ? user.kindsDone : [];
    return done.includes(item.kind) ? 1 : 0;
  }
  if (item.rule === "kinds") {
    const done = new Set(Array.isArray(user?.kindsDone) ? user.kindsDone : []);
    return ALL_KINDS.filter((id) => done.has(id)).length;
  }
  if (item.rule === "dawn") {
    return user?.dawn ? 1 : 0;
  }
  if (item.rule === "late") {
    return user?.late ? 1 : 0;
  }
  if (item.rule === "weekend") {
    return user?.weekend ? 1 : 0;
  }
  if (item.rule === "shieldSave") {
    return 0;
  }
  if (item.rule === "dailyCount") {
    return Number(user?.dailyDoneCount) || 0;
  }
  if (item.rule === "dailyClear") {
    return Number(user?.dailyClearDays) || 0;
  }
  if (item.rule === "session") {
    const done = Array.isArray(user?.sessionsDone) ? user.sessionsDone : [];
    return done.includes(item.sessionId) ? 1 : 0;
  }
  if (item.rule === "sessionsToday") {
    const needIds = Array.isArray(item.sessionIds) ? item.sessionIds : [];
    const today = Array.isArray(user?.todaySessions) ? user.todaySessions : [];
    return needIds.length > 0 && needIds.every((id) => today.includes(id)) ? 1 : 0;
  }
  if (item.rule === "weekDays") {
    return weekActivityCount(user);
  }
  if (item.rule === "checkins") {
    return Array.isArray(user?.checkins) ? user.checkins.length : 0;
  }
  if (item.rule === "weeklyReviews") {
    return Array.isArray(user?.weeklyReviews) ? user.weeklyReviews.length : 0;
  }
  if (item.rule === "customMade") {
    return Array.isArray(user?.customSessions) ? user.customSessions.length : 0;
  }
  if (item.rule === "customPlay") {
    return user?.customPlay ? 1 : 0;
  }
  if (item.rule === "shortDone") {
    return user?.shortDone ? 1 : 0;
  }
  if (item.rule === "longDone") {
    return user?.longDone ? 1 : 0;
  }
  if (item.rule === "friends") {
    return Number(user?.friendCount) || 0;
  }
  return 0;
}
