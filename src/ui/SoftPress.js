import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { lightTap } from "../lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    <AnimatedPressable onPress={handlePress} disabled={disabled} style={animated}>
      <View className={className} style={style}>
        {children}
      </View>
    </AnimatedPressable>
  );
}
