import { usePathname } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";
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
      <View className="flex-1 items-center justify-center bg-canvas">
        <Text className="text-[16px] text-mute">Секунду</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!user.onboardingDone) {
    return <OnboardingScreen />;
  }

  return children;
}
