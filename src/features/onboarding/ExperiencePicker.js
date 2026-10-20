import { Pressable, Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";
import { SectionLabel } from "../../ui/kit";
import { EXPERIENCE } from "./catalog";
import { choiceHintStyle, choiceSurface, choiceTitleStyle } from "./ChoiceGrid";

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
            style={glass ? choiceSurface(on, { radius: 22 }) : undefined}
          >
            <Text className={`text-[16px] font-semibold ${glass ? "" : "text-ink"}`} style={glass ? choiceTitleStyle(on) : undefined}>
              {item.title}
            </Text>
            {item.hint ? (
              <Text className={`mt-1 text-[12px] ${glass ? "" : "text-mute"}`} style={glass ? choiceHintStyle(on) : undefined}>
                {item.hint}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
