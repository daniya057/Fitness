import { ScrollView, Text, View } from "react-native";
import { Award } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";
import { ScreenHeader, SectionLabel } from "../../ui/kit";

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
    <View className={`h-8 w-8 items-center justify-center rounded-full ${glow ? "bg-mint" : "bg-canvas"}`}>
      <Text className={`text-[13px] font-semibold ${glow ? "text-accent" : "text-mute"}`}>{place}</Text>
    </View>
  );
}

function BadgeTile({ badge }) {
  return (
    <View className="mb-3 w-[48%] rounded-[24px] bg-card px-4 py-5">
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${badge.open ? "bg-mint" : "bg-canvas"}`}>
        <Award size={22} color={badge.open ? "#2E7D32" : "#8A8A8A"} strokeWidth={1.6} />
      </View>
      <Text className="mt-3 text-[14px] font-semibold text-ink">{badge.title}</Text>
      {badge.open ? (
        <Text className="mt-1 text-[12px] font-medium text-accent">Открыто</Text>
      ) : (
        <View className="mt-3 flex-row gap-1">
          {[0, 1, 2, 3, 4].map((dot) => (
            <View
              key={dot}
              className={`h-1.5 w-1.5 rounded-full ${dot < Math.round(badge.progress * 5) ? "bg-accent" : "bg-ink/10"}`}
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
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Награды" subtitle="Друзья за последние 24 часа" />

        <View className="rounded-[28px] bg-card px-2 py-2">
          {BOARD.map((row) => (
            <SoftPress key={row.name} onPress={() => {}}>
              <View className={`flex-row items-center rounded-[22px] px-3 py-3 ${row.me ? "bg-mint" : ""}`}>
                <PlaceMark place={row.place} />
                <Text className={`ml-3 flex-1 text-[16px] font-medium ${row.me ? "text-accent" : "text-ink"}`}>
                  {row.name}
                </Text>
                <Text className="text-[13px] font-semibold text-mute">{row.xp} XP</Text>
              </View>
            </SoftPress>
          ))}
        </View>

        <View className="mt-8">
          <SectionLabel>Достижения</SectionLabel>
          <View className="flex-row flex-wrap justify-between">
            {BADGES.map((badge) => (
              <BadgeTile key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
