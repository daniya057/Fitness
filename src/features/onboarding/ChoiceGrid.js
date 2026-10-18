import { Pressable, Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";
import { SectionLabel } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";

export function ChoiceGrid({ label, options, value, values, onChange, multi = false, columns = 1, fill = false }) {
  const selected = multi ? values || [] : [];

  const toggle = async (id) => {
    await lightTap();
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
              style={glassStyle({
                variant: fill ? "fill" : undefined,
                borderRadius: 22,
                backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.08)",
              })}
            >
              <Text className="text-[16px] font-semibold text-white">{item.title}</Text>
              {item.hint ? <Text className="mt-1 text-[12px] leading-4 text-white/50">{item.hint}</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ChoiceRow({ options, value, values, onChange, multi = false, fill = true }) {
  const selected = multi ? values || [] : [];

  const toggle = async (id) => {
    await lightTap();
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
              ...glassStyle({
                variant: fill ? "fill" : undefined,
                borderRadius: 999,
                backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.08)",
              }),
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Text className={`text-[14px] font-semibold ${on ? "text-[#9BFFC8]" : "text-white"}`}>{item.title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
