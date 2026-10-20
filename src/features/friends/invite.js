import { useEffect, useState } from "react";
import { Share } from "react-native";
import { api } from "../auth/api";
import links from "../../../keys/links.json";

const PENDING_KEY = "fitness-invite-id";
const ID = /^[a-f0-9]{16}$/i;

export function isInviteId(value) {
  return ID.test(String(value || ""));
}

function isLoopbackHost(host) {
  return !host || host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function pageInviteOrigin() {
  if (typeof window !== "undefined" && window.location?.origin && !isLoopbackHost(window.location.hostname)) {
    return window.location.origin.replace(/\/$/, "");
  }
  return "";
}

let cachedOrigin = "";

export async function resolveInviteOrigin() {
  const page = pageInviteOrigin();
  if (page) {
    cachedOrigin = page;
    return page;
  }
  try {
    const data = await api("/invite-origin");
    const origin = String(data.origin || "").replace(/\/$/, "");
    if (origin) {
      cachedOrigin = origin;
      return origin;
    }
  } catch {
    // без share остаётся адрес страницы
  }
  if (cachedOrigin) {
    return cachedOrigin;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return String(links.web || "").replace(/\/$/, "");
}

export function useInviteOrigin() {
  const [origin, setOrigin] = useState(() => pageInviteOrigin() || String(links.web || "").replace(/\/$/, ""));
  useEffect(() => {
    let alive = true;
    resolveInviteOrigin().then((next) => {
      if (alive && next) {
        setOrigin(next);
      }
    });
    return () => {
      alive = false;
    };
  }, []);
  return origin;
}

export function captureInvite(pathname) {
  const fromPath = String(pathname || "").match(/\/invite\/([a-f0-9]{16})/i);
  if (fromPath) {
    writePendingInvite(fromPath[1]);
    return fromPath[1].toLowerCase();
  }
  if (typeof window !== "undefined" && window.location?.pathname) {
    const fromWindow = String(window.location.pathname).match(/\/invite\/([a-f0-9]{16})/i);
    if (fromWindow) {
      writePendingInvite(fromWindow[1]);
      return fromWindow[1].toLowerCase();
    }
  }
  return "";
}

export function writePendingInvite(id) {
  const value = String(id || "").toLowerCase();
  if (!isInviteId(value)) {
    return "";
  }
  try {
    globalThis.localStorage?.setItem(PENDING_KEY, value);
  } catch {
    // без хранилища заявка уйдёт только с открытого /invite
  }
  return value;
}

export function takePendingInvite() {
  try {
    const id = String(globalThis.localStorage?.getItem(PENDING_KEY) || "").toLowerCase();
    globalThis.localStorage?.removeItem(PENDING_KEY);
    return isInviteId(id) ? id : "";
  } catch {
    return "";
  }
}

export function inviteLink(userId, origin) {
  const base = String(origin || pageInviteOrigin() || cachedOrigin || links.web || "").replace(/\/$/, "");
  return `${base}/invite/${userId}`;
}

export async function copyInviteLink(userId) {
  const url = inviteLink(userId, await resolveInviteOrigin());
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return url;
  }
  throw new Error("Скопируй ссылку вручную");
}

export async function shareInviteLink(userId) {
  const url = inviteLink(userId, await resolveInviteOrigin());
  try {
    await Share.share({
      title: "Fitness",
      message: `Давай вместе в Fitness\n${url}`,
      url,
    });
    return url;
  } catch {
    return copyInviteLink(userId);
  }
}
