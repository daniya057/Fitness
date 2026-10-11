import { Camera, Dumbbell, Footprints, Medal, Moon, Sparkles, Sun, User, Utensils } from "lucide-react-native";
import { earnedSet } from "../achievements/catalog";

export const DEFAULT_FACE = "user";
export const DEFAULT_RING = "mint";

export const FACES = [
  { id: "user", need: null, title: "Свой", Icon: User, ink: "#9BFFC8" },
  { id: "photo", need: null, title: "Фото", Icon: Camera, ink: "#9BFFC8" },
  { id: "first", need: "first", title: "Первый шаг", Icon: Medal, ink: "#FFE082" },
  { id: "kindStrength", need: "kindStrength", title: "Силовая", Icon: Dumbbell, ink: "#FFFFFF" },
  { id: "kindWalk", need: "kindWalk", title: "Прогулка", Icon: Footprints, ink: "#B2FF59" },
  { id: "warmupMorning", need: "warmupMorning", title: "Утро", Icon: Sun, ink: "#FFCC80" },
  { id: "warmupEvening", need: "warmupEvening", title: "Вечер", Icon: Moon, ink: "#B39DDB" },
  { id: "fuel", need: "fuel", title: "Тарелка", Icon: Utensils, ink: "#A5D6A7" },
];

export const RINGS = [
  { id: "mint", need: null, title: "Мята", color: "rgba(255,255,255,0.38)", width: 2, glow: null, layers: ["rgba(255,255,255,0.38)"] },
  { id: "streak3", need: "streak3", title: "3 дня", color: "#66BB6A", width: 3, glow: "rgba(102,187,106,0.4)", layers: ["#66BB6A"] },
  { id: "streak7", need: "streak7", title: "Неделя", color: "#FF8A65", width: 3, glow: "rgba(255,138,101,0.4)", layers: ["#FF8A65"] },
  { id: "streak30", need: "streak30", title: "Месяц", color: "#FFD54F", width: 4, glow: "rgba(255,213,79,0.45)", layers: ["#FFD54F"] },
  { id: "shield", need: "shield", title: "Щит", color: "#80DEEA", width: 3, glow: "rgba(128,222,234,0.4)", layers: ["#80DEEA"] },
  { id: "shieldSave", need: "shieldSave", title: "Щит сработал", color: "#4DD0E1", width: 4, glow: "rgba(77,208,225,0.5)", layers: ["#4DD0E1"] },
  { id: "dailyDay", need: "dailyDay", title: "День закрыт", color: "#9BFFC8", width: 2, glow: "rgba(155,255,200,0.35)", layers: ["#9BFFC8", "rgba(255,255,255,0.35)"] },
  { id: "warmupDay", need: "warmupDay", title: "Утро и вечер", color: "#FFB74D", width: 3, glow: "rgba(255,183,77,0.4)", layers: ["#FFB74D", "#FF8A65"] },
  { id: "allKinds", need: "allKinds", title: "Все шесть", color: "#A5D6A7", width: 2, glow: "rgba(165,214,167,0.35)", layers: ["#66BB6A", "#FFD54F", "#80DEEA"] },
  { id: "hundred", need: "hundred", title: "Сотня", color: "#FFD54F", width: 4, glow: "rgba(255,213,79,0.55)", layers: ["#FFD54F"], sparkle: true },
];

const FACE_MAP = Object.fromEntries(FACES.map((item) => [item.id, item]));
const RING_MAP = Object.fromEntries(RINGS.map((item) => [item.id, item]));

export function faceOf(id) {
  return FACE_MAP[id] || FACE_MAP[DEFAULT_FACE];
}

export function ringOf(id) {
  return RING_MAP[id] || RING_MAP[DEFAULT_RING];
}

export function wornLook(user) {
  return {
    face: faceOf(user?.avatarFace),
    ring: ringOf(user?.avatarRing),
  };
}

export function isUnlocked(user, item) {
  if (!item?.need) {
    return true;
  }
  return earnedSet(user).has(item.need);
}
