import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { ACHIEVEMENTS, earnedSet, iconOf, shownAchievements } from "./catalog";
import { Medal } from "./Medal";

const CARD = 58;
const GAP = 10;

function rowCount(width) {
  if (!width) {
    return 1;
  }
  return Math.max(1, Math.floor((width + GAP) / (CARD + GAP)));
}

export function AchievementPlaque({ user, onPress, tone = "mint" }) {
  const [width, setWidth] = useState(0);
  const earned = earnedSet(user);
  const visible = shownAchievements(user).filter((item) => !item.secret || earned.has(item.id));
  const hiddenLeft = ACHIEVEMENTS.some((item) => item.secret && !earned.has(item.id));
  const count = rowCount(width);
  const preview = visible.slice(0, count);
  const more = visible.length > preview.length || hiddenLeft;
  const glass = tone === "glass";
  const have = earned.size;
  const total = ACHIEVEMENTS.length;

  return (
    <Pressable
      onPress={onPress}
      className={`mt-3 rounded-[28px] px-5 py-5 ${glass ? "" : "bg-mint"}`}
      style={glass ? glassStyle({ borderRadius: 28 }) : undefined}
    >
      <View className="mb-4 flex-row items-end justify-between">
        <Text className={`font-semibold ${glass ? "text-[16px] text-white" : "text-[16px] text-ink"}`}>Достижения</Text>
        <Text className="text-[14px] font-semibold tabular-nums" style={{ color: glass ? getPalette().accent : "#2E7D32" }}>
          {have} / {total}
        </Text>
      </View>
      <View
        className="flex-row justify-center"
        style={{ gap: GAP }}
        onLayout={(event) => {
          const next = Math.round(event.nativeEvent.layout.width);
          if (next !== width) {
            setWidth(next);
          }
        }}
      >
        {preview.map((item, index) => {
          const Icon = iconOf(item.id);
          const on = earned.has(item.id);
          const faded = more && index === preview.length - 1;
          return (
            <View key={item.id} style={{ width: CARD, height: CARD, opacity: faded ? 0.38 : 1 }}>
              <Medal Icon={Icon} open={on} size={CARD} />
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
