import { Camera, Dumbbell, Footprints, Medal, Moon, Sparkles, Sun, User, Utensils } from "lucide-react-native";
import { earnedSet } from "../achievements/catalog";

export const DEFAULT_FACE = "user";
export const DEFAULT_RING = "mint";

export const FACES = [
  { id: "user", need: null, title: "Свой", blurb: "Обычный значок", Icon: User, ink: "#9BFFC8" },
  { id: "photo", need: null, title: "Фото", blurb: "Своё фото из галереи", Icon: Camera, ink: "#9BFFC8" },
  { id: "first", need: "first", title: "Первый шаг", blurb: "За первую засчитанную тренировку", Icon: Medal, ink: "#FFE082" },
  { id: "kindStrength", need: "kindStrength", title: "Силовая", blurb: "За силовую тренировку", Icon: Dumbbell, ink: "#FFFFFF" },
  { id: "kindWalk", need: "kindWalk", title: "Прогулка", blurb: "За прогулку", Icon: Footprints, ink: "#B2FF59" },
  { id: "warmupMorning", need: "warmupMorning", title: "Утро", blurb: "За утреннюю разминку", Icon: Sun, ink: "#FFCC80" },
  { id: "warmupEvening", need: "warmupEvening", title: "Вечер", blurb: "За вечернюю разминку", Icon: Moon, ink: "#B39DDB" },
  { id: "fuel", need: "fuel", title: "Тарелка", blurb: "За запись еды", Icon: Utensils, ink: "#A5D6A7" },
];

export const RINGS = [
  { id: "mint", need: null, title: "Мята", blurb: "Базовая окантовка", color: "rgba(255,255,255,0.38)", width: 2, glow: null, layers: ["rgba(255,255,255,0.38)"] },
  { id: "streak3", need: "streak3", title: "3 дня", blurb: "Серия 3 дня подряд", color: "#66BB6A", width: 3, glow: "rgba(102,187,106,0.4)", layers: ["#66BB6A"] },
  { id: "streak7", need: "streak7", title: "Неделя", blurb: "Серия 7 дней подряд", color: "#FF8A65", width: 3, glow: "rgba(255,138,101,0.4)", layers: ["#FF8A65"] },
  { id: "streak30", need: "streak30", title: "Месяц", blurb: "Серия 30 дней подряд", color: "#FFD54F", width: 4, glow: "rgba(255,213,79,0.45)", layers: ["#FFD54F"] },
  { id: "shield", need: "shield", title: "Щит", blurb: "14 дней подряд, щит не списан", color: "#80DEEA", width: 3, glow: "rgba(128,222,234,0.4)", layers: ["#80DEEA"] },
  { id: "shieldSave", need: "shieldSave", title: "Спасён щитом", blurb: "Тренировка в день, когда щит спас серию", color: "#4DD0E1", width: 4, glow: "rgba(77,208,225,0.5)", layers: ["#4DD0E1"] },
  { id: "dailyDay", need: "dailyDay", title: "Все задания", blurb: "Закрой все задания одного дня", color: "#9BFFC8", width: 2, glow: "rgba(155,255,200,0.35)", layers: ["#9BFFC8", "rgba(255,255,255,0.35)"] },
  { id: "warmupDay", need: "warmupDay", title: "Утро и вечер", blurb: "Обе разминки в один день", color: "#FFB74D", width: 3, glow: "rgba(255,183,77,0.4)", layers: ["#FFB74D", "#FF8A65"] },
  { id: "allKinds", need: "allKinds", title: "Все типы", blurb: "Все шесть типов тренировок", color: "#A5D6A7", width: 2, glow: "rgba(165,214,167,0.35)", layers: ["#66BB6A", "#FFD54F", "#80DEEA"] },
  { id: "hundred", need: "hundred", title: "100 дней", blurb: "Серия 100 дней подряд", color: "#FFD54F", width: 4, glow: "rgba(255,213,79,0.55)", layers: ["#FFD54F"], sparkle: true },
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
