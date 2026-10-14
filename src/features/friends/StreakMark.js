import { Text, View } from "react-native";
import { Flame } from "lucide-react-native";
import { glassStyle } from "../../ui/Glass";
import { lookOfStreak } from "../streaks/look";

export function StreakMark({ days, compact = false }) {
  const look = lookOfStreak(days);
  if (compact) {
    return (
      <View className="flex-row items-center">
        <Flame size={16} color={look.flame} fill={look.flame} strokeWidth={2.2} />
        <Text className="ml-1 text-[16px] font-semibold tabular-nums text-white">{look.days}</Text>
      </View>
    );
  }
  return (
    <View
      className="min-w-[72px] items-center rounded-[18px] px-3 py-2"
      style={glassStyle({
        variant: "fill",
        borderRadius: 18,
        backgroundColor: "rgba(255, 92, 26, 0.16)",
        borderColor: "rgba(255, 92, 26, 0.45)",
      })}
    >
      <Flame size={22} color={look.flame} fill={look.flame} strokeWidth={2.4} />
      <Text className="mt-0.5 text-[22px] font-semibold leading-6 tabular-nums text-white">{look.days}</Text>
      <Text className="text-[10px] leading-3 text-white/55">дней</Text>
    </View>
  );
}
