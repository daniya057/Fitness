const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LINKS = require("../keys/links.json");

function applyEnvFile(file) {
  if (!fs.existsSync(file)) {
    return;
  }
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function loadEnv() {
  applyEnvFile(path.join(ROOT, "keys", ".env"));
  applyEnvFile(path.join(ROOT, ".env"));
}

module.exports = { LINKS, ROOT, loadEnv };
