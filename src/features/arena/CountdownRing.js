import { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { Easing, cancelAnimation, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CountdownRing({
  progress,
  size = 148,
  track = "#E8F5E9",
  stroke = "#2E7D32",
  smooth = false,
  running = false,
  stepKey = 0,
  totalSec = 1,
  remaining = 0,
}) {
  const strokeWidth = size < 100 ? 7 : size > 180 ? 14 : 11;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0.04, Math.min(1, progress));
  const offset = useSharedValue(smooth ? 0 : circumference * (1 - clamped));
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  useEffect(() => {
    if (smooth) {
      return;
    }
    cancelAnimation(offset);
    offset.value = circumference * (1 - clamped);
  }, [smooth, clamped, circumference, offset]);

  useEffect(() => {
    if (!smooth) {
      return;
    }
    const left = Math.max(0, Number(remainingRef.current) || 0);
    const fraction = totalSec > 0 ? Math.max(0, Math.min(1, left / totalSec)) : 0;
    if (!running) {
      cancelAnimation(offset);
      offset.value = circumference * (1 - fraction);
      return;
    }
    offset.value = circumference * (1 - fraction);
    offset.value = withTiming(circumference, {
      duration: Math.max(16, left * 1000),
      easing: Easing.linear,
    });
  }, [smooth, running, stepKey, totalSec, circumference, offset]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}
