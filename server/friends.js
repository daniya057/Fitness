const { publicAvatar } = require("./avatar");
const { settleStreak } = require("./streak");
const { todayOf } = require("./day");

const NUDGE_MS = 4 * 60 * 60 * 1000;
const SEARCH_LIMIT = 12;
const NUDGE_KEEP = 20;

function friendIds(record) {
  if (!Array.isArray(record?.friends)) {
    return [];
  }
  return [...new Set(record.friends.filter((id) => typeof id === "string" && id))];
}

function requestIds(record) {
  if (!Array.isArray(record?.incomingRequests)) {
    return [];
  }
  return [...new Set(record.incomingRequests.filter((id) => typeof id === "string" && id))];
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

function ensureRequests(record) {
  if (!record) {
    return false;
  }
  if (!Array.isArray(record.incomingRequests)) {
    record.incomingRequests = [];
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
  const today = todayOf(record);
  const result = settleStreak(record, today);
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

function becomeFriends(self, target) {
  ensureFriends(self);
  ensureFriends(target);
  ensureRequests(self);
  ensureRequests(target);
  if (!self.friends.includes(target.id)) {
    self.friends.push(target.id);
  }
  if (!target.friends.includes(self.id)) {
    target.friends.push(self.id);
  }
  self.incomingRequests = self.incomingRequests.filter((id) => id !== target.id);
  target.incomingRequests = target.incomingRequests.filter((id) => id !== self.id);
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

function outgoingIds(selfId, list) {
  const ids = [];
  for (const record of list || []) {
    if (record && requestIds(record).includes(selfId)) {
      ids.push(record.id);
    }
  }
  return ids;
}

function packSocial(self, list, byId) {
  const listed = listFriendCards(self, byId);
  ensureRequests(self);
  const incoming = [];
  const keptReq = [];
  for (const id of requestIds(self)) {
    if (self.friends.includes(id)) {
      continue;
    }
    const record = byId.get(id);
    if (!record) {
      continue;
    }
    keptReq.push(id);
    const { card, changed } = publicCard(record);
    incoming.push(card);
    if (changed) {
      listed.dirty.push(record);
    }
  }
  if (keptReq.length !== self.incomingRequests.length) {
    self.incomingRequests = keptReq;
    listed.dirty.push(self);
  }
  return {
    friends: listed.friends,
    incoming,
    outgoing: outgoingIds(self.id, list),
    dirty: listed.dirty,
  };
}

function normalizeAsymmetric(list) {
  const byId = new Map((list || []).map((user) => [user.id, user]));
  const dirty = new Set();
  for (const self of list || []) {
    if (!self) {
      continue;
    }
    ensureFriends(self);
    ensureRequests(self);
    const kept = [];
    for (const id of friendIds(self)) {
      const other = byId.get(id);
      if (!other) {
        continue;
      }
      ensureFriends(other);
      ensureRequests(other);
      if (other.friends.includes(self.id)) {
        kept.push(id);
        continue;
      }
      if (!other.incomingRequests.includes(self.id) && !self.incomingRequests.includes(id)) {
        other.incomingRequests.push(self.id);
        dirty.add(other);
      }
    }
    if (kept.length !== self.friends.length) {
      self.friends = kept;
      dirty.add(self);
    }
  }
  return [...dirty];
}

function requestFriend(self, target) {
  if (!target) {
    return { error: "Нет такого человека" };
  }
  if (self.id === target.id) {
    return { error: "Это ты" };
  }
  ensureFriends(self);
  ensureFriends(target);
  ensureRequests(self);
  ensureRequests(target);
  if (self.friends.includes(target.id) && target.friends.includes(self.id)) {
    return { status: "friends" };
  }
  if (self.incomingRequests.includes(target.id)) {
    becomeFriends(self, target);
    return { status: "friends" };
  }
  if (target.incomingRequests.includes(self.id)) {
    return { status: "requested" };
  }
  target.incomingRequests.push(self.id);
  return { status: "requested" };
}

function acceptRequest(self, target) {
  if (!target) {
    return { error: "Нет такого человека" };
  }
  ensureRequests(self);
  if (!self.incomingRequests.includes(target.id)) {
    return { error: "Нет такой заявки" };
  }
  becomeFriends(self, target);
  return { status: "friends" };
}

function declineRequest(self, target) {
  if (!target) {
    return { error: "Нет такого человека" };
  }
  ensureRequests(self);
  const next = self.incomingRequests.filter((id) => id !== target.id);
  if (next.length === self.incomingRequests.length) {
    return { error: "Нет такой заявки" };
  }
  self.incomingRequests = next;
  return { status: "declined" };
}

function removeFriend(self, target) {
  if (!target) {
    return "Нет такого человека";
  }
  ensureFriends(self);
  ensureFriends(target);
  const had = self.friends.includes(target.id) || target.friends.includes(self.id);
  self.friends = self.friends.filter((id) => id !== target.id);
  target.friends = target.friends.filter((id) => id !== self.id);
  if (!had) {
    return "Его нет в списке";
  }
  return null;
}

function nudgeFriend(self, target) {
  if (!target) {
    return "Нет такого человека";
  }
  ensureFriends(self);
  ensureFriends(target);
  if (!self.friends.includes(target.id) || !target.friends.includes(self.id)) {
    return "Сначала друзья";
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

function forgetPerson(list, id) {
  const dirty = [];
  for (const record of list || []) {
    if (!record || record.id === id) {
      continue;
    }
    let changed = false;
    if (Array.isArray(record.friends) && record.friends.includes(id)) {
      record.friends = record.friends.filter((item) => item !== id);
      changed = true;
    }
    if (Array.isArray(record.incomingRequests) && record.incomingRequests.includes(id)) {
      record.incomingRequests = record.incomingRequests.filter((item) => item !== id);
      changed = true;
    }
    if (Array.isArray(record.nudges)) {
      const next = record.nudges.filter((item) => item && item.from !== id);
      if (next.length !== record.nudges.length) {
        record.nudges = next;
        changed = true;
      }
    }
    if (changed) {
      dirty.push(record);
    }
  }
  return dirty;
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
  acceptRequest,
  declineRequest,
  ensureFriends,
  ensureNudges,
  ensureRequests,
  forgetPerson,
  listFriendCards,
  markNudgesSeen,
  normalizeAsymmetric,
  nudgeFriend,
  packSocial,
  publicCard,
  removeFriend,
  requestFriend,
  searchPeople,
  unreadNudges,
};
