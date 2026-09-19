import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";

const MISSIONS = [
  { id: "tone", title: "Лёгкий утренний тонус", time: "6 мин", xp: 12 },
  { id: "stretch", title: "Растяжка перед сном", time: "8 мин", xp: 14 },
  { id: "focus", title: "Минута фокуса", time: "1 мин", xp: 6 },
  { id: "walk", title: "Тихая прогулка", time: "10 мин", xp: 16 },
];

function MissionCard({ mission, index, done, onStart }) {
  return (
    <View
      className={`mb-4 rounded-panel border border-ink/5 px-6 py-7 ${done ? "bg-accent-soft" : "bg-card"}`}
    >
      <Text className="text-[22px] font-light leading-7 text-ink">{mission.title}</Text>
      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row gap-4">
          <Text className="text-[12px] tracking-[1px] text-mute">{mission.time}</Text>
          <Text className="text-[12px] tracking-[1px] text-accent">+{mission.xp} XP</Text>
        </View>
        <SoftPress
          onPress={() => onStart(mission.id)}
          disabled={done}
          className={`rounded-full px-5 py-2.5 ${done ? "bg-accent" : "bg-ink"}`}
        >
          <Text className="text-[12px] tracking-[1.5px] text-white">{done ? "Есть" : "Старт"}</Text>
        </SoftPress>
      </View>
    </View>
  );
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [done, setDone] = useState({});
  const finished = Object.keys(done).length;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 pt-3">
          <Text className="text-[28px] font-light leading-9 text-ink">Твои активности{"\n"}на сегодня</Text>
          <Text className="mt-3 text-[13px] text-mute">
            {finished} из {MISSIONS.length} целей закрыто
          </Text>
          <View className="mt-4 h-[4px] overflow-hidden rounded-full bg-card">
            <View className="h-full bg-accent" style={{ width: `${(finished / MISSIONS.length) * 100}%` }} />
          </View>
        </View>

        {MISSIONS.map((mission, index) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            index={index}
            done={Boolean(done[mission.id])}
            onStart={(id) => setDone((prev) => ({ ...prev, [id]: true }))}
          />
        ))}
      </ScrollView>
    </View>
  );
}
