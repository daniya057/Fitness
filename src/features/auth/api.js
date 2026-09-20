import links from "../../../keys/links.json";

const TOKEN_KEY = "fitness.auth.token";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || links.api;

export function readToken() {
  try {
    return globalThis.localStorage?.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function writeToken(token) {
  try {
    if (token) {
      globalThis.localStorage?.setItem(TOKEN_KEY, token);
    } else {
      globalThis.localStorage?.removeItem(TOKEN_KEY);
    }
  } catch {
    // На вебе без localStorage сессия живёт только в памяти.
  }
}

export async function api(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
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
