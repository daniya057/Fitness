import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Shield, Sun, Sunset } from "lucide-react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { lightTap } from "../../lib/haptics";
import { AccentGlow, GlassPanel, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { CountdownRing } from "./CountdownRing";
import { useDayCountdown } from "./useDayCountdown";
import { useAuth } from "../auth/AuthContext";
import { sumLog, utcDay } from "../calories/foods";
import { dailyKcalTarget } from "../calories/target";
import { lookOfStreak } from "../streaks/look";
import { AchievementPlaque } from "../achievements/plaque";
import { ProfileChip } from "../avatar/ProfileChip";
import { sessionById, warmupSessions } from "../workouts/catalog";
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
      <Text className="text-[28px] font-semibold tabular-nums text-white">{value}</Text>
      <Text className="mt-1 text-[12px] text-white/55">{label}</Text>
    </View>
  );
}

function WeightFill({ progress }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(Math.max(0.04, progress), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleX: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          height: 6,
          width: "100%",
          borderRadius: 999,
          backgroundColor: getPalette().bar,
          transformOrigin: "left center",
        },
        style,
      ]}
    />
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
  const todaySessions = new Set(Array.isArray(user?.todaySessions) ? user.todaySessions : []);
  const warmups = warmupSessions();
  const span = weight.start - weight.goal;
  const toGoal = span <= 0 ? 1 : Math.max(0.08, Math.min(1, (weight.start - weight.current) / span));
  const today = utcDay();
  const eaten = useMemo(() => {
    const items = user?.fuelLog?.date === today ? user.fuelLog.items || [] : [];
    return sumLog(items).kcal;
  }, [user, today]);
  const target = useMemo(() => dailyKcalTarget(user), [user]);

  const openTask = async (task) => {
    await lightTap();
    const session = sessionById(task?.sessionId);
    if (session) {
      openSession(session);
    }
    router.replace("/workouts");
  };

  const openWarmup = async (session) => {
    await lightTap();
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
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -80,
          alignSelf: "center",
          width: 320,
          height: 320,
          borderRadius: 160,
          backgroundColor: "rgba(46, 160, 90, 0.22)",
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-5 flex-row items-center justify-between pt-2">
          <Text className="text-[34px] font-semibold text-white">Серия</Text>
          <ProfileChip />
        </View>

        <GlassPanel delay={40} style={{ borderRadius: 32, paddingHorizontal: 24, paddingVertical: 28 }}>
          <View className="items-center">
            <View className="h-[88px] w-[88px] items-center justify-center">
              <AccentGlow size={148} pulse color="rgba(125,255,179,0.38)" />
              <View className="h-[88px] w-[88px] items-center justify-center rounded-full" style={glassStyle({ variant: "fill", borderRadius: 999 })}>
                <StreakIcon size={44} color={getPalette().accent} strokeWidth={1.8} fill={look.fillIcon ? getPalette().accent : "none"} />
              </View>
            </View>
            <View className="mt-4 items-center">
              <AccentGlow size={160} color="rgba(125,255,179,0.22)" />
              <Text className="text-[64px] font-semibold leading-[68px] tabular-nums text-white">{look.days}</Text>
            </View>
            <Text className="mt-1 text-[15px] text-white/60">{look.unit}</Text>
          </View>
          <View className="mt-6 flex-row items-center justify-center self-center rounded-full px-4 py-2.5" style={glassStyle({ variant: "fill", borderRadius: 999 })}>
            <Shield size={18} color={getPalette().accent} strokeWidth={1.8} fill={freezesLeft > 0 ? getPalette().accent : "none"} />
            <Text className="ml-2 text-[14px] font-medium text-white">
              {freezesLeft} {freezeWord(freezesLeft)}
            </Text>
          </View>
        </GlassPanel>

        {warmups.length ? (
          <View className="mt-3">
          <GlassPanel delay={80} style={{ borderRadius: 28, paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text className="text-[11px] font-medium tracking-[1px]" style={{ color: getPalette().accent }}>
              1 МИНУТА
            </Text>
            <Text className="mt-0.5 text-[16px] font-semibold text-white">Разминка</Text>
            <View className="mt-3 flex-row gap-2">
              {warmups.map((item) => {
                const on = todaySessions.has(item.id);
                const evening = item.id === "warmup-evening";
                const Icon = evening ? Sunset : Sun;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openWarmup(item)}
                    className="flex-1 rounded-[20px] px-3 py-3"
                    style={glassStyle({
                      variant: "fill",
                      borderRadius: 20,
                      backgroundColor: on ? "rgba(125,255,179,0.16)" : getPalette().fill,
                    })}
                  >
                    <Icon size={18} color={on ? getPalette().accent : getPalette().ink} strokeWidth={1.8} />
                    <Text className="mt-2 text-[14px] font-semibold text-white">{evening ? "Вечер" : "Утро"}</Text>
                    <Text className="mt-0.5 text-[11px] text-white/45">{on ? "уже сегодня" : "1 мин"}</Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassPanel>
          </View>
        ) : null}

        <Pressable onPress={openCalories} className="mt-3">
          <GlassPanel delay={110} style={{ borderRadius: 28, paddingHorizontal: 16, paddingVertical: 20 }}>
            <View className="flex-row">
              <StatCell label="Цель" value={target.kcal} />
              <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.12)" }} />
              <StatCell label="Съедено" value={eaten} />
            </View>
            <Text className="mt-3 text-center text-[11px] text-white/45">ккал · тап — дневник</Text>
          </GlassPanel>
        </Pressable>

        <View className="mt-3">
          <GlassPanel delay={170} style={{ borderRadius: 28, paddingHorizontal: 16, paddingVertical: 16 }}>
            <View className="flex-row items-center">
              <View className="mr-3 flex-1">
                <Text className="text-[11px] font-medium tracking-[1px]" style={{ color: getPalette().accent }}>
                  СЕГОДНЯ
                </Text>
                <Text className="mt-0.5 text-[16px] font-semibold text-white">Задания дня</Text>
                <Text className="mt-0.5 text-[12px] leading-4 text-white/55">
                  {dailyDone.size} / {dailyTasks.length || 3}
                  {user?.daily?.shieldGranted ? " · щит получен" : " · все три — щит"}
                </Text>
              </View>
              <View className="items-center justify-center">
                <CountdownRing progress={day.progress} size={RING} track={getPalette().track} stroke={getPalette().bar} />
                <View className="absolute items-center justify-center" style={{ width: RING, height: RING }}>
                  <Text className="text-[13px] font-semibold tabular-nums text-white">{day.label}</Text>
                </View>
              </View>
            </View>
            {dailyTasks.map((task) => {
              const on = dailyDone.has(task.id);
              return (
                <Pressable key={task.id} onPress={() => openTask(task)} className="mt-3 flex-row items-center">
                  <View
                    className="mr-3 h-5 w-5 items-center justify-center rounded-full"
                    style={{
                      borderWidth: 1.5,
                      borderColor: on ? getPalette().bar : getPalette().faint,
                      backgroundColor: on ? getPalette().bar : "transparent",
                    }}
                  />
                  <View className="flex-1">
                    <Text className={`text-[15px] font-semibold ${on ? "text-[#9BFFC8]" : "text-white"}`}>{task.title}</Text>
                    <Text className="text-[12px] leading-4 text-white/45">{task.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </GlassPanel>
        </View>

        <View className="mt-3">
          <GlassPanel delay={230} style={{ borderRadius: 28, paddingHorizontal: 20, paddingVertical: 16 }}>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[13px] text-white/60">
                Вес: <Text className="font-semibold text-white">{Number(weight.current).toFixed(1)} кг</Text>
              </Text>
              <Text className="text-[13px] text-white/60">
                Цель: <Text className="font-semibold text-white">{Number(weight.goal).toFixed(1)} кг</Text>
              </Text>
            </View>
            <View className="h-[6px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
              <WeightFill progress={toGoal} />
            </View>
          </GlassPanel>
        </View>

        <Animated.View entering={FadeInDown.duration(560).delay(290).springify().damping(18)}>
          <AchievementPlaque user={user} onPress={openRewards} tone="glass" />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
