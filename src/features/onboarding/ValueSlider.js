import { useMemo, useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";

export function ValueSlider({ label, value, min, max, step, unit, onChange }) {
  const [width, setWidth] = useState(1);
  const lastHaptic = useRef(0);
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  const applyX = (x) => {
    const t = Math.max(0, Math.min(1, x / width));
    const raw = min + t * (max - min);
    const snapped = Math.round(raw / step) * step;
    const next = Math.max(min, Math.min(max, Number(snapped.toFixed(1))));
    if (next !== value) {
      const now = Date.now();
      if (now - lastHaptic.current > 90) {
        lastHaptic.current = now;
        lightTap();
      }
      onChange(next);
    }
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => applyX(event.nativeEvent.locationX),
        onPanResponderMove: (event) => applyX(event.nativeEvent.locationX),
      }),
    [width, min, max, step, value]
  );

  const pretty = Number.isInteger(step) ? String(Math.round(value)) : value.toFixed(1);

  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-end justify-between">
        <Text className="text-[13px] font-medium text-mute">{label}</Text>
        <Text className="text-[22px] font-semibold text-ink">
          {pretty} <Text className="text-[13px] font-normal text-mute">{unit}</Text>
        </Text>
      </View>
      <View className="h-10 justify-center" onLayout={(event) => setWidth(event.nativeEvent.layout.width)} {...pan.panHandlers}>
        <View className="h-[8px] overflow-hidden rounded-full bg-card">
          <View className="h-full rounded-full bg-accent" style={{ width: `${ratio * 100}%` }} />
        </View>
        <View
          className="absolute h-6 w-6 rounded-full border-2 border-accent bg-canvas"
          style={{ left: Math.max(0, ratio * width - 12) }}
        />
      </View>
    </View>
  );
}
