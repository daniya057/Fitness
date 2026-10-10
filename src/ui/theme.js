import { Platform } from "react-native";

const palette = {
  bg: "#07140F",
  ink: "#F4FFF8",
  mute: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.35)",
  accent: "#9BFFC8",
  bar: "#7DFFB3",
  track: "rgba(255,255,255,0.12)",
  orb: "rgba(46, 170, 96, 0.22)",
  orbDeep: "rgba(20, 90, 60, 0.28)",
  pill: "rgba(125,255,179,0.16)",
  fill: "rgba(255,255,255,0.1)",
  line: "rgba(255,255,255,0.22)",
};

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.style.backgroundColor = palette.bg;
  document.body.style.backgroundColor = palette.bg;
  delete document.documentElement.dataset.theme;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("fitness-theme");
  }
}

export function getPalette() {
  return palette;
}
