export const DEFAULT_TZ = "Europe/Moscow";

export function guessTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;
  } catch {
    return DEFAULT_TZ;
  }
}

export function localDay(timeZone, now = new Date()) {
  const tz = timeZone || guessTimeZone();
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function localHour(timeZone, now = new Date()) {
  const tz = timeZone || guessTimeZone();
  try {
    const part = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .find((item) => item.type === "hour");
    return Number(part?.value) || 0;
  } catch {
    return now.getHours();
  }
}

export function weekdayMon0(timeZone, now = new Date()) {
  const tz = timeZone || guessTimeZone();
  try {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(now);
    return { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[wd] ?? 0;
  } catch {
    const day = now.getDay();
    return day === 0 ? 6 : day - 1;
  }
}

export function msUntilMidnight(timeZone, now = new Date()) {
  const tz = timeZone || guessTimeZone();
  try {
    const parts = {};
    for (const item of new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now)) {
      if (item.type !== "literal") {
        parts[item.type] = Number(item.value);
      }
    }
    const passed = ((parts.hour || 0) * 3600 + (parts.minute || 0) * 60 + (parts.second || 0)) * 1000;
    return Math.max(0, 86400000 - passed);
  } catch {
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return Math.max(0, next - now.getTime());
  }
}

export function zoneOf(user) {
  return user?.timeZone || guessTimeZone();
}
