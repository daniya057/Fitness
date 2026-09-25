const { spawn } = require("child_process");
const { loadEnv } = require("../server/env");
const { GATEWAY_PORT, startGateway } = require("./gateway");

loadEnv();

function originFromEnv() {
  const known = String(process.env.SHARE_PUBLIC_URL || "").trim().replace(/\/$/, "");
  if (known) {
    return known;
  }
  const domain = String(process.env.NGROK_DOMAIN || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  if (domain) {
    return `https://${domain}`;
  }
  return "";
}

function apiUrlFromOrigin(origin) {
  return `${String(origin || "").replace(/\/$/, "")}/api`;
}

function run(command, args, extraEnv = {}) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, CI: "1", ...extraEnv },
  });
}

const ngrokToken = String(process.env.NGROK_AUTHTOKEN || "").trim();
const ngrokDomain = String(process.env.NGROK_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//i, "");
const cfToken = String(process.env.CLOUDFLARE_TUNNEL_TOKEN || "").trim();

if (!ngrokToken && !cfToken) {
  console.error("Для Expo Go с любой сети нужны NGROK_AUTHTOKEN и NGROK_DOMAIN в keys/.env (см. keys/README.md).");
  process.exit(1);
}

startGateway();
run("node", ["server/auth-server.js"]);

let expoStarted = false;

function startExpo(origin) {
  if (expoStarted || !origin) {
    return;
  }
  expoStarted = true;
  const apiUrl = apiUrlFromOrigin(origin);
  console.log("");
  console.log("Expo Go с любой сети:");
  console.log("1. На iPhone открой Expo Go (App Store).");
  console.log("2. Наведи камеру на QR ниже.");
  console.log(`API: ${apiUrl}`);
  console.log("Комп не усыпляй, это окно не закрывай.");
  console.log("");
  run("npx", ["expo", "start", "--tunnel"], { EXPO_PUBLIC_API_URL: apiUrl });
}

const preset = originFromEnv();
if (preset) {
  startExpo(preset);
}

if (cfToken) {
  console.log("Именной туннель Cloudflare…");
  run("npx", ["--yes", "cloudflared", "tunnel", "run", "--token", cfToken]);
} else {
  console.log("Туннель ngrok для API…");
  process.env.NGROK_AUTHTOKEN = ngrokToken;
  const args = ["--yes", "ngrok", "http", String(GATEWAY_PORT), "--authtoken", ngrokToken];
  if (ngrokDomain) {
    args.push("--url", `https://${ngrokDomain}`);
  }
  const child = spawn("npx", args, { shell: true, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  const onChunk = (buf) => {
    const text = buf.toString();
    process.stderr.write(text);
    const match = text.match(/https:\/\/[a-z0-9.-]+\.ngrok(?:-free)?\.(?:app|dev|io)/i);
    if (match) {
      startExpo(match[0].replace(/\/$/, ""));
    }
  };
  child.stdout.on("data", onChunk);
  child.stderr.on("data", onChunk);
  child.on("exit", (code) => {
    if (!expoStarted) {
      process.exit(code || 1);
    }
  });

  if (!preset) {
    (async () => {
      for (let i = 0; i < 40; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        try {
          const data = await fetch("http://127.0.0.1:4040/api/tunnels").then((res) => res.json());
          const tunnel = (data.tunnels || []).find((item) => String(item.public_url || "").startsWith("https://"));
          if (tunnel) {
            startExpo(String(tunnel.public_url).replace(/\/$/, ""));
            return;
          }
        } catch {
          // Инспектор ещё не готов.
        }
      }
    })();
  }
}
