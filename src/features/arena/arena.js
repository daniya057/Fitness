import { Pressable, ScrollView, Text, View } from "react-native";
import { Flame, Medal, Star, Trophy, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { CountdownRing } from "./CountdownRing";
import { useDayCountdown } from "./useDayCountdown";
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
  const day = useDayCountdown();
  const streak = user?.streak || 7;
  const weight = user?.weight || { start: 85, current: 78.5, goal: 72 };
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
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-[28px] font-semibold text-ink">Серия</Text>
          <Pressable
            onPress={openProfile}
            className="h-11 w-11 items-center justify-center rounded-full bg-mint"
          >
            <User size={22} color="#2E7D32" strokeWidth={1.7} />
          </Pressable>
        </View>

        <View className="mt-5 flex-row items-center">
          <View className="mr-3 h-[7px] flex-1 overflow-hidden rounded-full bg-[#ECECEC]">
            <View className="h-full rounded-full bg-accent" style={{ width: "78%" }} />
          </View>
          <Flame size={18} color="#2E7D32" strokeWidth={1.8} fill="#2E7D32" />
          <Text className="ml-1.5 text-[18px] font-semibold text-ink">{streak}</Text>
        </View>

        <Pressable onPress={openDaily} className="mt-7 items-center rounded-[28px] bg-mint px-5 py-7">
          <Text className="text-[22px] font-semibold text-ink">Задание дня</Text>
          <Text className="mt-1 text-[14px] text-mute">Обратный отсчёт</Text>
          <View className="mt-5 items-center justify-center">
            <CountdownRing progress={day.progress} />
            <View className="absolute items-center justify-center" style={{ width: 148, height: 148 }}>
              <Text className="text-[32px] font-semibold tabular-nums text-ink">{day.label}</Text>
            </View>
          </View>
        </Pressable>

        <View className="mt-4 rounded-full bg-card px-5 py-3.5">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[13px] text-mute">
              Текущий вес: <Text className="font-semibold text-ink">{Number(weight.current).toFixed(1)} кг</Text>
            </Text>
            <Text className="text-[13px] text-mute">
              Цель: <Text className="font-semibold text-ink">{Number(weight.goal).toFixed(1)} кг</Text>
            </Text>
          </View>
          <View className="h-[5px] overflow-hidden rounded-full bg-[#ECECEC]">
            <View className="h-full rounded-full bg-accent" style={{ width: `${Math.round(toGoal * 100)}%` }} />
          </View>
        </View>

        <View className="mt-4 rounded-[28px] bg-mint px-4 py-6">
          <Text className="mb-5 text-center text-[22px] font-semibold text-ink">Достижения</Text>
          <View className="flex-row justify-around">
            {BADGES.map((badge) => (
              <Pressable key={badge.id} onPress={openDaily} className="items-center">
                <View className="h-12 w-12 items-center justify-center">
                  <badge.Icon size={28} color="#2E7D32" strokeWidth={1.6} />
                </View>
                <Text className="mt-1 text-[12px] text-mute">{badge.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
