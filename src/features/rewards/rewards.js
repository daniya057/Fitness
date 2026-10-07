import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader, SectionLabel } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";
import { earnedSet, iconOf, isHidden, progressValue, shownAchievements } from "../achievements/catalog";

function AchievementCard({ item, user, open }) {
  const hidden = isHidden(user, item);
  const Icon = iconOf(item.id);
  const need = Math.max(1, Number(item.need) || 1);
  const current = Math.min(progressValue(user, item), need);
  const fill = Math.max(0, Math.min(100, (current / need) * 100));

  if (hidden) {
    return (
      <View className="mb-3 justify-between rounded-[24px] bg-card px-4 py-5" style={{ width: "48%", height: 210 }}>
        <View>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-canvas">
            <Text className="text-[22px] font-semibold text-mute">?</Text>
          </View>
          <Text className="mt-4 text-[16px] font-semibold leading-5 text-ink" numberOfLines={2}>
            ?
          </Text>
          <Text className="mt-1 text-[12px] leading-4 text-mute" numberOfLines={2}>
            Скрытое достижение
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`mb-3 justify-between rounded-[24px] px-4 py-5 ${open ? "bg-mint" : "bg-card"}`}
      style={{ width: "48%", height: 210 }}
    >
      <View>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-canvas">
          <Icon size={22} color={open ? "#2E7D32" : "#C8C8C8"} strokeWidth={1.6} />
        </View>
        <Text className="mt-4 text-[16px] font-semibold leading-5 text-ink" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="mt-1 text-[12px] leading-4 text-mute" numberOfLines={2}>
          {item.hint}
        </Text>
      </View>
      {open ? (
        <Text className="text-[12px] font-semibold text-accent">Есть</Text>
      ) : (
        <View>
          <View className="h-[6px] overflow-hidden rounded-full bg-canvas">
            <View className="h-full rounded-full bg-accent" style={{ width: `${fill}%` }} />
          </View>
          <Text className="mt-2 text-[12px] font-medium text-mute">
            {current} / {need}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const earned = earnedSet(user);
  const items = shownAchievements(user);

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Награды" subtitle="Открытые цветом, остальные ещё впереди" />

        <SectionLabel>Достижения</SectionLabel>
        <View className="flex-row flex-wrap justify-between">
          {items.map((item) => (
            <AchievementCard key={item.id} item={item} user={user} open={earned.has(item.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
