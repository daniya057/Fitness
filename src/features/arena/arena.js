import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Shield, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { ScreenHeader } from "../../ui/kit";
import { CountdownRing } from "./CountdownRing";
import { useDayCountdown } from "./useDayCountdown";
import { useAuth } from "../auth/AuthContext";
import { sumLog, utcDay } from "../calories/foods";
import { dailyKcalTarget } from "../calories/target";
import { lookOfStreak } from "../streaks/look";
import { AchievementPlaque } from "../achievements/plaque";
import { sessionById } from "../workouts/catalog";
import { useSession } from "../workouts/sessionStore";

const RING = 80;

function freezeWord(count) {
  const n = Math.abs(Math.round(Number(count) || 0));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return "щитов";
  }
  if (mod10 === 1) {
    return "щит";
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return "щита";
  }
  return "щитов";
}

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
  const openSession = useSession((state) => state.open);
  const day = useDayCountdown();
  const streak = user?.streak || 0;
  const look = lookOfStreak(streak);
  const StreakIcon = look.Icon;
  const freezesLeft = Number(user?.freezesLeft) || 0;
  const weight = user?.weight || { start: 70, current: 70, goal: 70 };
  const dailyTasks = Array.isArray(user?.daily?.tasks) ? user.daily.tasks : [];
  const dailyDone = new Set(Array.isArray(user?.daily?.done) ? user.daily.done : []);
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

  const openTask = async (task) => {
    await lightTap();
    const session = sessionById(task?.sessionId);
    if (session) {
      openSession(session);
    }
    router.replace("/workouts");
  };

  const openCalories = async () => {
    await lightTap();
    router.replace("/calories");
  };

  const openRewards = async () => {
    await lightTap();
    router.replace("/rewards");
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

        <View className="px-6 py-8" style={{ backgroundColor: look.card, borderRadius: look.radius }}>
          <View className="items-center">
            <View
              className="h-[88px] w-[88px] items-center justify-center rounded-full"
              style={{ backgroundColor: look.iconBg }}
            >
              <StreakIcon
                size={44}
                color={look.flame}
                strokeWidth={1.8}
                fill={look.fillIcon ? look.flame : "none"}
              />
            </View>
            <Text
              className="mt-4 text-[64px] font-semibold leading-[68px] tabular-nums"
              style={{ color: look.ink }}
            >
              {look.days}
            </Text>
            <Text className="mt-1 text-[15px]" style={{ color: look.mute }}>
              {look.unit}
            </Text>
            <Text className="mt-3 text-center text-[16px] font-semibold" style={{ color: look.ink }}>
              {look.line}
            </Text>
          </View>
          <View
            className="mt-6 flex-row items-center justify-center rounded-full px-4 py-2.5"
            style={{ backgroundColor: look.chip }}
          >
            <Shield size={18} color={look.flame} strokeWidth={1.8} fill={freezesLeft > 0 ? look.flame : "none"} />
            <Text className="ml-2 text-[14px] font-medium" style={{ color: look.ink }}>
              {freezesLeft} {freezeWord(freezesLeft)}
            </Text>
          </View>
        </View>

        <Pressable onPress={openCalories} className="mt-3 rounded-[28px] bg-mint px-4 py-5">
          <View className="flex-row">
            <StatCell label="Цель" value={target.kcal} />
            <StatCell label="Съедено" value={eaten} />
          </View>
          <Text className="mt-3 text-center text-[11px] text-mute">ккал · тап — дневник</Text>
        </Pressable>

        <View className="mt-3 rounded-[24px] bg-mint px-4 py-3.5">
          <View className="flex-row items-center">
            <View className="mr-3 flex-1">
              <Text className="text-[11px] font-medium tracking-[1px] text-accent">Сегодня</Text>
              <Text className="mt-0.5 text-[16px] font-semibold text-ink">Задания дня</Text>
              <Text className="mt-0.5 text-[12px] leading-4 text-mute">
                {dailyDone.size} / {dailyTasks.length || 3}
                {user?.daily?.shieldGranted ? " · щит уже твой" : " · все три — щит"}
              </Text>
            </View>
            <View className="items-center justify-center">
              <CountdownRing progress={day.progress} size={RING} />
              <View className="absolute items-center justify-center" style={{ width: RING, height: RING }}>
                <Text className="text-[13px] font-semibold tabular-nums text-ink">{day.label}</Text>
              </View>
            </View>
          </View>
          {dailyTasks.map((task) => {
            const on = dailyDone.has(task.id);
            return (
              <Pressable key={task.id} onPress={() => openTask(task)} className="mt-3">
                <Text className={`text-[15px] font-semibold ${on ? "text-accent" : "text-ink"}`}>
                  {on ? "✓ " : ""}
                  {task.title}
                </Text>
                <Text className="text-[12px] leading-4 text-mute">{task.hint}</Text>
              </Pressable>
            );
          })}
        </View>

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

        <AchievementPlaque user={user} onPress={openRewards} />
      </ScrollView>
    </View>
  );
}
