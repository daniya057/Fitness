const { publicAvatar } = require("./avatar");
const { settleStreak, utcDay } = require("./streak");

const NUDGE_MS = 4 * 60 * 60 * 1000;
const SEARCH_LIMIT = 12;
const NUDGE_KEEP = 20;

function friendIds(record) {
  if (!Array.isArray(record?.friends)) {
    return [];
  }
  return [...new Set(record.friends.filter((id) => typeof id === "string" && id))];
}

function ensureFriends(record) {
  if (!record) {
    return false;
  }
  if (!Array.isArray(record.friends)) {
    record.friends = [];
    return true;
  }
  return false;
}

function ensureNudges(record) {
  if (!record) {
    return false;
  }
  if (!Array.isArray(record.nudges)) {
    record.nudges = [];
    return true;
  }
  return false;
}

function publicCard(record) {
  const result = settleStreak(record);
  const today = utcDay();
  const daily = record.daily && record.daily.date === today ? record.daily : null;
  return {
    changed: Boolean(result.changed),
    card: {
      id: record.id,
      name: record.name,
      status: record.status || "",
      streak: record.streak || 0,
      lastActivityDate: record.lastActivityDate || null,
      activityToday: record.lastActivityDate === today,
      freezesLeft: Number(record.freezesLeft) || 0,
      activityCount: Number(record.activityCount) || 0,
      cleanStreak: Number(record.cleanStreak) || 0,
      kindsDone: Array.isArray(record.kindsDone) ? record.kindsDone : [],
      dailyDoneCount: Number(record.dailyDoneCount) || 0,
      dailyClearDays: Number(record.dailyClearDays) || 0,
      todayTaskDone: Array.isArray(daily?.done) ? daily.done.length : 0,
      todayTaskTotal: Array.isArray(daily?.tasks) ? daily.tasks.length : 0,
      achievements: Array.isArray(record.achievements) ? record.achievements : [],
      createdAt: record.createdAt || null,
      ...publicAvatar(record),
    },
  };
}

function searchPeople(list, query, selfId) {
  const needle = String(query || "").trim().toLowerCase();
  if (needle.length < 2) {
    return { error: "Напиши хотя бы 2 буквы" };
  }
  const hits = [];
  const dirty = [];
  for (const record of list) {
    if (!record || record.id === selfId) {
      continue;
    }
    const name = String(record.name || "").toLowerCase();
    if (!name.includes(needle)) {
      continue;
    }
    const { card, changed } = publicCard(record);
    hits.push(card);
    if (changed) {
      dirty.push(record);
    }
    if (hits.length >= SEARCH_LIMIT) {
      break;
    }
  }
  return { people: hits, dirty };
}

function listFriendCards(self, byId) {
  ensureFriends(self);
  const cards = [];
  const dirty = [];
  const kept = [];
  for (const id of friendIds(self)) {
    const record = byId.get(id);
    if (!record) {
      continue;
    }
    kept.push(id);
    const { card, changed } = publicCard(record);
    cards.push(card);
    if (changed) {
      dirty.push(record);
    }
  }
  if (kept.length !== self.friends.length) {
    self.friends = kept;
    dirty.push(self);
  }
  return { friends: cards, dirty };
}

function addFriend(self, target) {
  if (!target) {
    return "Нет такого человека";
  }
  if (self.id === target.id) {
    return "Это ты";
  }
  ensureFriends(self);
  if (self.friends.includes(target.id)) {
    return null;
  }
  self.friends.push(target.id);
  return null;
}

function removeFriend(self, id) {
  ensureFriends(self);
  const next = self.friends.filter((item) => item !== id);
  if (next.length === self.friends.length) {
    return "Его нет в списке";
  }
  self.friends = next;
  return null;
}

function nudgeFriend(self, target) {
  if (!target) {
    return "Нет такого человека";
  }
  ensureFriends(self);
  if (!self.friends.includes(target.id)) {
    return "Сначала добавь";
  }
  ensureNudges(target);
  const now = Date.now();
  const recent = target.nudges.find((item) => item && item.from === self.id && Date.parse(item.at) > now - NUDGE_MS);
  if (recent) {
    return "Подожди немного";
  }
  target.nudges.push({ from: self.id, at: new Date().toISOString(), seen: false });
  target.nudges = target.nudges.slice(-NUDGE_KEEP);
  return null;
}

function unreadNudges(record, byId) {
  ensureNudges(record);
  return record.nudges
    .filter((item) => item && !item.seen)
    .map((item) => ({
      from: item.from,
      fromName: byId.get(item.from)?.name || "Друг",
      at: item.at,
    }));
}

function markNudgesSeen(record) {
  ensureNudges(record);
  let changed = false;
  for (const item of record.nudges) {
    if (item && !item.seen) {
      item.seen = true;
      changed = true;
    }
  }
  return changed;
}

module.exports = {
  addFriend,
  ensureFriends,
  ensureNudges,
  listFriendCards,
  markNudgesSeen,
  nudgeFriend,
  publicCard,
  removeFriend,
  searchPeople,
  unreadNudges,
};
