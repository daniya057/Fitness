import { Flame, Sparkles, Star, Trophy, Zap } from "lucide-react-native";

function daysWord(count) {
  const n = Math.abs(Math.round(Number(count) || 0));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 0) {
    return "ещё впереди";
  }
  if (mod100 >= 11 && mod100 <= 14) {
    return "дней подряд";
  }
  if (mod10 === 1) {
    return "день подряд";
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return "дня подряд";
  }
  return "дней подряд";
}

const STAGES = {
  0: {
    card: "#E8F5E9",
    ink: "#1A1A1A",
    mute: "#666666",
    flame: "#81C784",
    iconBg: "#FFFFFF",
    chip: "#FFFFFF",
    Icon: Flame,
    fillIcon: false,
    radius: 32,
    lines: ["Любое движение считается", "Без давления. Можно начать"],
  },
  1: {
    card: "#C9EBD6",
    ink: "#1A1A1A",
    mute: "#2E7D32",
    flame: "#2E7D32",
    iconBg: "#FFFFFF",
    chip: "#FFFFFF",
    Icon: Flame,
    fillIcon: true,
    radius: 32,
    lines: ["Старт есть", "День засчитан", "Поехали мягко"],
  },
  3: {
    card: "#A5D6A7",
    ink: "#1B5E20",
    mute: "#2E7D32",
    flame: "#1B5E20",
    iconBg: "#E8F5E9",
    chip: "#E8F5E9",
    Icon: Zap,
    fillIcon: false,
    radius: 28,
    lines: ["Ритм цепляется", "Три дня. Живое", "Привычка дышит"],
  },
  10: {
    card: "#2E7D32",
    ink: "#FFFFFF",
    mute: "#C8E6C9",
    flame: "#FFECB3",
    iconBg: "#1B5E20",
    chip: "#1B5E20",
    Icon: Star,
    fillIcon: true,
    radius: 28,
    lines: ["Десять. Красиво", "Серия держится", "Ты в потоке"],
  },
  20: {
    card: "#FFE082",
    ink: "#4E342E",
    mute: "#6D4C41",
    flame: "#E65100",
    iconBg: "#FFF8E1",
    chip: "#FFF8E1",
    Icon: Trophy,
    fillIcon: false,
    radius: 36,
    lines: ["Двадцать. Это твоё", "Огонь ровный", "Серия взрослая"],
  },
  100: {
    card: "#1B5E20",
    ink: "#FFFFFF",
    mute: "#A5D6A7",
    flame: "#FFD54F",
    iconBg: "#33691E",
    chip: "#33691E",
    Icon: Sparkles,
    fillIcon: true,
    radius: 40,
    lines: ["Сотня. Вау", "Легенда тихо", "Сто дней движения"],
  },
};

export function lookOfStreak(raw) {
  const days = Math.max(0, Math.round(Number(raw) || 0));
  const key = days >= 100 ? 100 : days >= 20 ? 20 : days >= 10 ? 10 : days >= 3 ? 3 : days >= 1 ? 1 : 0;
  const pack = STAGES[key];
  const line = pack.lines[days % pack.lines.length];
  return {
    days,
    stage: key,
    unit: daysWord(days),
    line,
    ...pack,
  };
}
