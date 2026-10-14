import { Platform, Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { lightTap } from "../lib/haptics";

const phoneWeb =
  Platform.OS === "web" &&
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function SoftPress({ children, onPress, className, disabled, style, sheen = true }) {
  const scale = useSharedValue(1);
  const sweep = useSharedValue(-1.2);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: sweep.value > -1 && sweep.value < 1.35 ? 0.55 : 0,
    transform: [{ translateX: sweep.value * 160 }, { rotate: "18deg" }],
  }));

  const handlePress = async () => {
    if (disabled) {
      return;
    }
    await lightTap();
    scale.value = withSequence(
      withTiming(0.97, { duration: 80, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 16, stiffness: 260 })
    );
    if (sheen) {
      sweep.value = -1.2;
      sweep.value = withTiming(1.45, { duration: 480, easing: Easing.out(Easing.cubic) });
    }
    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      onPress={handlePress}
      disabled={disabled}
      className={className}
      style={[
        {
          position: "relative",
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
          opacity: disabled ? 0.5 : 1,
        },
        style,
        sheen && !phoneWeb ? { overflow: "hidden" } : null,
      ]}
    >
      <Animated.View style={[animated, { alignItems: "center", justifyContent: "center", width: "100%" }]}>
        {children}
      </Animated.View>
      {sheen ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -40,
              bottom: -40,
              width: 28,
              backgroundColor: "rgba(255,255,255,0.34)",
            },
            sheenStyle,
          ]}
        />
      ) : null}
    </Pressable>
  );
}
