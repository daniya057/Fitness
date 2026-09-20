import "react-native-gesture-handler";
import "../global.css";
import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthGate } from "../src/features/auth/AuthGate";
import { AuthProvider } from "../src/features/auth/AuthContext";
import { PortraitShell } from "../src/ui/PortraitShell";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <PortraitShell>
            <AuthGate>
              <Slot />
            </AuthGate>
          </PortraitShell>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
