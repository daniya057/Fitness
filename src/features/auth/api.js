import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import links from "../../../keys/links.json";

const TOKEN_KEY = "fitness.auth.token";

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function configuredApi() {
  return String(process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");
}

function resolveApiUrl() {
  const loc = globalThis.location;
  const configured = configuredApi();

  if (Platform.OS !== "web") {
    if (!configured) {
      return "";
    }
    try {
      if (isLoopback(new URL(configured).hostname)) {
        return "";
      }
    } catch {
      return "";
    }
    return configured;
  }

  if (configured) {
    try {
      const host = new URL(configured).hostname;
      if (!isLoopback(host) || !loc?.hostname || isLoopback(loc.hostname)) {
        return configured;
      }
    } catch {
      // Неверный EXPO_PUBLIC_API_URL — берём адрес страницы.
    }
  }
  if (!loc?.hostname) {
    return links.api;
  }
  const webPort = String(links.webPort || 8081);
  const pagePort = loc.port || (loc.protocol === "https:" ? "443" : "80");
  if (pagePort === webPort) {
    return `http://${loc.hostname}:${links.apiPort || 8787}`;
  }
  return `${loc.protocol}//${loc.host}/api`;
}

export const API_URL = resolveApiUrl();

export async function readToken() {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) || "";
    } catch {
      return "";
    }
  }
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) || "";
  } catch {
    return "";
  }
}

export async function writeToken(token) {
  if (Platform.OS === "web") {
    try {
      if (token) {
        globalThis.localStorage?.setItem(TOKEN_KEY, token);
      } else {
        globalThis.localStorage?.removeItem(TOKEN_KEY);
      }
    } catch {
      // На вебе без localStorage сессия живёт только в памяти.
    }
    return;
  }
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Нативный стор недоступен — сессия только в памяти.
  }
}

export async function api(path, { method = "GET", token, body } = {}) {
  if (!API_URL) {
    throw new Error("Нет адреса API. На компе запусти npm run go.");
  }
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (/ngrok/i.test(API_URL)) {
    headers["ngrok-skip-browser-warning"] = "1";
  }
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Не получилось связаться с сервером");
  }
  return data;
}
