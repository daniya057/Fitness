import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Slot, usePathname, useRouter } from "expo-router";
import { Dumbbell, Home, User, Users, Utensils } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { lightTap } from "../../src/lib/haptics";
import { AmbientWash, glassStyle, movePill, screenEnter } from "../../src/ui/Glass";
import { getPalette } from "../../src/ui/theme";
import { lockPortrait, unlockPortrait } from "../../src/ui/orientationLock";
import { ShieldNotice } from "../../src/features/streaks/ShieldNotice";

const TABS = [
  { href: "/", label: "Главная", Icon: Home, match: (path) => path === "/" },
  { href: "/workouts", label: "Тренировки", Icon: Dumbbell, match: (path) => path.startsWith("/workouts") },
  { href: "/friends", label: "Друзья", Icon: Users, match: (path) => path.startsWith("/friends") },
  { href: "/calories", label: "Калории", Icon: Utensils, match: (path) => path.startsWith("/calories") },
  { href: "/profile", label: "Профиль", Icon: User, match: (path) => path.startsWith("/profile") },
];

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const pillX = useSharedValue(0);
  const foundIndex = TABS.findIndex((tab) => tab.match(pathname));
  const activeIndex = foundIndex < 0 ? 0 : foundIndex;

  useEffect(() => {
    lockPortrait()?.catch?.(() => {});
    return () => {
      unlockPortrait()?.catch?.(() => {});
    };
  }, []);

  useEffect(() => {
    if (!barWidth) {
      return;
    }
    const inner = Math.max(0, barWidth - 8);
    const tabWidth = inner / TABS.length;
    movePill(pillX, 4 + activeIndex * tabWidth);
  }, [activeIndex, barWidth, pillX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));
  const tabWidth = barWidth ? Math.max(0, barWidth - 8) / TABS.length : 0;

  return (
    <View className="flex-1" style={{ backgroundColor: getPalette().bg }}>
      <StatusBar style="light" />
      <AmbientWash />
      <ShieldNotice />
      <View className="flex-1">
        <Animated.View key={pathname} entering={screenEnter} style={{ flex: 1 }}>
          <Slot />
        </Animated.View>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 36,
            backgroundImage: `linear-gradient(to bottom, transparent, ${getPalette().bg})`,
          }}
        />
      </View>
      <View className="px-3 pt-1" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <View
          className="flex-row rounded-[28px] px-1 py-1.5"
          style={glassStyle({ borderRadius: 28 })}
          onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        >
          {tabWidth ? (
            <Animated.View
              pointerEvents="none"
              style={[
                glassStyle({
                  variant: "fill",
                  position: "absolute",
                  top: 6,
                  left: 0,
                  width: tabWidth,
                  bottom: 6,
                  borderRadius: 22,
                  backgroundColor: getPalette().pill,
                }),
                pillStyle,
              ]}
            />
          ) : null}
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const color = active ? getPalette().accent : getPalette().mute;
            return (
              <Pressable
                key={tab.href}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                className="flex-1 items-center justify-center rounded-[22px] py-2.5"
                style={{ minHeight: 52 }}
                onPress={() => {
                  lightTap();
                  router.replace(tab.href);
                }}
              >
                <tab.Icon
                  size={22}
                  color={color}
                  strokeWidth={active ? 2.2 : 1.7}
                  fill={active && tab.href === "/" ? color : "none"}
                />
                <Text className="mt-1 text-[10px] font-medium" numberOfLines={1} style={{ color }}>
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
