const DEFAULT_FACE = "user";
const DEFAULT_RING = "mint";
const MAX_PHOTO = 180000;

const FACES = {
  user: null,
  photo: null,
  first: "first",
  kindStrength: "kindStrength",
  kindWalk: "kindWalk",
  warmupMorning: "warmupMorning",
  warmupEvening: "warmupEvening",
  fuel: "fuel",
};

const RINGS = {
  mint: null,
  streak3: "streak3",
  streak7: "streak7",
  streak30: "streak30",
  shield: "shield",
  shieldSave: "shieldSave",
  dailyDay: "dailyDay",
  warmupDay: "warmupDay",
  allKinds: "allKinds",
  hundred: "hundred",
};

function earnedSet(record) {
  return new Set(Array.isArray(record?.achievements) ? record.achievements : []);
}

function unlocked(record, need) {
  if (!need) {
    return true;
  }
  return earnedSet(record).has(need);
}

function normalizeFace(id, record) {
  if (id === "photo" && record?.avatarPhoto) {
    return "photo";
  }
  return Object.prototype.hasOwnProperty.call(FACES, id) && id !== "photo" ? id : DEFAULT_FACE;
}

function normalizeRing(id) {
  return Object.prototype.hasOwnProperty.call(RINGS, id) ? id : DEFAULT_RING;
}

function setAvatarPhoto(record, value) {
  if (value === "" || value == null) {
    record.avatarPhoto = "";
    if (record.avatarFace === "photo") {
      record.avatarFace = DEFAULT_FACE;
    }
    return null;
  }
  const raw = String(value);
  if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(raw) || raw.length > MAX_PHOTO) {
    return "Фото слишком тяжёлое или формат не тот";
  }
  record.avatarPhoto = raw;
  record.avatarFace = "photo";
  return null;
}

function wearAvatar(record, faceId, ringId) {
  const face = normalizeFace(String(faceId || DEFAULT_FACE), record);
  const ring = normalizeRing(String(ringId || DEFAULT_RING));
  if (face === "photo" && !record.avatarPhoto) {
    return "Сначала поставь фото";
  }
  if (!unlocked(record, FACES[face])) {
    return "Это лицо ещё закрыто";
  }
  if (!unlocked(record, RINGS[ring])) {
    return "Эта окантовка ещё закрыта";
  }
  record.avatarFace = face;
  record.avatarRing = ring;
  return null;
}

function publicAvatar(record) {
  const face = normalizeFace(record?.avatarFace, record);
  const ring = normalizeRing(record?.avatarRing);
  return {
    avatarFace: unlocked(record, FACES[face]) ? face : DEFAULT_FACE,
    avatarRing: unlocked(record, RINGS[ring]) ? ring : DEFAULT_RING,
    avatarPhoto: record?.avatarPhoto || "",
  };
}

module.exports = { DEFAULT_FACE, DEFAULT_RING, setAvatarPhoto, wearAvatar, publicAvatar };
