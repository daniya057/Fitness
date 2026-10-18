import { Text, View } from "react-native";
import { ChoiceRow } from "./ChoiceGrid";
import { WEEKDAY_OPTIONS } from "./quiz";

export function DaysPicker({ values, onChange, label = "В какие дни удобно", fill = true }) {
  return (
    <View className="mb-1">
      {label ? <Text className="mb-2 text-[13px] text-white/55">{label}</Text> : null}
      <ChoiceRow fill={fill} options={WEEKDAY_OPTIONS} values={values} onChange={onChange} multi />
    </View>
  );
}
