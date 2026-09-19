import { useEffect } from "react";
import { Platform, View } from "react-native";
import { lockPortrait, unlockPortrait } from "./orientationLock";

export function PortraitShell({ children }) {
  useEffect(() => {
    lockPortrait()?.catch?.(() => {});
    return () => {
      unlockPortrait()?.catch?.(() => {});
    };
  }, []);

  return (
    <View className="flex-1 bg-canvas" style={Platform.OS === "web" ? { minHeight: "100vh", alignItems: "center" } : undefined}>
      <View
        className="flex-1 w-full bg-canvas"
        style={Platform.OS === "web" ? { maxWidth: 430, width: "100%", height: "100%" } : { flex: 1 }}
      >
        {children}
      </View>
    </View>
  );
}
