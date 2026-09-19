import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function XpBar({ progress }) {
  const width = useSharedValue(0);

  useEffect(() => {
    const next = Math.max(0, Math.min(1, progress));
    width.value = withTiming(next, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View className="mt-5 h-[6px] w-52 overflow-hidden rounded-full bg-accent-soft">
      <Animated.View className="h-full rounded-full bg-accent" style={fillStyle} />
    </View>
  );
}
