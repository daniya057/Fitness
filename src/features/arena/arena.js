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

const BADGES = [
  { id: "tone", title: "Тонус", Icon: Medal },
  { id: "power", title: "Сила", Icon: Trophy },
  { id: "week", title: "7 дней", Icon: Star },
];

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

  const openProfile = async () => {
    await lightTap();
    router.replace("/profile");
  };

  const openDaily = async () => {
    await lightTap();
    router.replace("/workouts");
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

        <Pressable onPress={openDaily} className="mt-6 items-center rounded-[28px] bg-mint px-5 py-7">
          <Text className="text-[13px] font-medium tracking-[1px] text-accent">Сегодня</Text>
          <Text className="mt-1 text-[22px] font-semibold text-ink">{daily.title}</Text>
          <Text className="mt-1 text-[14px] text-mute">{daily.hint}</Text>
          <View className="mt-5 items-center justify-center">
            <CountdownRing progress={day.progress} />
            <View className="absolute items-center justify-center" style={{ width: 148, height: 148 }}>
              <Text className="text-[32px] font-semibold tabular-nums text-ink">{day.label}</Text>
            </View>
          </View>
          <View className="mt-5 rounded-full bg-canvas/70 px-5 py-2.5">
            <Text className="text-[13px] font-medium text-ink">Открыть тренинг</Text>
          </View>
        </Pressable>

        <View className="mt-4 rounded-[28px] bg-card px-5 py-4">
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

        <View className="mt-4 rounded-[28px] bg-mint px-4 py-6">
          <Text className="mb-5 text-center text-[18px] font-semibold text-ink">Достижения</Text>
          <View className="flex-row justify-around">
            {BADGES.map((badge) => (
              <Pressable key={badge.id} onPress={openDaily} className="items-center">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-canvas">
                  <badge.Icon size={24} color="#2E7D32" strokeWidth={1.6} />
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
