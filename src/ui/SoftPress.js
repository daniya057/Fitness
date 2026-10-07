import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { lightTap } from "../lib/haptics";

export function SoftPress({ children, onPress, className, disabled, style }) {
  const scale = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = async () => {
    if (disabled) {
      return;
    }
    await lightTap();
    scale.value = withSequence(
      withTiming(0.97, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 16, stiffness: 220 })
    );
    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} disabled={disabled} className={className} style={style}>
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}
