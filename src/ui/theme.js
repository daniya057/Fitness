import { Platform } from "react-native";

const palette = {
  bg: "#101C18",
  ink: "#F2FAF6",
  mute: "rgba(242,250,246,0.55)",
  faint: "rgba(242,250,246,0.35)",
  accent: "#8FDCB8",
  bar: "#76C9A8",
  track: "rgba(255,255,255,0.12)",
  orb: "rgba(72, 168, 132, 0.2)",
  orbDeep: "rgba(28, 92, 68, 0.3)",
  pill: "rgba(143, 220, 184, 0.2)",
  fill: "rgba(255,255,255,0.055)",
  line: "rgba(255,255,255,0.18)",
  onAccent: "#10201A",
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
