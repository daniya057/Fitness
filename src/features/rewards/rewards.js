import { ScrollView, Text, View } from "react-native";
import { Award } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";

const BOARD = [
  { place: 1, name: "Мира", xp: 86 },
  { place: 2, name: "Тихон", xp: 74 },
  { place: 3, name: "Аня", xp: 61 },
  { place: 4, name: "Ты", xp: 54, me: true },
  { place: 5, name: "Лев", xp: 41 },
];

const BADGES = [
  { id: "first", title: "Первый шаг", open: true, progress: 1 },
  { id: "three", title: "3 дня ритма", open: true, progress: 1 },
  { id: "week", title: "Неделя заботы", open: false, progress: 0.45 },
  { id: "focus", title: "Тихий фокус", open: true, progress: 1 },
  { id: "month", title: "30 дейликов", open: false, progress: 0.12 },
  { id: "pair", title: "Парная серия", open: false, progress: 0.3 },
];

function PlaceMark({ place }) {
  const glow = place <= 3;
  return (
    <View className={`h-7 w-7 items-center justify-center rounded-full ${glow ? "bg-accent-soft" : ""}`}>
      <Text className={`text-[13px] font-light ${glow ? "text-accent" : "text-mute"}`}>{place}</Text>
    </View>
  );
}

function BadgeTile({ badge }) {
  return (
    <View className="mb-3 w-[48%] rounded-panel border border-ink/5 bg-card px-4 py-5">
      <View
        className={`h-12 w-12 items-center justify-center rounded-2xl ${badge.open ? "bg-accent-soft" : "border border-ink/15"}`}
      >
        <Award size={22} color={badge.open ? "#2E7D32" : "#666666"} strokeWidth={1.5} />
      </View>
      <Text className="mt-3 text-[14px] font-light text-ink">{badge.title}</Text>
      {badge.open ? (
        <Text className="mt-1 text-[11px] tracking-[1px] text-accent">Открыто</Text>
      ) : (
        <View className="mt-3 flex-row gap-1">
          {[0, 1, 2, 3, 4].map((dot) => (
            <View
              key={dot}
              className={`h-1.5 w-1.5 rounded-full ${dot < Math.round(badge.progress * 5) ? "bg-accent/50" : "bg-ink/10"}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-3">
          <Text className="text-[28px] font-light text-ink">Награды</Text>
          <Text className="mt-2 text-[13px] text-mute">Друзья за последние 24 часа</Text>
        </View>

        <View className="mt-6">
          {BOARD.map((row, index) => (
            <SoftPress key={row.name} onPress={() => {}}>
              <View
                className={`flex-row items-center py-3.5 ${index < BOARD.length - 1 ? "border-b border-ink/5" : ""}`}
              >
                <PlaceMark place={row.place} />
                <Text className={`ml-3 flex-1 text-[16px] font-light ${row.me ? "text-accent" : "text-ink"}`}>
                  {row.name}
                </Text>
                <Text className="text-[13px] text-mute">{row.xp} XP</Text>
              </View>
            </SoftPress>
          ))}
        </View>

        <Text className="mb-4 mt-10 text-[13px] tracking-[1.5px] text-mute">Достижения</Text>
        <View className="flex-row flex-wrap justify-between">
          {BADGES.map((badge) => (
            <BadgeTile key={badge.id} badge={badge} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
