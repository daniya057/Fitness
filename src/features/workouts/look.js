import { Dumbbell, Flame, Heart, Sparkles, Timer, Trophy, User, Utensils, Weight, Zap } from "lucide-react-native";

const MINT = "#9BFFC8";
const INK = "#07140F";

function look(Icon) {
  return {
    card: "rgba(125,255,179,0.16)",
    ink: INK,
    mute: "rgba(255,255,255,0.55)",
    accent: MINT,
    onAccent: INK,
    chipOn: MINT,
    chipOff: "rgba(255,255,255,0.1)",
    player: "rgba(125,255,179,0.12)",
    Icon,
  };
}

const LOOKS = {
  full: look(User),
  push: look(Dumbbell),
  pull: look(Zap),
  legs: look(Trophy),
  core: look(Flame),
  cardio: look(Heart),
  meal: look(Utensils),
  stretch: look(Sparkles),
  gym: look(Weight),
  short: look(Timer),
  custom: look(Sparkles),
};

export function lookOfGroup(id) {
  return LOOKS[id] || LOOKS.full;
}
