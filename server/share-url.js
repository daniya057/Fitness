const fs = require("fs");
const path = require("path");
const { ROOT } = require("./env");

const SHARE_FILE = path.join(ROOT, "keys", "share-url.json");

function publicOriginFromEnv() {
  const known = String(process.env.SHARE_PUBLIC_URL || "")
    .trim()
    .replace(/\/$/, "");
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

function writeShareUrl(url) {
  const origin = String(url || "").replace(/\/$/, "");
  if (!/^https?:\/\//i.test(origin)) {
    return;
  }
  fs.writeFileSync(SHARE_FILE, `${JSON.stringify({ url: origin, at: new Date().toISOString() }, null, 2)}\n`);
}

function clearShareUrl() {
  try {
    fs.unlinkSync(SHARE_FILE);
  } catch {
    // файла ещё не было
  }
}

function readShareOrigin() {
  try {
    const raw = JSON.parse(fs.readFileSync(SHARE_FILE, "utf8"));
    const url = String(raw.url || "").replace(/\/$/, "");
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
  } catch {
    // share ещё не писал адрес
  }
  return publicOriginFromEnv();
}

module.exports = {
  clearShareUrl,
  readShareOrigin,
  writeShareUrl,
};
