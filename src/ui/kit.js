import { Text, TextInput, View } from "react-native";
import { SoftPress } from "./SoftPress";

export function ScreenHeader({ title, subtitle, right }) {
  return (
    <View className="mb-6 pt-2">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-[28px] font-semibold text-ink">{title}</Text>
        {right}
      </View>
      {subtitle ? <Text className="mt-2 text-[14px] leading-5 text-mute">{subtitle}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children }) {
  return <Text className="mb-3 text-[12px] font-medium tracking-[1.2px] text-mute">{children}</Text>;
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

export function GhostButton({ label, onPress }) {
  return (
    <SoftPress onPress={onPress} className="items-center rounded-full bg-card px-5 py-3">
      <Text className="text-[14px] font-medium text-ink">{label}</Text>
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
  const bg = tone === "mint" ? "bg-mint" : tone === "accent" ? "bg-accent" : tone === "canvas" ? "bg-canvas" : "bg-card";
  const color = tone === "accent" ? "text-white" : "text-ink";
  return (
    <SoftPress onPress={onPress} className={`rounded-full px-4 py-2.5 ${bg} ${tone === "canvas" ? "border border-ink/10" : ""}`}>
      <Text className={`text-[13px] font-medium ${color}`}>{label}</Text>
    </SoftPress>
  );
}

export function Field({ label, ...props }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[12px] font-medium tracking-[0.8px] text-mute">{label}</Text>
      <TextInput
        className="rounded-2xl bg-card px-4 py-3.5 text-[16px] text-ink"
        placeholderTextColor="#9E9E9E"
        {...props}
      />
    </View>
  );
}

export function StatRow({ label, value, last }) {
  return (
    <View>
      <View className="flex-row items-center justify-between py-4">
        <Text className="text-[15px] text-ink">{label}</Text>
        <Text className="ml-4 flex-1 text-right text-[14px] font-medium text-mute">{value}</Text>
      </View>
      {last ? null : <View className="h-px bg-ink/5" />}
    </View>
  );
}
