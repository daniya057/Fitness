import { Platform, View } from "react-native";
import { getPalette } from "./theme";

export const ACCENT_INK = "#10201A";

export function FadeEdge({ side = "right", color } = {}) {
  const tone = color || getPalette().bg;
  if (Platform.OS !== "web") {
    return (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: 20,
          backgroundColor: tone,
          opacity: 0.55,
        }}
      />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [side]: 0,
        width: 36,
        backgroundImage:
          side === "right"
            ? `linear-gradient(to right, transparent, ${tone})`
            : `linear-gradient(to left, transparent, ${tone})`,
      }}
    />
  );
}
