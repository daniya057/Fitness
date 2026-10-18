import { Text, View } from "react-native";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";

export function PromptRow({ kicker, title, action, onPress }) {
  return (
    <SoftPress
      onPress={onPress}
      className="mb-5 flex-row items-center rounded-[22px] px-4"
      style={{ ...glassStyle({ variant: "fill", borderRadius: 22 }), minHeight: 64 }}
    >
      <View className="flex-1 pr-3">
        {kicker ? <Text className="text-[11px] font-medium tracking-[1px] text-white/55">{kicker}</Text> : null}
        <Text className="mt-0.5 text-[16px] font-semibold text-white">{title}</Text>
      </View>
      <Text className="text-[14px] font-semibold" style={{ color: getPalette().accent }}>
        {action}
      </Text>
    </SoftPress>
  );
}
