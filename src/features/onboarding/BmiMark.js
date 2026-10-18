import { useState } from "react";
import { Text, View } from "react-native";
import { glassStyle } from "../../ui/Glass";
import { NORMAL_FROM, NORMAL_TO, bodyMassIndex, bmiBand, bmiRatio, formatBmi } from "./bmi";

const BAR = 6;
const KNOB = 12;
const TICKS = [18.5, 25, 30];

export function BmiMark({ kg, heightCm, goalKg }) {
  const [width, setWidth] = useState(0);
  const value = bodyMassIndex(kg, heightCm);
  const band = bmiBand(value);
  if (!band) {
    return null;
  }

  const goalValue = bodyMassIndex(goalKg, heightCm);
  const showGoal = Number.isFinite(goalValue) && Math.abs(goalValue - value) >= 0.15;
  const nowX = bmiRatio(value) * width;
  const normalLeft = bmiRatio(NORMAL_FROM) * width;
  const normalWidth = Math.max(0, bmiRatio(NORMAL_TO) * width - normalLeft);

  return (
    <View className="rounded-[16px] px-4 py-3" style={glassStyle({ borderRadius: 16 })}>
      <View className="flex-row items-end justify-between">
        <Text className="text-[11px] text-white/45">ИМТ</Text>
        <Text className="text-[22px] font-semibold text-white">{formatBmi(value)}</Text>
      </View>
      <Text className="mt-0.5 text-[13px] font-medium" style={{ color: band.color }}>
        {band.title}
        {showGoal ? <Text className="font-normal text-white/45"> → цель {formatBmi(goalValue)}</Text> : null}
      </Text>
      <View className="mt-3" style={{ paddingTop: 4, paddingBottom: 16 }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <View className="overflow-hidden rounded-full" style={{ height: BAR, backgroundColor: "rgba(255,255,255,0.14)" }}>
          {width > 0 ? (
            <View
              style={{
                position: "absolute",
                left: normalLeft,
                width: normalWidth,
                height: BAR,
                backgroundColor: "rgba(155,255,200,0.55)",
              }}
            />
          ) : null}
        </View>
        {width > 0 ? (
          <>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: nowX - KNOB / 2,
                top: 4 + BAR / 2 - KNOB / 2,
                width: KNOB,
                height: KNOB,
                borderRadius: 999,
                backgroundColor: "#F4FFF8",
              }}
            />
            {TICKS.map((tick) => (
              <Text
                key={tick}
                className="text-[10px] text-white/35"
                style={{
                  position: "absolute",
                  left: bmiRatio(tick) * width - 14,
                  top: 4 + BAR + 6,
                  width: 28,
                  textAlign: "center",
                }}
              >
                {tick}
              </Text>
            ))}
          </>
        ) : null}
      </View>
    </View>
  );
}
