import { utcDay } from "../calories/foods";

const KEY = "fitness-checkin-skip";

function readStore() {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(next) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(next));
  } catch {
    // без хранилища «позже» живёт до перезагрузки
  }
}

let later = {
  daily: "",
  weekly: "",
  nudge: "",
  dailyHome: "",
  weeklyHome: "",
  invite: "",
  ...readStore(),
};

function stamp(userId, day) {
  return `${userId || ""}:${day || utcDay()}`;
}

export function skipCheckin(kind, userId, day = utcDay()) {
  if (later[kind] === undefined) {
    return;
  }
  later = { ...later, [kind]: stamp(userId, day) };
  writeStore(later);
}

export function skipForever(kind, userId) {
  if (later[kind] === undefined) {
    return;
  }
  later = { ...later, [kind]: `${userId || ""}:forever` };
  writeStore(later);
}

export function checkinSkipped(kind, userId, day = utcDay()) {
  const mark = later[kind];
  return mark === `${userId || ""}:forever` || mark === stamp(userId, day);
}
