import { usePathname } from "expo-router";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { getPalette } from "../../ui/theme";
import { useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";
import EmailVerifyScreen from "./EmailVerifyScreen";
import OnboardingScreen from "../onboarding/OnboardingScreen";

function isAdminPath(pathname) {
  if (pathname?.startsWith("/admin")) {
    return true;
  }
  if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/admin")) {
    return true;
  }
  return false;
}

export function AuthGate({ children }) {
  const pathname = usePathname();
  const { user, booting } = useAuth();

  if (isAdminPath(pathname)) {
    return children;
  }

  if (booting) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: getPalette().bg }}>
        <StatusBar style="light" />
        <Text className="text-[16px] text-white/60">Секунду</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (user.emailVerified === false) {
    return <EmailVerifyScreen />;
  }

  if (!user.onboardingDone) {
    return <OnboardingScreen />;
  }

  if (!user.quizDone) {
    return <OnboardingScreen extra />;
  }

  return children;
}
