const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ADMIN_DIR = path.join(ROOT, "keys", "admin");
const CONTENT_DIR = path.join(ROOT, "data", "content");
const CREDENTIALS_FILE = path.join(ADMIN_DIR, "credentials.json");
const SESSIONS_FILE = path.join(ADMIN_DIR, "sessions.json");
const BOOTSTRAP_FILE = path.join(ADMIN_DIR, "BOOTSTRAP.txt");
const CATALOG_FILE = path.join(CONTENT_DIR, "catalog.json");

const ALLOWED_GOALS = ["strength", "run", "nutrition", "walk", "stretch", "bike"];
const SESSION_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 8;

const DEFAULT_CATALOG = {
  daily: {
    strength: { title: "Задание дня", hint: "Силовая микро-сессия" },
    run: { title: "Задание дня", hint: "Лёгкий бег" },
    nutrition: { title: "Задание дня", hint: "Осознанный приём пищи" },
    walk: { title: "Задание дня", hint: "Тихая прогулка" },
    stretch: { title: "Задание дня", hint: "Растяжка на 2 мин" },
    bike: { title: "Задание дня", hint: "Короткая велосессия" },
  },
  missions: {
    strength: { id: "strength", title: "Силовая разминка", time: "8 мин", xp: 16 },
    run: { id: "run", title: "Лёгкий бег", time: "10 мин", xp: 18 },
    nutrition: { id: "nutrition", title: "Спокойный приём пищи", time: "15 мин", xp: 10 },
    walk: { id: "walk", title: "Тихая прогулка", time: "12 мин", xp: 14 },
    stretch: { id: "stretch", title: "Растяжка", time: "6 мин", xp: 12 },
    bike: { id: "bike", title: "Велосессия", time: "12 мин", xp: 16 },
  },
};

fs.mkdirSync(ADMIN_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });

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

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function randomPassword() {
  return crypto.randomBytes(12).toString("base64url");
}

function ensureAdminCredentials() {
  const login = String(process.env.ADMIN_LOGIN || "admin").trim() || "admin";
  const envPassword = String(process.env.ADMIN_PASSWORD || "");
  if (envPassword.length >= 10) {
    return { login, passwordHash: hashPassword(envPassword), fromEnv: true };
  }

  const saved = readJson(CREDENTIALS_FILE, null);
  if (saved?.login && saved?.passwordHash) {
    return { login: saved.login, passwordHash: saved.passwordHash, fromEnv: false };
  }

  const password = randomPassword();
  const record = { login, passwordHash: hashPassword(password) };
  writeJson(CREDENTIALS_FILE, record);
  fs.writeFileSync(
    BOOTSTRAP_FILE,
    `Логин: ${login}\nПароль: ${password}\n\nСкопируй и удали этот файл. Потом лучше задать ADMIN_PASSWORD в keys/.env\n`,
    "utf8"
  );
  console.warn(`Админка: первый пароль записан в ${BOOTSTRAP_FILE}`);
  return { ...record, fromEnv: false };
}

function verifyAdminLogin(login, password) {
  const creds = ensureAdminCredentials();
  if (login !== creds.login) {
    checkPassword(password, creds.passwordHash);
    return false;
  }
  return checkPassword(password, creds.passwordHash);
}

const loginHits = new Map();

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function tooManyLogins(ip) {
  const now = Date.now();
  const row = loginHits.get(ip) || { n: 0, reset: now + LOGIN_WINDOW_MS };
  if (now > row.reset) {
    row.n = 0;
    row.reset = now + LOGIN_WINDOW_MS;
  }
  row.n += 1;
  loginHits.set(ip, row);
  return row.n > LOGIN_MAX;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function loadSessions() {
  const rows = readJson(SESSIONS_FILE, []);
  const now = Date.now();
  const alive = rows.filter((row) => row.expiresAt > now);
  if (alive.length !== rows.length) {
    writeJson(SESSIONS_FILE, alive);
  }
  return alive;
}

function createSession() {
  const token = `adm_${crypto.randomBytes(32).toString("hex")}`;
  const sessions = loadSessions();
  sessions.push({
    tokenHash: hashToken(token),
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + SESSION_MS,
  });
  writeJson(SESSIONS_FILE, sessions.slice(-20));
  return token;
}

function findSession(token) {
  if (!token || !String(token).startsWith("adm_")) {
    return null;
  }
  const tokenHash = hashToken(token);
  return loadSessions().find((row) => row.tokenHash === tokenHash) || null;
}

function revokeSession(token) {
  if (!token) {
    return;
  }
  const tokenHash = hashToken(token);
  writeJson(
    SESSIONS_FILE,
    loadSessions().filter((row) => row.tokenHash !== tokenHash)
  );
}

function clip(text, max) {
  return String(text || "").trim().slice(0, max);
}

function sanitizeCatalog(input) {
  const source = input && typeof input === "object" ? input : {};
  const daily = {};
  const missions = {};
  for (const id of ALLOWED_GOALS) {
    const dailyRow = source.daily?.[id] || {};
    const missionRow = source.missions?.[id] || {};
    const title = clip(dailyRow.title, 40) || DEFAULT_CATALOG.daily[id].title;
    const hint = clip(dailyRow.hint, 80) || DEFAULT_CATALOG.daily[id].hint;
    const missionTitle = clip(missionRow.title, 60) || DEFAULT_CATALOG.missions[id].title;
    const time = clip(missionRow.time, 16) || DEFAULT_CATALOG.missions[id].time;
    const xp = Math.round(Number(missionRow.xp));
    daily[id] = { title, hint };
    missions[id] = {
      id,
      title: missionTitle,
      time,
      xp: Number.isFinite(xp) && xp >= 1 && xp <= 99 ? xp : DEFAULT_CATALOG.missions[id].xp,
    };
  }
  return { daily, missions };
}

function loadCatalog() {
  const raw = readJson(CATALOG_FILE, null);
  const catalog = sanitizeCatalog(raw || DEFAULT_CATALOG);
  if (!raw) {
    writeJson(CATALOG_FILE, catalog);
  }
  return catalog;
}

function saveCatalog(body) {
  const catalog = sanitizeCatalog(body);
  writeJson(CATALOG_FILE, catalog);
  return catalog;
}

function adminUserView(record) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    status: record.status,
    streak: record.streak || 0,
    onboardingDone: Boolean(record.onboardingDone),
    heightCm: record.heightCm || null,
    birthDate: record.birthDate || null,
    age: record.age || null,
    goals: Array.isArray(record.goals) ? record.goals : [],
    daysPerWeek: record.daysPerWeek || null,
    weight: record.weight || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt || null,
  };
}

function buildStats(users) {
  const onboarded = users.filter((user) => user.onboardingDone);
  const today = new Date().toISOString().slice(0, 10);
  const ages = onboarded.map((user) => Number(user.age)).filter((value) => Number.isFinite(value) && value > 0);
  const streaks = users.map((user) => Number(user.streak) || 0);
  const days = onboarded.map((user) => Number(user.daysPerWeek)).filter((value) => Number.isFinite(value));
  const goals = {};
  for (const id of ALLOWED_GOALS) {
    goals[id] = 0;
  }
  for (const user of users) {
    for (const id of user.goals || []) {
      if (goals[id] != null) {
        goals[id] += 1;
      }
    }
  }
  const avg = (list) => (list.length ? Math.round((list.reduce((sum, value) => sum + value, 0) / list.length) * 10) / 10 : 0);
  return {
    usersTotal: users.length,
    onboarded: onboarded.length,
    newToday: users.filter((user) => String(user.createdAt || "").startsWith(today)).length,
    avgAge: avg(ages),
    avgStreak: avg(streaks),
    avgDaysPerWeek: avg(days),
    goals,
  };
}

module.exports = {
  ALLOWED_GOALS,
  clientIp,
  tooManyLogins,
  verifyAdminLogin,
  createSession,
  findSession,
  revokeSession,
  loadCatalog,
  saveCatalog,
  adminUserView,
  buildStats,
};
