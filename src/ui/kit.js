import { Text, TextInput, View } from "react-native";
import { SoftPress } from "./SoftPress";
import { glassStyle } from "./Glass";
import { getPalette } from "./theme";

export function ScreenHeader({ title, subtitle, right, glass = false }) {
  return (
    <View className="mb-6 pt-2">
      <View className="flex-row items-center justify-between">
        <Text className={`flex-1 text-[28px] font-semibold ${glass ? "text-white" : "text-ink"}`}>{title}</Text>
        {right}
      </View>
      {subtitle ? (
        <Text className={`mt-2 text-[14px] leading-5 ${glass ? "text-white/60" : "text-mute"}`}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function SectionLabel({ children, glass = false }) {
  return (
    <Text className={`mb-3 text-[12px] font-medium tracking-[1.2px] ${glass ? "text-white/55" : "text-mute"}`}>
      {children}
    </Text>
  );
}

export function PrimaryButton({ label, onPress, busy, disabled }) {
  return (
    <SoftPress
      onPress={onPress}
      disabled={disabled || busy}
      className={`w-full items-center rounded-full py-4 ${disabled || busy ? "bg-accent/70" : "bg-accent"}`}
      style={{ backgroundColor: disabled || busy ? "#66BB6A" : "#2E7D32", borderRadius: 999, paddingVertical: 16 }}
    >
      <Text className="text-[15px] font-semibold text-white">{busy ? "Секунду" : label}</Text>
    </SoftPress>
  );
}

export function GhostButton({ label, onPress, glass = false }) {
  return (
    <SoftPress
      onPress={onPress}
      className={`items-center rounded-full px-5 py-3 ${glass ? "" : "bg-card"}`}
      style={glass ? glassStyle({ borderRadius: 999 }) : undefined}
    >
      <Text className={`text-[14px] font-medium ${glass ? "text-white" : "text-ink"}`}>{label}</Text>
    </SoftPress>
  );
}

export function MintButton({ label, onPress }) {
  return (
    <SoftPress onPress={onPress} className="items-center rounded-full bg-mint px-5 py-3">
      <Text className="text-[14px] font-medium text-ink">{label}</Text>
    </SoftPress>
  );
}

export function PillButton({ label, onPress, tone = "ghost" }) {
  const glass = tone === "glass" || tone === "glassOn" || tone === "fill";
  const bg = tone === "mint" ? "bg-mint" : tone === "accent" ? "bg-accent" : tone === "canvas" ? "bg-canvas" : glass ? "" : "bg-card";
  const color = tone === "accent" || tone === "glassOn" ? "text-white" : tone === "glass" || tone === "fill" ? "text-white/80" : "text-ink";
  return (
    <SoftPress
      onPress={onPress}
      className={`rounded-full px-4 py-2.5 ${bg} ${tone === "canvas" ? "border border-ink/10" : ""}`}
      style={
        glass
          ? glassStyle({
              variant: tone === "fill" ? "fill" : "material",
              borderRadius: 999,
              backgroundColor: tone === "glassOn" ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.1)",
            })
          : undefined
      }
    >
      <Text className={`text-[13px] font-medium ${color}`} style={tone === "glassOn" ? { color: getPalette().accent } : undefined}>
        {label}
      </Text>
    </SoftPress>
  );
}

export function Field({ label, inputName, glass = false, ...props }) {
  return (
    <View className="mb-4">
      <Text className={`mb-2 text-[12px] font-medium tracking-[0.8px] ${glass ? "text-white/55" : "text-mute"}`}>{label}</Text>
      <TextInput
        className={`rounded-2xl px-4 py-3.5 text-[16px] ${glass ? "text-white" : "bg-card text-ink"}`}
        placeholderTextColor={glass ? "#8A8A8A" : "#9E9E9E"}
        style={glass ? glassStyle({ borderRadius: 16 }) : undefined}
        nativeID={inputName}
        {...(inputName ? { name: inputName } : {})}
        {...props}
      />
    </View>
  );
}

export function StatRow({ label, value, last, glass = false }) {
  return (
    <View>
      <View className="flex-row items-center justify-between py-4">
        <Text className={`text-[15px] ${glass ? "text-white/80" : "text-ink"}`}>{label}</Text>
        <Text className={`ml-4 flex-1 text-right text-[14px] font-medium ${glass ? "text-white/55" : "text-mute"}`}>{value}</Text>
      </View>
      {last ? null : <View className="h-px" style={{ backgroundColor: glass ? "rgba(255,255,255,0.1)" : "rgba(26,26,26,0.05)" }} />}
    </View>
  );
}
