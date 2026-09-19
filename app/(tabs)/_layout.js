import { Pressable, View } from "react-native";
import { Slot, usePathname, useRouter } from "expo-router";
import { Dumbbell, Home, Trophy, User, Utensils } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import { lightTap } from "../../src/lib/haptics";
import { lockPortrait, unlockPortrait } from "../../src/ui/orientationLock";

const TABS = [
  { href: "/", Icon: Home, match: (path) => path === "/" },
  { href: "/workouts", Icon: Dumbbell, match: (path) => path.startsWith("/workouts") },
  { href: "/rewards", Icon: Trophy, match: (path) => path.startsWith("/rewards") },
  { href: "/calories", Icon: Utensils, match: (path) => path.startsWith("/calories") },
  { href: "/profile", Icon: User, match: (path) => path.startsWith("/profile") },
];

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    lockPortrait()?.catch?.(() => {});
    return () => {
      unlockPortrait()?.catch?.(() => {});
    };
  }, []);

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-1">
        <Slot />
      </View>
      <View
        className="flex-row bg-canvas px-3 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const color = active ? "#2E7D32" : "#9E9E9E";
          return (
            <Pressable
              key={tab.href}
              className="flex-1 items-center py-1"
              onPress={() => {
                lightTap();
                router.replace(tab.href);
              }}
            >
              <tab.Icon size={22} color={color} strokeWidth={active ? 2.2 : 1.7} fill={active && tab.href === "/" ? "#2E7D32" : "none"} />
              <View className={`mt-1.5 h-[3px] w-6 rounded-full ${active ? "bg-accent" : "bg-transparent"}`} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
