const { spawn } = require("child_process");
const { loadEnv } = require("../server/env");
const { GATEWAY_PORT, startGateway } = require("./gateway");

loadEnv();
startGateway();

const origin = `http://127.0.0.1:${GATEWAY_PORT}`;
const cfToken = String(process.env.CLOUDFLARE_TUNNEL_TOKEN || "").trim();
const ngrokToken = String(process.env.NGROK_AUTHTOKEN || "").trim();
const ngrokDomain = String(process.env.NGROK_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//i, "");
const knownUrl = String(process.env.SHARE_PUBLIC_URL || "").trim().replace(/\/$/, "");

console.log("Нужны сайт и API: в другом окне npm run dev");

let printed = false;

function printUrl(url, stable) {
  if (!url || printed) {
    return;
  }
  printed = true;
  console.log("");
  console.log(`С телефона с любой сети: ${url}`);
  console.log(`Админка: ${url}/admin`);
  if (stable) {
    console.log("Адрес тот же при каждом запуске. Окно share не закрывай, комп не усыпляй.");
  } else {
    console.log("Это одноразовая ссылка Cloudflare. Для постоянной — NGROK_AUTHTOKEN в keys/.env (см. keys/README.md).");
    console.log("Ссылка живёт, пока это окно открыто.");
  }
}

function pipeAndWatch(child, patterns, stable) {
  const onChunk = (buf) => {
    const text = buf.toString();
    process.stderr.write(text);
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        printUrl(match[0].replace(/\/$/, ""), stable);
        return;
      }
    }
  };
  child.stdout.on("data", onChunk);
  child.stderr.on("data", onChunk);
  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}

async function waitNgrokUrl() {
  for (let i = 0; i < 40; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      const data = await fetch("http://127.0.0.1:4040/api/tunnels").then((res) => res.json());
      const tunnel = (data.tunnels || []).find((item) => String(item.public_url || "").startsWith("https://"));
      if (tunnel) {
        return tunnel.public_url.replace(/\/$/, "");
      }
    } catch {
      // Инспектор ngrok ещё не поднялся.
    }
  }
  return "";
}

if (cfToken) {
  console.log("Именной туннель Cloudflare (стабильный адрес)…");
  if (knownUrl) {
    printUrl(knownUrl, true);
  } else {
    console.log("Задай SHARE_PUBLIC_URL в keys/.env — тот hostname, что указал в Zero Trust.");
  }
  const child = spawn(
    "npx",
    ["--yes", "cloudflared", "tunnel", "run", "--token", cfToken],
    { shell: true }
  );
  pipeAndWatch(child, [], true);
} else if (ngrokToken) {
  console.log("Стабильный адрес ngrok…");
  process.env.NGROK_AUTHTOKEN = ngrokToken;
  const args = ["--yes", "ngrok", "http", String(GATEWAY_PORT), "--authtoken", ngrokToken];
  if (ngrokDomain) {
    args.push("--url", `https://${ngrokDomain}`);
  }
  const child = spawn("npx", args, { shell: true, env: process.env });
  const patterns = [/https:\/\/[a-z0-9.-]+\.ngrok(?:-free)?\.(?:app|dev|io)/i];
  pipeAndWatch(child, patterns, true);
  waitNgrokUrl().then((url) => {
    if (url) {
      printUrl(url, true);
    }
  });
} else {
  console.log("Открываю одноразовую ссылку Cloudflare…");
  const child = spawn(
    "npx",
    ["--yes", "cloudflared", "tunnel", "--url", origin],
    { shell: true }
  );
  pipeAndWatch(child, [/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i], false);
}
