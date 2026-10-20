import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Field, GhostButton, PrimaryButton } from "../../ui/kit";
import { AmbientWash, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "./AuthContext";

export default function EmailVerifyScreen() {
  const insets = useSafeAreaInsets();
  const { user, emailCode, verifyEmail, resendEmailCode, logout } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (emailCode) {
      setCode(emailCode);
    }
  }, [emailCode]);

  const submit = async () => {
    setError("");
    setHint("");
    setBusy(true);
    try {
      await verifyEmail(code);
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    setHint("");
    setBusy(true);
    try {
      const data = await resendEmailCode();
      setHint(data?.mailed ? "Новый код на почте" : data?.code ? `Письмо не дошло. Код: ${data.code}` : "Новый код готов");
      if (data?.code) {
        setCode(data.code);
      }
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top, backgroundColor: getPalette().bg }}
    >
      <StatusBar style="light" />
      <AmbientWash />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-8 rounded-[28px] px-6 py-8" style={glassStyle({ borderRadius: 28 })}>
          <Text className="text-[12px] font-medium tracking-[1.2px]" style={{ color: getPalette().accent }}>
            FITNESS
          </Text>
          <Text className="mt-2 text-[28px] font-semibold text-white">Почта</Text>
          <Text className="mt-3 text-[14px] leading-5 text-white/55">
            {emailCode
              ? `Письмо на ${user?.email} не дошло. Код: ${emailCode}`
              : `Код ушёл на ${user?.email}`}
          </Text>
        </View>

        <View className="mt-8">
          <Field
            glass
            label="Код"
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            inputName="fitness-verify-code"
            maxLength={6}
          />
          {hint ? <Text className="mb-4 text-[14px] text-white/55">{hint}</Text> : null}
          {error ? <Text className="mb-4 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton label="Подтвердить" onPress={submit} busy={busy} />
          <View className="mt-4">
            <GhostButton glass label="Выслать ещё раз" onPress={resend} />
          </View>
          <View className="mt-3">
            <GhostButton glass label="Другая почта" onPress={logout} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
