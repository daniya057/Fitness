const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { LINKS, loadEnv } = require("./env");
const { lookupBarcode, searchNutrition } = require("./nutrition");
const { noteProgramProgress, openProgramLevel } = require("./program-level");
const { publicAvatar, setAvatarPhoto, wearAvatar } = require("./avatar");
const { mailConfigured, sendCodeEmail } = require("./mail");
const { settleStreak, shieldNoticeOpen, utcDay } = require("./streak");

loadEnv();

const {
  adminUserView,
  buildStats,
  clientIp,
  createSession,
  findSession,
  loadCatalog,
  revokeSession,
  saveCatalog,
  tooManyLogins,
  verifyAdminLogin,
} = require("./admin-lib");

const RESET_MS = 15 * 60 * 1000;
const PORT = Number(process.env.AUTH_PORT) || LINKS.apiPort;
const USERS_DIR = path.join(__dirname, "..", "data", "users");
const ACHIEVEMENTS_PATH = path.join(__dirname, "..", "data", "content", "achievements.json");
const WORKOUTS_PATH = path.join(__dirname, "..", "data", "content", "workouts.json");

fs.mkdirSync(USERS_DIR, { recursive: true });

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, OPTIONS",
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("bad_json"));
      }
    });
    req.on("error", reject);
  });
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function checkPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) {
    return false;
  }
  const next = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(next, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function userPath(id) {
  if (!/^[a-f0-9]{16}$/.test(id)) {
    return null;
  }
  return path.join(USERS_DIR, `${id}.json`);
}

const ALLOWED_GOALS = ["strength", "run", "nutrition", "walk", "stretch", "bike"];
const ALLOWED_SEX = ["male", "female"];
const ALLOWED_EXPERIENCE = ["none", "m1_3", "m3_6", "m6_12", "y1"];

function ageFromBirthDate(iso) {
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyQuizFields(record, body, { keepStart }) {
  const current = Number(body.weight);
  const goal = Number(body.goal);
  const heightCm = Math.round(Number(body.heightCm));
  const birthDate = String(body.birthDate || "");
  const age = ageFromBirthDate(birthDate);
  const daysPerWeek = Math.round(Number(body.daysPerWeek));
  const goals = Array.isArray(body.goals)
    ? [...new Set(body.goals.filter((item) => ALLOWED_GOALS.includes(item)))]
    : [];

  if (!Number.isFinite(current) || current < 40 || current > 160) {
    return "Вес — от 40 до 160 кг";
  }
  if (!Number.isFinite(goal) || goal < 40 || goal > 160) {
    return "Желаемый вес — от 40 до 160 кг";
  }
  if (!Number.isFinite(heightCm) || heightCm < 140 || heightCm > 210) {
    return "Рост — от 140 до 210 см";
  }
  if (!age || age < 10 || age > 100) {
    return "Укажи дату рождения в календаре";
  }
  if (goals.length < 1) {
    return "Выбери хотя бы одно направление";
  }
  if (!Number.isFinite(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    return "Дни недели — от 1 до 7";
  }
  const experience = String(body.experience || "");
  if (!ALLOWED_EXPERIENCE.includes(experience)) {
    return "Выбери, как давно занимаешься";
  }

  const sex = String(body.sex || "").trim();
  if (ALLOWED_SEX.includes(sex)) {
    record.sex = sex;
  } else if (!keepStart || !ALLOWED_SEX.includes(record.sex)) {
    return "Укажи пол";
  }

  const start = keepStart && Number.isFinite(Number(record.weight?.start))
    ? Number(record.weight.start)
    : current;

  record.onboardingDone = true;
  record.heightCm = heightCm;
  record.birthDate = birthDate;
  record.age = age;
  record.goals = goals;
  record.daysPerWeek = daysPerWeek;
  record.experience = experience;
  record.weight = {
    start: clamp(start, 40, 160),
    current: clamp(current, 40, 160),
    goal: clamp(goal, 40, 160),
  };
  return null;
}

function emptyFuelLog() {
  return { date: utcDay(), items: [] };
}

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

function ensureFuelLog(record) {
  if (!record.fuelLog || record.fuelLog.date !== utcDay() || !Array.isArray(record.fuelLog.items)) {
    record.fuelLog = emptyFuelLog();
    return true;
  }
  const items = record.fuelLog.items;
  if (!items.some((item) => !item?.loggedAt)) {
    return false;
  }
  const missing = items.filter((item) => !item?.loggedAt).length;
  const now = Date.now();
  let index = 0;
  record.fuelLog = {
    date: record.fuelLog.date,
    items: items.map((item) => {
      if (item?.loggedAt) {
        return item;
      }
      const at = new Date(now - (missing - 1 - index) * FUEL_GAP_MS).toISOString();
      index += 1;
      return { ...item, loggedAt: at };
    }),
  };
  return true;
}

function ensureDayLogs(record) {
  return ensureFuelLog(record);
}

function ensureStatus(record) {
  if (record.status === "Двигаюсь мягко") {
    record.status = "";
    return true;
  }
  return false;
}

const START_FREEZES = 1;

function ensureFreezes(record) {
  if (record.freezesLeft == null || record.freezesLeft === "") {
    record.freezesLeft = START_FREEZES;
    return true;
  }
  const next = clamp(Math.round(Number(record.freezesLeft) || 0), 0, 20);
  if (next !== Number(record.freezesLeft)) {
    record.freezesLeft = next;
    return true;
  }
  record.freezesLeft = next;
  return false;
}

function dayGap(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  return Math.round((end - start) / 86400000);
}

const ACTIVITY_KINDS = ["strength", "run", "nutrition", "walk", "stretch", "bike"];
const MIN_ACTIVITY_SEC = 60;
const FUEL_GAP_MS = 20000;

function applyActivity(record) {
  const today = utcDay();
  if (record.lastActivityDate === today) {
    return false;
  }
  const gap = record.lastActivityDate ? dayGap(record.lastActivityDate, today) : 0;
  if (gap > 1) {
    record.returned = true;
    record.cleanStreak = 1;
  } else {
    record.cleanStreak = clamp((Number(record.cleanStreak) || 0) + 1, 1, 10000);
  }
  record.lastActivityDate = today;
  record.streak = clamp((Number(record.streak) || 0) + 1, 1, 10000);
  record.activityCount = clamp((Number(record.activityCount) || 0) + 1, 0, 100000);
  return true;
}

function rememberActivity(record, body) {
  const kind = String(body?.activityKind || "");
  if (ACTIVITY_KINDS.includes(kind)) {
    if (!Array.isArray(record.kindsDone)) {
      record.kindsDone = [];
    }
    if (!record.kindsDone.includes(kind)) {
      record.kindsDone.push(kind);
    }
    if (!Array.isArray(record.todayKinds)) {
      record.todayKinds = [];
    }
    if (!record.todayKinds.includes(kind)) {
      record.todayKinds.push(kind);
    }
  }
  const sessionId = String(body?.activitySession || "").trim().slice(0, 80);
  if (sessionId) {
    if (!Array.isArray(record.todaySessions)) {
      record.todaySessions = [];
    }
    if (!record.todaySessions.includes(sessionId)) {
      record.todaySessions.push(sessionId);
    }
    if (!Array.isArray(record.sessionsDone)) {
      record.sessionsDone = [];
    }
    if (!record.sessionsDone.includes(sessionId) && record.sessionsDone.length < 80) {
      record.sessionsDone.push(sessionId);
    }
  }
  const hour = Number(body?.activityHour);
  if (Number.isInteger(hour) && hour >= 0 && hour <= 23) {
    if (hour < 9) {
      record.dawn = true;
    }
    if (hour >= 21) {
      record.late = true;
    }
  }
  const weekday = Number(body?.activityWeekday);
  if (weekday === 0 || weekday === 6) {
    record.weekend = true;
  }
}

function kindsDoneSet(record) {
  return new Set(Array.isArray(record.kindsDone) ? record.kindsDone : []);
}

function loadWorkoutsFile() {
  try {
    return JSON.parse(fs.readFileSync(WORKOUTS_PATH, "utf8"));
  } catch {
    return { sessions: [], experienceRank: {}, unlockEvery: 3 };
  }
}

function loadDailyPool() {
  try {
    const data = JSON.parse(fs.readFileSync(WORKOUTS_PATH, "utf8"));
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    return sessions
      .filter((item) => item && item.daily && item.id)
      .map((item) => {
        const moves = Array.isArray(item.moves) ? item.moves : [];
        const hint = moves
          .slice(0, 2)
          .map((move) => String(move.title || "").trim())
          .filter(Boolean)
          .join(" · ");
        return {
          id: item.id,
          title: String(item.title || "Мини-тренировка"),
          hint: hint || "Мини-тренировка",
          rule: "session",
          sessionId: item.id,
          kind: item.kind || "",
        };
      });
  } catch {
    return [];
  }
}

function dailyHash(text) {
  let hash = 2166136261;
  const value = String(text || "");
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

function pickDailyTasks(userId, day) {
  const pool = loadDailyPool();
  let state = dailyHash(`${userId}|${day}`);
  const picked = [];
  while (picked.length < 3 && pool.length) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const index = state % pool.length;
    const [next] = pool.splice(index, 1);
    picked.push(next);
  }
  return picked;
}

function ensureDaily(record) {
  const today = utcDay();
  const tasks = record.daily && Array.isArray(record.daily.tasks) ? record.daily.tasks : [];
  const fresh = record.daily && record.daily.date === today && tasks.length > 0 && tasks.every((task) => task.rule === "session" && task.sessionId);
  if (fresh) {
    return false;
  }
  record.daily = {
    date: today,
    tasks: pickDailyTasks(record.id, today),
    done: [],
    shieldGranted: false,
  };
  record.todayKinds = [];
  record.todaySessions = [];
  return true;
}

function dailyTaskMet(record, task) {
  if (task.rule === "session") {
    return Array.isArray(record.todaySessions) && record.todaySessions.includes(task.sessionId);
  }
  if (task.rule === "any") {
    return record.lastActivityDate === utcDay();
  }
  if (task.rule === "kind") {
    return Array.isArray(record.todayKinds) && record.todayKinds.includes(task.kind);
  }
  if (task.rule === "fuel") {
    const items = record.fuelLog && Array.isArray(record.fuelLog.items) ? record.fuelLog.items : [];
    return countedFuelItems(items) >= (Number(task.need) || 1);
  }
  return false;
}

function scoreDaily(record) {
  let changed = ensureDaily(record);
  if (record.dailyDoneCount == null) {
    record.dailyDoneCount = 0;
    changed = true;
  }
  if (record.dailyClearDays == null) {
    record.dailyClearDays = 0;
    changed = true;
  }
  const tasks = Array.isArray(record.daily.tasks) ? record.daily.tasks : [];
  const prev = new Set(Array.isArray(record.daily.done) ? record.daily.done : []);
  const done = new Set(prev);
  for (const task of tasks) {
    if (dailyTaskMet(record, task)) {
      done.add(task.id);
    }
  }
  if (done.size !== prev.size) {
    changed = true;
  }
  record.dailyDoneCount += [...done].filter((id) => !prev.has(id)).length;
  record.daily.done = [...done];
  if (!record.daily.shieldGranted && tasks.length > 0 && tasks.every((task) => done.has(task.id))) {
    record.freezesLeft = clamp((Number(record.freezesLeft) || 0) + 1, 0, 20);
    record.daily.shieldGranted = true;
    record.dailyClearDays += 1;
    changed = true;
  }
  return changed;
}

function loadAchievements() {
  try {
    const data = JSON.parse(fs.readFileSync(ACHIEVEMENTS_PATH, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function achievementMet(record, item) {
  const need = Number(item.need) || 1;
  if (item.rule === "streak") {
    return (Number(record.streak) || 0) >= need;
  }
  if (item.rule === "activity") {
    return (Number(record.activityCount) || 0) >= need;
  }
  if (item.rule === "onboarding") {
    return Boolean(record.onboardingDone);
  }
  if (item.rule === "fuel") {
    const items = record.fuelLog && Array.isArray(record.fuelLog.items) ? record.fuelLog.items : [];
    return countedFuelItems(items) >= need;
  }
  if (item.rule === "clean") {
    return !record.shieldUsed && (Number(record.cleanStreak) || 0) >= need;
  }
  if (item.rule === "return") {
    return Boolean(record.returned);
  }
  if (item.rule === "kind") {
    return kindsDoneSet(record).has(item.kind);
  }
  if (item.rule === "kinds") {
    const done = kindsDoneSet(record);
    return ACTIVITY_KINDS.every((id) => done.has(id));
  }
  if (item.rule === "dawn") {
    return Boolean(record.dawn);
  }
  if (item.rule === "late") {
    return Boolean(record.late);
  }
  if (item.rule === "weekend") {
    return Boolean(record.weekend);
  }
  if (item.rule === "shieldSave") {
    return Boolean(record.shieldSavedDate) && record.shieldSavedDate === record.lastActivityDate;
  }
  if (item.rule === "dailyCount") {
    return (Number(record.dailyDoneCount) || 0) >= need;
  }
  if (item.rule === "dailyClear") {
    return (Number(record.dailyClearDays) || 0) >= need;
  }
  if (item.rule === "session") {
    return Array.isArray(record.sessionsDone) && record.sessionsDone.includes(item.sessionId);
  }
  if (item.rule === "sessionsToday") {
    const needIds = Array.isArray(item.sessionIds) ? item.sessionIds : [];
    const today = Array.isArray(record.todaySessions) ? record.todaySessions : [];
    return needIds.length > 0 && needIds.every((id) => today.includes(id));
  }
  return false;
}

function ensureAchievements(record) {
  let seeded = false;
  if (record.activityCount == null || record.activityCount === "") {
    record.activityCount = Number(record.streak) || 0;
    seeded = true;
  }
  if (record.shieldUsed == null) {
    record.shieldUsed = (Number(record.freezesLeft) || 0) < START_FREEZES;
    seeded = true;
  }
  if (record.cleanStreak == null || record.cleanStreak === "") {
    const gap = record.lastActivityDate ? dayGap(record.lastActivityDate, utcDay()) : 99;
    record.cleanStreak = gap <= 1 ? Number(record.streak) || 0 : 0;
    seeded = true;
  }
  if (record.returned == null) {
    record.returned = false;
    seeded = true;
  }
  if (!Array.isArray(record.kindsDone)) {
    record.kindsDone = [];
    seeded = true;
  }
  if (!Array.isArray(record.sessionsDone)) {
    record.sessionsDone = [];
    seeded = true;
  }
  if (settleStreak(record).changed) {
    seeded = true;
  }
  if (scoreDaily(record)) {
    seeded = true;
  }
  const catalog = loadAchievements().filter((item) => item && item.id);
  const known = new Set(catalog.map((item) => item.id));
  const prev = Array.isArray(record.achievements) ? record.achievements.filter((id) => known.has(id)) : [];
  const earned = new Set(prev);
  let changed = seeded || !Array.isArray(record.achievements) || prev.length !== record.achievements.length;
  for (const item of catalog) {
    if (earned.has(item.id)) {
      continue;
    }
    if (achievementMet(record, item)) {
      earned.add(item.id);
      changed = true;
    }
  }
  const next = [...earned];
  if (next.length !== prev.length) {
    changed = true;
  }
  record.achievements = next;
  const count = clamp(Math.round(Number(record.activityCount) || 0), 0, 100000);
  if (record.activityCount !== count) {
    record.activityCount = count;
    changed = true;
  }
  return changed;
}

function finiteNonNeg(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return n;
}

function sanitizeFuelLog(incoming, previous) {
  const today = utcDay();
  if (!incoming || typeof incoming !== "object" || incoming.date !== today) {
    return emptyFuelLog();
  }
  const prevAt = new Map();
  if (previous && previous.date === today && Array.isArray(previous.items)) {
    for (const item of previous.items) {
      if (item?.id && typeof item.loggedAt === "string" && item.loggedAt) {
        prevAt.set(item.id, item.loggedAt);
      }
    }
  }
  const now = new Date().toISOString();
  const raw = Array.isArray(incoming.items) ? incoming.items.slice(0, 80) : [];
  const items = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const foodId = String(item.foodId || "").trim().slice(0, 80);
    const label = String(item.label || "").trim().slice(0, 80);
    if (!foodId && !label) {
      continue;
    }
    const grams = Math.round(Number(item.grams));
    if (!Number.isFinite(grams) || grams < 1) {
      continue;
    }
    const id = String(item.id || "").trim().slice(0, 40) || `log-${items.length + 1}`;
    items.push({
      id,
      foodId,
      grams,
      label: label || foodId,
      kcal: finiteNonNeg(item.kcal),
      protein: finiteNonNeg(item.protein),
      fat: finiteNonNeg(item.fat),
      carbs: finiteNonNeg(item.carbs),
      loggedAt: prevAt.get(id) || now,
    });
  }
  return { date: today, items };
}

function publicUser(record) {
  ensureDayLogs(record);
  ensureFreezes(record);
  ensureStatus(record);
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    status: record.status || "",
    weight: record.weight,
    streak: record.streak || 0,
    freezesLeft: record.freezesLeft,
    lastActivityDate: record.lastActivityDate || null,
    activityCount: record.activityCount || 0,
    cleanStreak: record.cleanStreak || 0,
    returned: Boolean(record.returned),
    kindsDone: Array.isArray(record.kindsDone) ? record.kindsDone : [],
    sessionsDone: Array.isArray(record.sessionsDone) ? record.sessionsDone : [],
    todaySessions: Array.isArray(record.todaySessions) ? record.todaySessions : [],
    dailyDoneCount: record.dailyDoneCount || 0,
    dailyClearDays: record.dailyClearDays || 0,
    shieldNotice: shieldNoticeOpen(record),
    daily: record.daily
      ? {
          date: record.daily.date,
          tasks: Array.isArray(record.daily.tasks) ? record.daily.tasks : [],
          done: Array.isArray(record.daily.done) ? record.daily.done : [],
          shieldGranted: Boolean(record.daily.shieldGranted),
        }
      : null,
    achievements: Array.isArray(record.achievements) ? record.achievements : [],
    onboardingDone: Boolean(record.onboardingDone),
    heightCm: record.heightCm || null,
    birthDate: record.birthDate || null,
    age: record.age || null,
    sex: ALLOWED_SEX.includes(record.sex) ? record.sex : null,
    goals: Array.isArray(record.goals) ? record.goals : [],
    daysPerWeek: record.daysPerWeek || null,
    experience: ALLOWED_EXPERIENCE.includes(record.experience) ? record.experience : null,
    programLevel: openProgramLevel(record, loadWorkoutsFile().experienceRank),
    levelProgress: Math.max(0, Math.round(Number(record.levelProgress) || 0)),
    progressLevel: Math.round(Number(record.progressLevel)) || 0,
    fuelLog: record.fuelLog,
    emailVerified: record.emailVerified !== false,
    ...publicAvatar(record),
    createdAt: record.createdAt,
  };
}

function listUsers() {
  return fs
    .readdirSync(USERS_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const raw = fs.readFileSync(path.join(USERS_DIR, name), "utf8");
      return JSON.parse(raw);
    });
}

function saveUser(record) {
  const file = userPath(record.id);
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

function findByEmail(email) {
  const needle = String(email || "").trim().toLowerCase();
  return listUsers().find((user) => user.email === needle) || null;
}

function makeResetCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function resetStillValid(record) {
  const until = Date.parse(record?.resetExpires);
  return Boolean(record?.resetCodeHash) && Number.isFinite(until) && until > Date.now();
}

function verifyStillValid(record) {
  const until = Date.parse(record?.verifyExpires);
  return Boolean(record?.verifyCodeHash) && Number.isFinite(until) && until > Date.now();
}

function stampVerifyCode(record) {
  const code = makeResetCode();
  record.verifyCodeHash = hashPassword(code);
  record.verifyExpires = new Date(Date.now() + RESET_MS).toISOString();
  return code;
}

function findByToken(token) {
  if (!token) {
    return null;
  }
  return listUsers().find((user) => Array.isArray(user.tokens) && user.tokens.includes(token)) || null;
}

function bearer(req, queryToken) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return queryToken || "";
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, OPTIONS",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const route = `${req.method} ${url.pathname}`;

  try {
    if (route === "POST /register") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (name.length < 2) {
        send(res, 400, { error: "Укажи имя" });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        send(res, 400, { error: "Нужна нормальная почта" });
        return;
      }
      if (password.length < 6) {
        send(res, 400, { error: "Пароль от 6 символов" });
        return;
      }
      if (findByEmail(email)) {
        send(res, 409, { error: "Такая почта уже есть" });
        return;
      }

      const token = crypto.randomBytes(24).toString("hex");
      const now = new Date().toISOString();
      const record = {
        id: crypto.randomBytes(8).toString("hex"),
        name,
        email,
        passwordHash: hashPassword(password),
        status: "",
        streak: 0,
        activityCount: 0,
        achievements: [],
        lastActivityDate: null,
        freezesLeft: START_FREEZES,
        onboardingDone: false,
        sex: null,
        heightCm: null,
        birthDate: null,
        age: null,
        goals: [],
        daysPerWeek: null,
        experience: null,
        weight: {
          start: 70,
          current: 70,
          goal: 70,
        },
        fuelLog: { date: now.slice(0, 10), items: [] },
        tokens: [token],
        emailVerified: false,
        avatarFace: "user",
        avatarRing: "mint",
        avatarPhoto: "",
        createdAt: now,
        updatedAt: now,
      };
      const code = stampVerifyCode(record);
      ensureAchievements(record);
      saveUser(record);
      const mailed = await sendCodeEmail({ to: email, code, kind: "verify" });
      send(res, 201, {
        token,
        user: publicUser(record),
        mailed: mailed.sent,
        ...(mailed.sent || mailConfigured() ? {} : { code }),
      });
      return;
    }

    if (route === "POST /login") {
      const body = await readBody(req);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const record = findByEmail(email);
      if (!record || !checkPassword(password, record.passwordHash)) {
        send(res, 401, { error: "Почта или пароль не подошли" });
        return;
      }
      const token = crypto.randomBytes(24).toString("hex");
      record.tokens = [...(record.tokens || []), token].slice(-8);
      ensureAchievements(record);
      ensureStatus(record);
      record.updatedAt = new Date().toISOString();
      saveUser(record);
      send(res, 200, { token, user: publicUser(record) });
      return;
    }

    if (route === "POST /password/forgot") {
      const body = await readBody(req);
      const ip = clientIp(req);
      if (tooManyLogins(ip)) {
        send(res, 429, { error: "Слишком много попыток, подожди" });
        return;
      }
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        send(res, 400, { error: "Нужна нормальная почта" });
        return;
      }
      const record = findByEmail(email);
      if (!record) {
        send(res, 200, { ok: true });
        return;
      }
      const code = makeResetCode();
      record.resetCodeHash = hashPassword(code);
      record.resetExpires = new Date(Date.now() + RESET_MS).toISOString();
      record.updatedAt = new Date().toISOString();
      saveUser(record);
      const mailed = await sendCodeEmail({ to: email, code, kind: "reset" });
      if (mailConfigured() && !mailed.sent) {
        send(res, 502, { error: "Письмо не ушло" });
        return;
      }
      send(res, 200, {
        ok: true,
        mailed: mailed.sent,
        ...(mailed.sent ? {} : { code }),
      });
      return;
    }

    if (route === "POST /email/verify") {
      const body = await readBody(req);
      const record = findByToken(bearer(req, body.token));
      if (!record) {
        send(res, 401, { error: "Нужно войти" });
        return;
      }
      const ip = clientIp(req);
      if (tooManyLogins(ip)) {
        send(res, 429, { error: "Слишком много попыток, подожди" });
        return;
      }
      if (record.emailVerified !== false) {
        send(res, 200, { user: publicUser(record) });
        return;
      }
      const code = String(body.code || "").replace(/\D/g, "");
      if (code.length !== 6 || !verifyStillValid(record) || !checkPassword(code, record.verifyCodeHash)) {
        send(res, 401, { error: "Код не подошёл или устарел" });
        return;
      }
      record.emailVerified = true;
      record.verifyCodeHash = "";
      record.verifyExpires = null;
      record.updatedAt = new Date().toISOString();
      saveUser(record);
      send(res, 200, { user: publicUser(record) });
      return;
    }

    if (route === "POST /email/resend") {
      const body = await readBody(req);
      const record = findByToken(bearer(req, body.token));
      if (!record) {
        send(res, 401, { error: "Нужно войти" });
        return;
      }
      const ip = clientIp(req);
      if (tooManyLogins(ip)) {
        send(res, 429, { error: "Слишком много попыток, подожди" });
        return;
      }
      if (record.emailVerified !== false) {
        send(res, 200, { ok: true });
        return;
      }
      const code = stampVerifyCode(record);
      record.updatedAt = new Date().toISOString();
      saveUser(record);
      const mailed = await sendCodeEmail({ to: record.email, code, kind: "verify" });
      if (!mailed.sent) {
        send(res, 502, {
          error: "Письмо не ушло",
          ...(mailConfigured() ? {} : { code }),
        });
        return;
      }
      send(res, 200, { ok: true, mailed: true });
      return;
    }

    if (route === "POST /password/reset") {
      const body = await readBody(req);
      const ip = clientIp(req);
      if (tooManyLogins(ip)) {
        send(res, 429, { error: "Слишком много попыток, подожди" });
        return;
      }
      const email = String(body.email || "").trim().toLowerCase();
      const code = String(body.code || "").replace(/\D/g, "");
      const password = String(body.password || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        send(res, 400, { error: "Нужна нормальная почта" });
        return;
      }
      if (code.length !== 6) {
        send(res, 400, { error: "Код — шесть цифр" });
        return;
      }
      if (password.length < 6) {
        send(res, 400, { error: "Пароль от 6 символов" });
        return;
      }
      const record = findByEmail(email);
      if (!record || !resetStillValid(record) || !checkPassword(code, record.resetCodeHash)) {
        send(res, 401, { error: "Код не подошёл или устарел" });
        return;
      }
      const token = crypto.randomBytes(24).toString("hex");
      record.passwordHash = hashPassword(password);
      record.resetCodeHash = "";
      record.resetExpires = null;
      record.tokens = [token];
      ensureAchievements(record);
      ensureStatus(record);
      record.updatedAt = new Date().toISOString();
      saveUser(record);
      send(res, 200, { token, user: publicUser(record) });
      return;
    }

    if (route === "POST /logout") {
      const body = await readBody(req);
      const token = bearer(req, body.token);
      const record = findByToken(token);
      if (record) {
        record.tokens = (record.tokens || []).filter((item) => item !== token);
        record.updatedAt = new Date().toISOString();
        saveUser(record);
      }
      send(res, 200, { ok: true });
      return;
    }

    if (route === "GET /me") {
      const record = findByToken(bearer(req, url.searchParams.get("token")));
      if (!record) {
        send(res, 401, { error: "Нужно войти" });
        return;
      }
      if (ensureDayLogs(record) || ensureFreezes(record) || ensureAchievements(record) || ensureStatus(record)) {
        record.updatedAt = new Date().toISOString();
        saveUser(record);
      }
      send(res, 200, { user: publicUser(record) });
      return;
    }

    if (route === "PATCH /me") {
      const body = await readBody(req);
      const record = findByToken(bearer(req, body.token));
      if (!record) {
        send(res, 401, { error: "Нужно войти" });
        return;
      }
      if (typeof body.name === "string") {
        const name = body.name.trim();
        if (name.length < 2) {
          send(res, 400, { error: "Укажи имя" });
          return;
        }
        record.name = name;
      }
      if (typeof body.status === "string") {
        record.status = body.status.trim();
      }

      if (Object.prototype.hasOwnProperty.call(body, "avatarPhoto")) {
        const photoError = setAvatarPhoto(record, body.avatarPhoto);
        if (photoError) {
          send(res, 400, { error: photoError });
          return;
        }
      }

      if (body.avatarFace != null || body.avatarRing != null) {
        const error = wearAvatar(
          record,
          body.avatarFace != null ? body.avatarFace : record.avatarFace,
          body.avatarRing != null ? body.avatarRing : record.avatarRing
        );
        if (error) {
          send(res, 400, { error });
          return;
        }
      }

      if (body.onboardingDone === true && record.emailVerified === false) {
        send(res, 403, { error: "Сначала подтверди почту" });
        return;
      }

      if (body.onboardingDone === true || body.updateProfile === true) {
        const error = applyQuizFields(record, body, { keepStart: body.updateProfile === true });
        if (error) {
          send(res, 400, { error });
          return;
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, "fuelLog")) {
        record.fuelLog = sanitizeFuelLog(body.fuelLog, record.fuelLog);
      } else {
        ensureFuelLog(record);
      }

      delete record.stepLog;
      delete record.stepGoal;
      ensureFreezes(record);
      settleStreak(record);
      ensureDaily(record);
      if (body.shieldNoticeSeen === true && record.shieldSavedDate) {
        record.shieldNoticeSeen = record.shieldSavedDate;
      }
      if (body.activityDone === true && Number(body.elapsedSec) >= MIN_ACTIVITY_SEC) {
        applyActivity(record);
        rememberActivity(record, body);
        const workouts = loadWorkoutsFile();
        const sessionId = String(body.activitySession || "").trim();
        const session = (Array.isArray(workouts.sessions) ? workouts.sessions : []).find((item) => item && item.id === sessionId);
        noteProgramProgress(record, session, {
          unlockEvery: workouts.unlockEvery,
          experienceRank: workouts.experienceRank,
        });
      }
      ensureAchievements(record);

      record.updatedAt = new Date().toISOString();
      saveUser(record);
      send(res, 200, { user: publicUser(record) });
      return;
    }

    if (route === "GET /catalog") {
      send(res, 200, loadCatalog());
      return;
    }

    if (route === "POST /admin/login") {
      const body = await readBody(req);
      const ip = clientIp(req);
      if (tooManyLogins(ip)) {
        send(res, 429, { error: "Слишком много попыток, подожди" });
        return;
      }
      const login = String(body.login || "").trim();
      const password = String(body.password || "");
      if (!verifyAdminLogin(login, password)) {
        send(res, 401, { error: "Логин или пароль не подошли" });
        return;
      }
      const token = createSession();
      send(res, 200, { token });
      return;
    }

    if (route === "POST /admin/logout") {
      const body = await readBody(req);
      revokeSession(bearer(req, body.token));
      send(res, 200, { ok: true });
      return;
    }

    if (route === "GET /admin/stats") {
      if (!findSession(bearer(req, url.searchParams.get("token")))) {
        send(res, 401, { error: "Нужна админ-сессия" });
        return;
      }
      send(res, 200, { stats: buildStats(listUsers()) });
      return;
    }

    if (route === "GET /admin/users") {
      if (!findSession(bearer(req, url.searchParams.get("token")))) {
        send(res, 401, { error: "Нужна админ-сессия" });
        return;
      }
      send(res, 200, { users: listUsers().map(adminUserView) });
      return;
    }

    if (route === "GET /admin/catalog") {
      if (!findSession(bearer(req, url.searchParams.get("token")))) {
        send(res, 401, { error: "Нужна админ-сессия" });
        return;
      }
      send(res, 200, loadCatalog());
      return;
    }

    if (route === "PUT /admin/catalog") {
      const body = await readBody(req);
      if (!findSession(bearer(req, body.token))) {
        send(res, 401, { error: "Нужна админ-сессия" });
        return;
      }
      send(res, 200, saveCatalog(body));
      return;
    }

    if (route === "GET /" || route === "GET /health") {
      send(res, 200, { ok: true, users: "data/users" });
      return;
    }

    const barcodeMatch = url.pathname.match(/^\/barcode\/(\d{8,14})$/);
    if (req.method === "GET" && barcodeMatch) {
      try {
        const food = await lookupBarcode(barcodeMatch[1]);
        if (!food) {
          send(res, 404, { error: "Не нашли в базе, поищи названием" });
          return;
        }
        send(res, 200, { food });
      } catch {
        send(res, 502, { error: "База штрихкодов не ответила" });
      }
      return;
    }

    if (route === "GET /foods/search") {
      const q = String(url.searchParams.get("q") || "").trim();
      try {
        const foods = await searchNutrition(q);
        send(res, 200, { foods });
      } catch {
        send(res, 502, { error: "Поиск по базам не ответил" });
      }
      return;
    }

    send(res, 404, { error: "Нет такого маршрута" });
  } catch (error) {
    send(res, 500, { error: "Сервер не смог сохранить данные" });
  }
});

function sweepStreaks() {
  for (const record of listUsers()) {
    try {
      if (ensureDayLogs(record) || ensureFreezes(record) || ensureAchievements(record) || ensureStatus(record)) {
        record.updatedAt = new Date().toISOString();
        saveUser(record);
      }
    } catch (error) {
      console.error("серия:", record && record.id, error && error.message);
    }
  }
}

server.on("error", (error) => {
  if (error && error.code === "EADDRINUSE") {
    console.error(`Порт ${PORT} уже занят. API уже запущен: http://localhost:${PORT}`);
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Пользователи: ${USERS_DIR}`);
  console.log(`Auth API: http://localhost:${PORT}`);
  console.log(
    process.env.ADMIN_PASSWORD
      ? "Админка: пароль из keys/.env"
      : "Админка: пароль в keys/admin/BOOTSTRAP.txt"
  );
  sweepStreaks();
  setInterval(sweepStreaks, 15 * 60 * 1000);
});
