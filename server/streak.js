function utcDay(now) {
  return (now || new Date()).toISOString().slice(0, 10);
}

function addUtcDays(day, count) {
  const start = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(start)) {
    return day;
  }
  return new Date(start + count * 86400000).toISOString().slice(0, 10);
}

function dayGap(from, to) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  return Math.round((end - start) / 86400000);
}

function clamp(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return min;
  }
  return Math.max(min, Math.min(max, n));
}

function settleStreak(record, today) {
  const day = today || utcDay();
  const yesterday = addUtcDays(day, -1);
  const result = { changed: false, saved: false, broken: false };

  if (!record || !record.lastActivityDate) {
    if (record && record.streakSettledDate !== yesterday) {
      record.streakSettledDate = yesterday;
      result.changed = true;
    }
    return result;
  }

  const last = record.lastActivityDate;
  if (last >= yesterday) {
    if (record.streakSettledDate !== yesterday) {
      record.streakSettledDate = yesterday;
      result.changed = true;
    }
    return result;
  }

  let cursor = addUtcDays(last, 1);
  if (record.streakSettledDate && record.streakSettledDate >= last) {
    const after = addUtcDays(record.streakSettledDate, 1);
    if (after > cursor) {
      cursor = after;
    }
  }

  while (cursor <= yesterday) {
    if ((Number(record.streak) || 0) <= 0) {
      break;
    }
    const freezes = Number(record.freezesLeft) || 0;
    if (freezes > 0) {
      record.freezesLeft = clamp(freezes - 1, 0, 20);
      record.shieldUsed = true;
      record.shieldSavedDate = day;
      result.saved = true;
      result.changed = true;
    } else {
      record.streak = 0;
      record.cleanStreak = 0;
      result.broken = true;
      result.changed = true;
      break;
    }
    cursor = addUtcDays(cursor, 1);
  }

  if (record.streakSettledDate !== yesterday) {
    record.streakSettledDate = yesterday;
    result.changed = true;
  }
  return result;
}

function shieldNoticeOpen(record, today) {
  const day = today || utcDay();
  if (!record || !record.shieldSavedDate) {
    return false;
  }
  return record.shieldNoticeSeen !== record.shieldSavedDate && record.shieldSavedDate <= day;
}

module.exports = {
  utcDay,
  addUtcDays,
  dayGap,
  clamp,
  settleStreak,
  shieldNoticeOpen,
};
