import { useEffect } from "react";
import { Platform, View } from "react-native";
import { usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getPalette } from "./theme";
import { lockPortrait, unlockPortrait } from "./orientationLock";

function isAdmin(pathname) {
  if (pathname?.startsWith("/admin")) {
    return true;
  }
  if (typeof window !== "undefined" && window.location?.pathname?.startsWith("/admin")) {
    return true;
  }
  return false;
}

export function PortraitShell({ children }) {
  const pathname = usePathname();
  const admin = isAdmin(pathname);
  const page = admin ? "#FFFFFF" : getPalette().bg;

  useEffect(() => {
    lockPortrait()?.catch?.(() => {});
    return () => {
      unlockPortrait()?.catch?.(() => {});
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return undefined;
    }
    document.documentElement.style.backgroundColor = page;
    document.body.style.backgroundColor = page;
    return undefined;
  }, [page]);

  return (
    <View
      className="flex-1"
      style={[
        { backgroundColor: page, overflow: "hidden" },
        Platform.OS === "web" ? { height: "100vh", alignItems: "center" } : null,
      ]}
    >
      <StatusBar style={admin ? "dark" : "light"} />
      <View
        className={`flex-1 w-full ${admin ? "bg-canvas" : ""}`}
        style={[
          { backgroundColor: admin ? "#FFFFFF" : "transparent", minHeight: 0, overflow: "hidden" },
          Platform.OS === "web" ? { maxWidth: 430, width: "100%", height: "100%" } : { flex: 1 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
