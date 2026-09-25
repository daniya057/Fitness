import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Flame, Medal, Star, Trophy, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { ScreenHeader } from "../../ui/kit";
import { CountdownRing } from "./CountdownRing";
import { useDayCountdown } from "./useDayCountdown";
import { DAILY_COPY } from "../onboarding/catalog";
import { useCatalog } from "../onboarding/useCatalog";
import { useAuth } from "../auth/AuthContext";
import { sumLog, utcDay } from "../calories/foods";
import { dailyKcalTarget } from "../calories/target";

const BADGES = [
  { id: "tone", title: "Тонус", Icon: Medal },
  { id: "power", title: "Сила", Icon: Trophy },
  { id: "week", title: "7 дней", Icon: Star },
];

const RING = 80;

function StatCell({ label, value }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[22px] font-semibold tabular-nums text-ink">{value}</Text>
      <Text className="mt-1 text-[11px] text-mute">{label}</Text>
    </View>
  );
}

export default function ArenaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const catalog = useCatalog();
  const day = useDayCountdown();
  const streak = user?.streak || 0;
  const weight = user?.weight || { start: 70, current: 70, goal: 70 };
  const primaryGoal = (user?.goals && user.goals[0]) || "walk";
  const daily = catalog.daily[primaryGoal] || DAILY_COPY[primaryGoal] || DAILY_COPY.walk;
  const span = weight.start - weight.goal;
  const toGoal = span <= 0 ? 1 : Math.max(0.08, Math.min(1, (weight.start - weight.current) / span));
  const today = utcDay();
  const eaten = useMemo(() => {
    const items = user?.fuelLog?.date === today ? user.fuelLog.items || [] : [];
    return sumLog(items).kcal;
  }, [user, today]);
  const target = useMemo(() => dailyKcalTarget(user), [user]);

  const openProfile = async () => {
    await lightTap();
    router.replace("/profile");
  };

  const openDaily = async () => {
    await lightTap();
    router.replace("/workouts");
  };

  const openCalories = async () => {
    await lightTap();
    router.replace("/calories");
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Серия"
          right={
            <Pressable
              onPress={openProfile}
              className="h-11 w-11 items-center justify-center rounded-full bg-mint"
            >
              <User size={20} color="#2E7D32" strokeWidth={1.8} />
            </Pressable>
          }
        />

        <View className="-mt-2 flex-row items-center">
          <View className="mr-3 h-2 flex-1 overflow-hidden rounded-full bg-card">
            <View className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, streak * 12)}%` }} />
          </View>
          <View className="flex-row items-center rounded-full bg-mint px-2.5 py-1">
            <Flame size={16} color="#2E7D32" strokeWidth={1.8} fill="#2E7D32" />
            <Text className="ml-1 text-[16px] font-semibold text-ink">{streak}</Text>
          </View>
        </View>

        <Pressable onPress={openCalories} className="mt-5 rounded-[28px] bg-mint px-4 py-5">
          <View className="flex-row">
            <StatCell label="Цель" value={target.kcal} />
            <StatCell label="Съедено" value={eaten} />
          </View>
          <Text className="mt-3 text-center text-[11px] text-mute">ккал · тап — дневник</Text>
        </Pressable>

        <Pressable onPress={openDaily} className="mt-3 flex-row items-center rounded-[24px] bg-mint px-4 py-3.5">
          <View className="mr-3 flex-1">
            <Text className="text-[11px] font-medium tracking-[1px] text-accent">Сегодня</Text>
            <Text className="mt-0.5 text-[16px] font-semibold text-ink">{daily.title}</Text>
            <Text className="mt-0.5 text-[12px] leading-4 text-mute" numberOfLines={2}>
              {daily.hint}
            </Text>
          </View>
          <View className="items-center justify-center">
            <CountdownRing progress={day.progress} size={RING} />
            <View className="absolute items-center justify-center" style={{ width: RING, height: RING }}>
              <Text className="text-[13px] font-semibold tabular-nums text-ink">{day.label}</Text>
            </View>
          </View>
        </Pressable>

        <View className="mt-3 rounded-[28px] bg-card px-5 py-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-mute">
              Вес: <Text className="font-semibold text-ink">{Number(weight.current).toFixed(1)} кг</Text>
            </Text>
            <Text className="text-[13px] text-mute">
              Цель: <Text className="font-semibold text-ink">{Number(weight.goal).toFixed(1)} кг</Text>
            </Text>
          </View>
          <View className="h-[6px] overflow-hidden rounded-full bg-canvas">
            <View className="h-full rounded-full bg-accent" style={{ width: `${Math.round(toGoal * 100)}%` }} />
          </View>
        </View>

        <View className="mt-3 rounded-[28px] bg-mint px-4 py-5">
          <Text className="mb-4 text-center text-[16px] font-semibold text-ink">Достижения</Text>
          <View className="flex-row justify-around">
            {BADGES.map((badge) => (
              <Pressable key={badge.id} onPress={openDaily} className="items-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-canvas">
                  <badge.Icon size={22} color="#2E7D32" strokeWidth={1.6} />
                </View>
                <Text className="mt-2 text-[12px] font-medium text-ink">{badge.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
