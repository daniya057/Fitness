const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.AUTH_PORT) || 8787;
const USERS_DIR = path.join(__dirname, "..", "data", "users");

fs.mkdirSync(USERS_DIR, { recursive: true });

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(json),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
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

function publicUser(record) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    status: record.status,
    weight: record.weight,
    streak: record.streak,
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
      "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
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
      const current = Number(body.weight);
      const goal = Number(body.goal);

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
        streak: 1,
        weight: {
          start: Number.isFinite(current) && current > 0 ? current : 78.5,
          current: Number.isFinite(current) && current > 0 ? current : 78.5,
          goal: Number.isFinite(goal) && goal > 0 ? goal : 72,
        },
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
      if (typeof body.name === "string" && body.name.trim().length >= 2) {
        record.name = body.name.trim();
      }
      if (typeof body.status === "string" && body.status.trim()) {
        record.status = body.status.trim();
      }
      record.updatedAt = new Date().toISOString();
      saveUser(record);
      send(res, 200, { user: publicUser(record) });
      return;
    }

    send(res, 404, { error: "Нет такого маршрута" });
  } catch (error) {
    send(res, 500, { error: "Сервер не смог сохранить данные" });
  }
});

server.listen(PORT, () => {
  console.log(`Пользователи: ${USERS_DIR}`);
  console.log(`Auth API: http://localhost:${PORT}`);
});
