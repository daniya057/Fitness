const DEFAULT_TZ = "Europe/Moscow";

function localDay(timeZone, now) {
  const tz = timeZone || DEFAULT_TZ;
  const date = now || new Date();
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function todayOf(record, now) {
  return localDay(record?.timeZone || DEFAULT_TZ, now);
}

function applyTimeZone(record, value) {
  const raw = String(value || "").trim();
  if (!raw || raw.length > 64 || !/^[A-Za-z0-9_+\-\/]+$/.test(raw)) {
    return false;
  }
  if (record.timeZone === raw) {
    return false;
  }
  record.timeZone = raw;
  return true;
}

module.exports = {
  DEFAULT_TZ,
  localDay,
  todayOf,
  applyTimeZone,
};
