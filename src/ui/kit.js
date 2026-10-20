import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { SoftPress } from "./SoftPress";
import { glassStyle } from "./Glass";
import { getPalette } from "./theme";
import { ctaFill } from "./cta";

const INK = "#10201A";
const LIGHT_ACCENT = "#2E7D32";

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

export function PrimaryButton({ label, onPress, busy, disabled, glass = true }) {
  const idle = !(disabled || busy);
  const backgroundColor = glass
    ? idle
      ? getPalette().accent
      : "rgba(155,255,200,0.45)"
    : idle
      ? LIGHT_ACCENT
      : "#66BB6A";
  return (
    <SoftPress
      onPress={onPress}
      disabled={disabled || busy}
      className="w-full items-center justify-center rounded-full"
      style={ctaFill(backgroundColor)}
    >
      <Text className="text-[15px] font-semibold" style={{ color: glass ? INK : "#FFFFFF" }}>
        {busy ? "Секунду" : label}
      </Text>
    </SoftPress>
  );
}

export function GhostButton({ label, onPress, glass = false }) {
  return (
    <SoftPress
      onPress={onPress}
      className={`w-full items-center justify-center rounded-full ${glass ? "" : "bg-card"}`}
      style={
        glass
          ? {
              ...glassStyle({ variant: "fill", borderRadius: 999 }),
              minHeight: 48,
              paddingHorizontal: 20,
            }
          : { minHeight: 48, borderRadius: 999, paddingHorizontal: 20 }
      }
    >
      <Text className={`text-[15px] font-medium ${glass ? "text-white" : "text-ink"}`}>{label}</Text>
    </SoftPress>
  );
}

export function MintButton({ label, onPress }) {
  return (
    <SoftPress
      onPress={onPress}
      className="items-center justify-center rounded-full bg-mint"
      style={{ minHeight: 48, paddingHorizontal: 20, borderRadius: 999 }}
    >
      <Text className="text-[15px] font-medium text-ink">{label}</Text>
    </SoftPress>
  );
}

export function TextLink({ label, onPress, danger = false }) {
  return (
    <SoftPress
      sheen={false}
      onPress={onPress}
      className="items-center justify-center px-2"
      style={{ minHeight: 48 }}
    >
      <Text className="text-[15px] font-semibold" style={{ color: danger ? "rgba(255,170,170,0.95)" : getPalette().accent }}>
        {label}
      </Text>
    </SoftPress>
  );
}

export function PillButton({ label, onPress, tone = "ghost", disabled, wide = false }) {
  const on = tone === "glassOn";
  const fill = tone === "fill" || tone === "glass";
  const mint = tone === "mint";
  const accent = tone === "accent";
  const canvas = tone === "canvas";
  return (
    <SoftPress
      onPress={onPress}
      disabled={disabled}
      className={`${wide ? "w-full " : ""}items-center justify-center rounded-full`}
      sheen={on}
      style={
        on
          ? {
              minHeight: 48,
              paddingHorizontal: 18,
              borderRadius: 999,
              backgroundColor: getPalette().accent,
            }
          : fill
            ? {
                ...glassStyle({ variant: "fill", borderRadius: 999 }),
                minHeight: 48,
                paddingHorizontal: 18,
              }
            : {
                minHeight: 48,
                paddingHorizontal: 18,
                borderRadius: 999,
                backgroundColor: mint ? "#C9EBD6" : accent ? LIGHT_ACCENT : canvas ? "#FFFFFF" : "#F8F9FA",
                ...(canvas ? { borderWidth: 1, borderColor: "rgba(26,26,26,0.1)" } : null),
              }
      }
    >
      <Text
        className="text-[14px] font-semibold"
        style={{
          color: on || mint ? INK : accent ? "#FFFFFF" : fill ? "rgba(255,255,255,0.88)" : "#1A1A1A",
        }}
      >
        {label}
      </Text>
    </SoftPress>
  );
}

export function Field({ label, inputName, glass = false, secureTextEntry, ...props }) {
  const [shown, setShown] = useState(false);
  const secret = Boolean(secureTextEntry);
  const hidden = secret && !shown;
  return (
    <View className="mb-4">
      <Text className={`mb-2 text-[12px] font-medium tracking-[0.8px] ${glass ? "text-white/55" : "text-mute"}`}>{label}</Text>
      <View>
        <TextInput
          className={`rounded-2xl px-4 text-[16px] ${glass ? "text-white" : "bg-card text-ink"}`}
          placeholderTextColor={glass ? "#8A8A8A" : "#9E9E9E"}
          style={[
            { minHeight: 48, paddingVertical: 12, paddingRight: secret ? 52 : 16 },
            glass ? glassStyle({ variant: "fill", borderRadius: 16 }) : null,
          ]}
          nativeID={inputName}
          secureTextEntry={hidden}
          {...(inputName ? { name: inputName } : {})}
          {...props}
        />
        {secret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={shown ? "Скрыть пароль" : "Показать пароль"}
            onPress={() => setShown((prev) => !prev)}
            hitSlop={8}
            style={{ position: "absolute", right: 8, top: 0, bottom: 0, width: 44, alignItems: "center", justifyContent: "center" }}
          >
            {shown ? (
              <EyeOff size={18} color={glass ? "rgba(255,255,255,0.55)" : "#666666"} strokeWidth={1.8} />
            ) : (
              <Eye size={18} color={glass ? "rgba(255,255,255,0.55)" : "#666666"} strokeWidth={1.8} />
            )}
          </Pressable>
        ) : null}
      </View>
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
