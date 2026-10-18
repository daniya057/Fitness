import "react-native-gesture-handler";
import "../global.css";
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AchievementUnlock } from "../src/features/achievements/AchievementUnlock";
import { AuthGate } from "../src/features/auth/AuthGate";
import { AuthProvider } from "../src/features/auth/AuthContext";
import { PortraitShell } from "../src/ui/PortraitShell";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#07140F" }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PortraitShell>
            <AuthGate>
              <Slot />
            </AuthGate>
            <AchievementUnlock />
          </PortraitShell>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
