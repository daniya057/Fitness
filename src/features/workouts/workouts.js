import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";
import { ScreenHeader } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";
import { MISSIONS_BY_GOAL } from "../onboarding/catalog";
import { useCatalog } from "../onboarding/useCatalog";

function MissionCard({ mission, done, onStart }) {
  return (
    <View className={`mb-3 rounded-[28px] px-5 py-6 ${done ? "bg-mint" : "bg-card"}`}>
      <Text className="text-[20px] font-semibold leading-7 text-ink">{mission.title}</Text>
      <View className="mt-4 flex-row items-center">
        <Text className="text-[13px] font-medium text-mute">{mission.time}</Text>
        <View className="mx-3 h-1 w-1 rounded-full bg-mute/40" />
        <Text className="text-[13px] font-semibold text-accent">+{mission.xp} XP</Text>
      </View>
      <SoftPress
        onPress={() => onStart(mission.id)}
        disabled={done}
        className={`mt-5 self-start rounded-full px-6 py-2.5 ${done ? "bg-ink" : "bg-accent"}`}
      >
        <Text className="text-[13px] font-semibold text-white">{done ? "Готово" : "Старт"}</Text>
      </SoftPress>
    </View>
  );
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const catalog = useCatalog();
  const [done, setDone] = useState({});
  const missions = useMemo(() => {
    const goals = user?.goals?.length ? user.goals : ["walk"];
    const limit = Math.max(1, Math.min(4, user?.daysPerWeek || goals.length));
    return goals
      .slice(0, limit)
      .map((id) => catalog.missions[id] || MISSIONS_BY_GOAL[id])
      .filter(Boolean);
  }, [user, catalog]);
  const finished = missions.filter((item) => done[item.id]).length;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Активности"
          subtitle={`На сегодня · ${finished} из ${missions.length} закрыто${user?.daysPerWeek ? ` · план ${user.daysPerWeek} дн.` : ""}`}
        />
        <View className="-mt-2 mb-6 h-[6px] overflow-hidden rounded-full bg-card">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${missions.length ? (finished / missions.length) * 100 : 0}%` }}
          />
        </View>

        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            done={Boolean(done[mission.id])}
            onStart={(id) => setDone((prev) => ({ ...prev, [id]: true }))}
          />
        ))}
      </ScrollView>
    </View>
  );
}
