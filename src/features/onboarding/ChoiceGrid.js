import { Pressable, Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";
import { SectionLabel } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { ACCENT_INK } from "../../ui/layout";
import { getPalette } from "../../ui/theme";

export function choiceSurface(on, { fill = false, radius = 22 } = {}) {
  if (on) {
    return {
      backgroundColor: getPalette().accent,
      borderRadius: radius,
    };
  }
  return glassStyle({
    variant: fill ? "fill" : undefined,
    borderRadius: radius,
    backgroundColor: "rgba(255,255,255,0.08)",
  });
}

export function choiceTitleStyle(on) {
  return { color: on ? ACCENT_INK : "#F2FAF6" };
}

export function choiceHintStyle(on) {
  return { color: on ? "rgba(16,32,26,0.58)" : "rgba(242,250,246,0.5)" };
}

export function ChoiceGrid({ label, options, value, values, onChange, multi = false, columns = 1, fill = false }) {
  const selected = multi ? values || [] : [];

  const toggle = (id) => {
    lightTap();
    if (!multi) {
      onChange(id);
      return;
    }
    if (id === "all" || id === "none") {
      onChange([id]);
      return;
    }
    const withoutSolo = selected.filter((item) => item !== "all" && item !== "none");
    const next = withoutSolo.includes(id) ? withoutSolo.filter((item) => item !== id) : [...withoutSolo, id];
    onChange(next.length ? next : []);
  };

  return (
    <View className="mb-2">
      {label ? <SectionLabel glass>{label}</SectionLabel> : null}
      <View className={columns === 2 ? "flex-row flex-wrap justify-between" : ""}>
        {options.map((item) => {
          const on = multi ? selected.includes(item.id) : value === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              className={`mb-3 rounded-[22px] px-4 py-4 ${columns === 2 ? "w-[48%]" : "w-full"}`}
              style={choiceSurface(on, { fill, radius: 22 })}
            >
              <Text className="text-[16px] font-semibold" style={choiceTitleStyle(on)}>
                {item.title}
              </Text>
              {item.hint ? (
                <Text className="mt-1 text-[12px] leading-4" style={choiceHintStyle(on)}>
                  {item.hint}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ChoiceRow({ options, value, values, onChange, multi = false, fill = true }) {
  const selected = multi ? values || [] : [];

  const toggle = (id) => {
    lightTap();
    if (!multi) {
      onChange(id);
      return;
    }
    if (id === "none") {
      onChange(selected.includes("none") ? [] : ["none"]);
      return;
    }
    const withoutNone = selected.filter((item) => item !== "none");
    const next = withoutNone.includes(id) ? withoutNone.filter((item) => item !== id) : [...withoutNone, id];
    onChange(next);
  };

  return (
    <View className="mb-3 flex-row flex-wrap" style={{ gap: 8 }}>
      {options.map((item) => {
        const on = multi ? selected.includes(item.id) : value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => toggle(item.id)}
            className="rounded-full px-3"
            style={{
              ...choiceSurface(on, { fill, radius: 999 }),
              minHeight: 44,
              justifyContent: "center",
              paddingHorizontal: 14,
            }}
          >
            <Text className="text-[14px] font-semibold" style={choiceTitleStyle(on)}>
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
