import { Pressable, Text, View } from "react-native";
import { Slot, usePathname, useRouter } from "expo-router";
import { Dumbbell, Home, Trophy, User, Utensils } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect } from "react";
import { lightTap } from "../../src/lib/haptics";
import { lockPortrait, unlockPortrait } from "../../src/ui/orientationLock";

const TABS = [
  { href: "/", label: "Арена", Icon: Home, match: (path) => path === "/" },
  { href: "/workouts", label: "Тренинг", Icon: Dumbbell, match: (path) => path.startsWith("/workouts") },
  { href: "/rewards", label: "Награды", Icon: Trophy, match: (path) => path.startsWith("/rewards") },
  { href: "/calories", label: "Топливо", Icon: Utensils, match: (path) => path.startsWith("/calories") },
  { href: "/profile", label: "Профиль", Icon: User, match: (path) => path.startsWith("/profile") },
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
      <View className="bg-canvas px-3 pt-1" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <View className="flex-row rounded-[28px] bg-card px-1 py-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const color = active ? "#2E7D32" : "#8A8A8A";
            return (
              <Pressable
                key={tab.href}
                className={`flex-1 items-center rounded-[22px] py-2 ${active ? "bg-mint" : ""}`}
                onPress={() => {
                  lightTap();
                  router.replace(tab.href);
                }}
              >
                <tab.Icon
                  size={20}
                  color={color}
                  strokeWidth={active ? 2.2 : 1.7}
                  fill={active && tab.href === "/" ? "#2E7D32" : "none"}
                />
                <Text className={`mt-1 text-[10px] font-medium ${active ? "text-accent" : "text-mute"}`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
