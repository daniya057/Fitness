import { Platform, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { getPalette } from "../../ui/theme";

export function Medal({ Icon, open, hidden, progress = 0, size = 64 }) {
  const palette = getPalette();
  const stroke = size >= 64 ? 4 : 3;
  const radius = (size - stroke) / 2;
  const circle = 2 * Math.PI * radius;
  const fill = open ? 1 : Math.max(0, Math.min(1, Number(progress) || 0));
  const iconSize = Math.round(size * 0.4);
  const ink = open ? palette.accent : hidden ? "rgba(255,255,255,0.38)" : palette.faint;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{
          transform: [{ rotate: "-90deg" }],
          ...(open && Platform.OS === "web"
            ? { boxShadow: "0 0 12px 2px rgba(125,255,179,0.35)", borderRadius: size / 2 }
            : null),
        }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={open ? "rgba(155,255,200,0.45)" : "rgba(255,255,255,0.12)"}
          strokeWidth={stroke}
          fill={open ? "rgba(125,255,179,0.14)" : "rgba(255,255,255,0.06)"}
        />
        {fill > 0.02 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.accent}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circle * fill} ${circle}`}
          />
        ) : null}
      </Svg>
      <View
        pointerEvents="none"
        className="absolute items-center justify-center"
        style={{ top: 0, left: 0, width: size, height: size }}
      >
        {hidden ? (
          <Text className="text-[22px] font-semibold text-white/40">?</Text>
        ) : (
          <Icon size={iconSize} color={ink} strokeWidth={open ? 2.2 : 1.7} fill={open ? ink : "none"} />
        )}
      </View>
    </View>
  );
}
