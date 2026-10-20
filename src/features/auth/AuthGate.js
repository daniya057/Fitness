import { useEffect } from "react";
import { usePathname } from "expo-router";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { getPalette } from "../../ui/theme";
import { captureInvite } from "../friends/invite";
import { PendingInvite } from "../friends/PendingInvite";
import { useAuth } from "./AuthContext";
import AuthScreen from "./AuthScreen";

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

  useEffect(() => {
    if (!isAdminPath(pathname)) {
      captureInvite(pathname);
    }
  }, [pathname]);

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

  return (
    <>
      <PendingInvite />
      {children}
    </>
  );
}
