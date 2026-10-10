import { Pressable, Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";
import { SectionLabel } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { EXPERIENCE } from "./catalog";

export function ExperiencePicker({ value, onChange, glass = false }) {
  return (
    <View className="mb-2">
      <SectionLabel glass={glass}>Как давно занимаешься</SectionLabel>
      {EXPERIENCE.map((item) => {
        const on = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={async () => {
              await lightTap();
              onChange(item.id);
            }}
            className={`mb-2 rounded-[22px] px-4 py-4 ${glass ? "" : on ? "bg-mint" : "bg-card"}`}
            style={
              glass
                ? glassStyle({
                    borderRadius: 22,
                    backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.08)",
                  })
                : undefined
            }
          >
            <Text className={`text-[16px] font-semibold ${glass ? "text-white" : "text-ink"}`}>{item.title}</Text>
            {item.hint ? <Text className={`mt-1 text-[12px] ${glass ? "text-white/50" : "text-mute"}`}>{item.hint}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
