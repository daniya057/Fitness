import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { ACHIEVEMENTS, conditionOf, earnedSet, iconOf, shownAchievements } from "./catalog";
import { Medal } from "./Medal";

function AchievementTile({ item, open, glass, plain, onPress }) {
  const Icon = iconOf(item.id);
  const ink = glass ? "text-white" : "text-ink";
  const mute = glass ? "text-white/55" : "text-mute";

  return (
    <Pressable
      onPress={onPress}
      className="items-center px-2.5 py-2"
      style={
        plain
          ? { width: 120 }
          : {
              width: 120,
              borderRadius: 16,
              backgroundColor: open ? "rgba(125,255,179,0.14)" : "rgba(255,255,255,0.06)",
            }
      }
    >
      <Medal Icon={Icon} open={open} size={36} />
      <Text
        className={`mt-1.5 w-full text-center text-[12px] font-semibold leading-4 ${ink}`}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text className={`mt-0.5 w-full text-center text-[11px] leading-4 ${mute}`} numberOfLines={2}>
        {conditionOf(item)}
      </Text>
    </Pressable>
  );
}

export function AchievementPlaque({ user, onPress, tone = "mint", framed = true }) {
  const earned = earnedSet(user);
  const visible = shownAchievements(user).filter((item) => !item.secret || earned.has(item.id));
  const glass = tone === "glass";
  const have = earned.size;
  const total = ACHIEVEMENTS.length;
  const more = visible.length > 3;
  const plain = !framed;

  return (
    <View
      className={`${framed ? "mt-8 rounded-[24px] py-4" : "mt-3 py-1"} ${glass || !framed ? "" : "bg-mint"}`}
      style={framed && glass ? glassStyle({ borderRadius: 24 }) : undefined}
    >
      <Pressable onPress={onPress} className={`mb-2 flex-row items-end justify-between ${framed ? "px-4" : ""}`}>
        <Text className={`font-semibold ${glass ? "text-[15px] text-white" : "text-[15px] text-ink"}`}>Достижения</Text>
        <Text className="text-[13px] font-semibold tabular-nums" style={{ color: glass ? getPalette().accent : "#2E7D32" }}>
          {have} / {total}
        </Text>
      </Pressable>
      <View>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 4, paddingHorizontal: framed ? 12 : 0, paddingRight: framed ? 24 : 8 }}
        >
          {visible.map((item) => (
            <AchievementTile
              key={item.id}
              item={item}
              open={earned.has(item.id)}
              glass={glass}
              plain={plain}
              onPress={onPress}
            />
          ))}
        </ScrollView>
        {more ? (
          <View pointerEvents="none" className="absolute bottom-0 right-0 top-0 w-7 items-center justify-center">
            <ChevronRight size={18} color={glass ? "rgba(255,255,255,0.55)" : "#666666"} strokeWidth={2} />
          </View>
        ) : null}
      </View>
    </View>
  );
}
