import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { ProfileChip } from "../avatar/ProfileChip";
import { useAuth } from "../auth/AuthContext";
import { ACHIEVEMENTS, earnedSet, iconOf, isHidden, progressValue, shownAchievements } from "../achievements/catalog";
import { Medal } from "../achievements/Medal";

function rowsOf(list, size) {
  const rows = [];
  for (let i = 0; i < list.length; i += size) {
    rows.push(list.slice(i, i + size));
  }
  return rows;
}

function AchievementCard({ item, user, open }) {
  const hidden = isHidden(user, item);
  const Icon = iconOf(item.id);
  const need = Math.max(1, Number(item.need) || 1);
  const current = Math.min(progressValue(user, item), need);
  const fill = Math.max(0, Math.min(1, current / need));

  return (
    <View
      className="rounded-[28px] px-3 py-4"
      style={{
        flex: 1,
        height: 206,
        overflow: "hidden",
        ...glassStyle({
          borderRadius: 28,
          backgroundColor: open ? "rgba(125,255,179,0.1)" : hidden ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
          borderColor: open ? "rgba(155,255,200,0.4)" : undefined,
        }),
      }}
    >
      <View className="flex-1 items-center">
        <Medal Icon={Icon} open={open} hidden={hidden} progress={fill} size={58} />
        <Text className="mt-3 h-10 text-center text-[15px] font-semibold leading-5 text-white" numberOfLines={2}>
          {hidden ? "?" : item.title}
        </Text>
        <Text className="mt-1 h-8 text-center text-[12px] leading-4 text-white/50" numberOfLines={2}>
          {hidden ? "Скрытое достижение" : item.hint}
        </Text>
      </View>
      {hidden ? (
        <View className="h-7" />
      ) : open ? (
        <View className="h-7 self-center justify-center rounded-full px-3" style={{ backgroundColor: "rgba(125,255,179,0.22)" }}>
          <Text className="text-[12px] font-semibold" style={{ color: getPalette().accent }}>
            Есть
          </Text>
        </View>
      ) : (
        <Text className="h-7 text-center text-[12px] font-semibold leading-7 tabular-nums text-white/55">
          {current} / {need}
        </Text>
      )}
    </View>
  );
}

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const earned = earnedSet(user);
  const items = shownAchievements(user);
  const have = earned.size;
  const total = ACHIEVEMENTS.length;

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader glass title="Награды" subtitle={`${have} / ${total}`} right={<ProfileChip />} />

        {rowsOf(items, 2).map((row) => (
          <View key={row[0].id} className="mb-3 flex-row" style={{ gap: 12 }}>
            {row.map((item) => (
              <AchievementCard key={item.id} item={item} user={user} open={earned.has(item.id)} />
            ))}
            {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
