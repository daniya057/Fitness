import { Flame } from "lucide-react-native";

function daysWord(count) {
  const n = Math.abs(Math.round(Number(count) || 0));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 0) {
    return "дней";
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

export const FLAME_INK = "#FF5C1A";
export const FLAME_GLOW = "rgba(255, 92, 26, 0.55)";

const STAGES = {
  0: {
    card: "#E8F5E9",
    ink: "#1A1A1A",
    mute: "#666666",
    flame: "#FF8A4C",
    glow: "rgba(255, 138, 76, 0.35)",
    iconBg: "#FFFFFF",
    chip: "#FFFFFF",
    Icon: Flame,
    fillIcon: true,
    radius: 32,
  },
  1: {
    card: "#C9EBD6",
    ink: "#1A1A1A",
    mute: "#2E7D32",
    flame: FLAME_INK,
    glow: FLAME_GLOW,
    iconBg: "#FFFFFF",
    chip: "#FFFFFF",
    Icon: Flame,
    fillIcon: true,
    radius: 32,
  },
  3: {
    card: "#A5D6A7",
    ink: "#1B5E20",
    mute: "#2E7D32",
    flame: "#FF4D00",
    glow: "rgba(255, 77, 0, 0.62)",
    iconBg: "#E8F5E9",
    chip: "#E8F5E9",
    Icon: Flame,
    fillIcon: true,
    radius: 28,
  },
  10: {
    card: "#2E7D32",
    ink: "#FFFFFF",
    mute: "#C8E6C9",
    flame: "#FF3D00",
    glow: "rgba(255, 61, 0, 0.7)",
    iconBg: "#1B5E20",
    chip: "#1B5E20",
    Icon: Flame,
    fillIcon: true,
    radius: 28,
  },
  20: {
    card: "#FFE082",
    ink: "#4E342E",
    mute: "#6D4C41",
    flame: "#FF6F00",
    glow: "rgba(255, 111, 0, 0.75)",
    iconBg: "#FFF8E1",
    chip: "#FFF8E1",
    Icon: Flame,
    fillIcon: true,
    radius: 36,
  },
  100: {
    card: "#1B5E20",
    ink: "#FFFFFF",
    mute: "#A5D6A7",
    flame: "#FFD54F",
    glow: "rgba(255, 213, 79, 0.7)",
    iconBg: "#33691E",
    chip: "#33691E",
    Icon: Flame,
    fillIcon: true,
    radius: 40,
  },
};

export function lookOfStreak(raw) {
  const days = Math.max(0, Math.round(Number(raw) || 0));
  const key = days >= 100 ? 100 : days >= 20 ? 20 : days >= 10 ? 10 : days >= 3 ? 3 : days >= 1 ? 1 : 0;
  const pack = STAGES[key];
  return {
    days,
    stage: key,
    unit: daysWord(days),
    ...pack,
  };
}
