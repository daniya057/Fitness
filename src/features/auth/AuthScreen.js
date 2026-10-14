import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Field, GhostButton, PrimaryButton } from "../../ui/kit";
import { AmbientWash, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "./AuthContext";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { register, login, requestPasswordReset, resetPassword } = useAuth();
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const goLogin = () => {
    setError("");
    setPassword("");
    setCode("");
    setAwaitingCode(false);
    setMode("login");
  };

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register({ name, email, password });
        return;
      }
      if (mode === "login") {
        await login({ email, password });
        return;
      }
      if (!awaitingCode) {
        const data = await requestPasswordReset(email);
        setAwaitingCode(true);
        if (data.code) {
          setCode(data.code);
        }
        return;
      }
      await resetPassword({ email, code, password });
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    setError("");
    setPassword("");
    setCode("");
    setAwaitingCode(false);
    if (mode === "login") {
      setEmail("");
    }
    setMode(mode === "register" ? "login" : "register");
  };

  const title = mode === "register" ? "Регистрация" : mode === "reset" ? "Новый пароль" : "Вход";
  const primary =
    mode === "register" ? "Зарегистрироваться" : mode === "login" ? "Войти" : awaitingCode ? "Сменить пароль" : "Получить код";

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
          <Text className="text-[12px] font-medium tracking-[1.2px] text-[#9BFFC8]">FITNESS</Text>
          <Text className="mt-2 text-[28px] font-semibold text-white">{title}</Text>
        </View>

        <View className="mt-8">
          {mode === "register" ? (
            <Field
              glass
              label="Имя"
              value={name}
              onChangeText={setName}
              placeholder="Имя"
              autoComplete="name"
              textContentType="name"
              inputName="fitness-name"
            />
          ) : null}
          <Field
            glass
            label="Почта"
            value={email}
            onChangeText={setEmail}
            placeholder="you@mail.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete={mode === "register" ? "off" : "email"}
            textContentType="emailAddress"
            importantForAutofill={mode === "register" ? "no" : "yes"}
            inputName={mode === "register" ? "fitness-register-email" : "fitness-email"}
            editable={!awaitingCode}
          />
          {mode === "reset" && awaitingCode ? (
            <Text className="mb-4 text-[13px] text-white/45">Если почта есть — код в письме, 15 минут</Text>
          ) : null}
          {mode === "reset" && awaitingCode ? (
            <Field
              glass
              label="Код с почты"
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              inputName="fitness-reset-code"
              maxLength={6}
            />
          ) : null}
          {mode !== "reset" || awaitingCode ? (
            <Field
              glass
              label="Пароль"
              value={password}
              onChangeText={setPassword}
              placeholder="От 6 символов"
              secureTextEntry
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              textContentType={mode === "login" ? "password" : "newPassword"}
              importantForAutofill={mode === "register" ? "no" : "yes"}
              inputName={
                mode === "register"
                  ? "fitness-register-password"
                  : mode === "reset"
                    ? "fitness-reset-password"
                    : "fitness-password"
              }
            />
          ) : null}
          {mode === "login" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setError("");
                setPassword("");
                setCode("");
                setAwaitingCode(false);
                setMode("reset");
              }}
              className="mb-4 self-start rounded-full px-1 py-3"
              hitSlop={8}
            >
              <Text className="text-[15px] font-medium" style={{ color: getPalette().accent }}>
                Забыл пароль
              </Text>
            </Pressable>
          ) : null}
          {error ? <Text className="mb-4 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton label={primary} onPress={submit} busy={busy} />
          <View className="mt-4">
            {mode === "reset" ? (
              <GhostButton glass label="Назад ко входу" onPress={goLogin} />
            ) : (
              <GhostButton
                glass
                label={mode === "register" ? "Уже есть аккаунт — войти" : "Нет аккаунта — создать"}
                onPress={toggle}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
