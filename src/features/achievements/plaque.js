import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ACHIEVEMENTS, earnedSet, iconOf, shownAchievements } from "./catalog";

const CARD = 56;
const GAP = 8;

function rowCount(width) {
  if (!width) {
    return 1;
  }
  return Math.max(1, Math.floor((width + GAP) / (CARD + GAP)));
}

export function AchievementPlaque({ user, onPress }) {
  const [width, setWidth] = useState(0);
  const earned = earnedSet(user);
  const visible = shownAchievements(user).filter((item) => !item.secret || earned.has(item.id));
  const hiddenLeft = ACHIEVEMENTS.some((item) => item.secret && !earned.has(item.id));
  const count = rowCount(width);
  const preview = visible.slice(0, count);
  const more = visible.length > preview.length || hiddenLeft;

  return (
    <Pressable onPress={onPress} className="mt-3 rounded-[28px] bg-mint px-4 py-5">
      <Text className="mb-4 text-center text-[16px] font-semibold text-ink">Достижения</Text>
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
            <View
              key={item.id}
              className="items-center justify-center rounded-2xl bg-canvas"
              style={{ width: CARD, height: CARD, opacity: faded ? 0.4 : 1 }}
            >
              <Icon size={22} color={on ? "#2E7D32" : "#C8C8C8"} strokeWidth={1.6} />
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
