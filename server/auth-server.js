const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { LINKS, loadEnv } = require("./env");
const { lookupBarcode, searchNutrition } = require("./nutrition");

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

const PORT = Number(process.env.AUTH_PORT) || LINKS.apiPort;
const USERS_DIR = path.join(__dirname, "..", "data", "users");

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
  record.weight = {
    start: clamp(start, 40, 160),
    current: clamp(current, 40, 160),
    goal: clamp(goal, 40, 160),
  };
  return null;
}

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

function emptyFuelLog() {
  return { date: utcDay(), items: [] };
}

function ensureFuelLog(record) {
  if (!record.fuelLog || record.fuelLog.date !== utcDay() || !Array.isArray(record.fuelLog.items)) {
    record.fuelLog = emptyFuelLog();
    return true;
  }
  return false;
}

function ensureDayLogs(record) {
  return ensureFuelLog(record);
}

function sanitizeFuelLog(incoming) {
  const today = utcDay();
  if (!incoming || typeof incoming !== "object" || incoming.date !== today) {
    return emptyFuelLog();
  }
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
    const grams = clamp(Number(item.grams) || 0, 0, 5000);
    items.push({
      id: String(item.id || "").trim().slice(0, 40) || `log-${items.length + 1}`,
      foodId,
      grams,
      label: label || foodId,
      kcal: clamp(Number(item.kcal) || 0, 0, 20000),
      protein: clamp(Number(item.protein) || 0, 0, 2000),
      fat: clamp(Number(item.fat) || 0, 0, 2000),
      carbs: clamp(Number(item.carbs) || 0, 0, 2000),
    });
  }
  return { date: today, items };
}

function publicUser(record) {
  ensureDayLogs(record);
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    status: record.status,
    weight: record.weight,
    streak: record.streak || 0,
    onboardingDone: Boolean(record.onboardingDone),
    heightCm: record.heightCm || null,
    birthDate: record.birthDate || null,
    age: record.age || null,
    sex: ALLOWED_SEX.includes(record.sex) ? record.sex : null,
    goals: Array.isArray(record.goals) ? record.goals : [],
    daysPerWeek: record.daysPerWeek || null,
    fuelLog: record.fuelLog,
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
        status: "Двигаюсь мягко",
        streak: 0,
        onboardingDone: false,
        sex: null,
        heightCm: null,
        birthDate: null,
        age: null,
        goals: [],
        daysPerWeek: null,
        weight: {
          start: 70,
          current: 70,
          goal: 70,
        },
        fuelLog: { date: now.slice(0, 10), items: [] },
        tokens: [token],
        createdAt: now,
        updatedAt: now,
      };
      saveUser(record);
      send(res, 201, { token, user: publicUser(record) });
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
      if (ensureDayLogs(record)) {
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
        const status = body.status.trim();
        if (!status) {
          send(res, 400, { error: "Укажи статус" });
          return;
        }
        record.status = status;
      }

      if (body.onboardingDone === true || body.updateProfile === true) {
        const error = applyQuizFields(record, body, { keepStart: body.updateProfile === true });
        if (error) {
          send(res, 400, { error });
          return;
        }
      }

      if (Object.prototype.hasOwnProperty.call(body, "fuelLog")) {
        record.fuelLog = sanitizeFuelLog(body.fuelLog);
      } else {
        ensureFuelLog(record);
      }

      delete record.stepLog;
      delete record.stepGoal;

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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Пользователи: ${USERS_DIR}`);
  console.log(`Auth API: http://localhost:${PORT}`);
  console.log(
    process.env.ADMIN_PASSWORD
      ? "Админка: пароль из keys/.env"
      : "Админка: пароль в keys/admin/BOOTSTRAP.txt"
  );
});
