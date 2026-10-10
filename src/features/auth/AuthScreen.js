import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Field, GhostButton, PrimaryButton } from "../../ui/kit";
import { AmbientWash, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "./AuthContext";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { register, login } = useAuth();
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    setError("");
    setPassword("");
    if (mode === "login") {
      setEmail("");
    }
    setMode(mode === "register" ? "login" : "register");
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
          <Text className="text-[12px] font-medium tracking-[1.2px] text-[#9BFFC8]">FITNESS</Text>
          <Text className="mt-2 text-[28px] font-semibold text-white">
            {mode === "register" ? "Регистрация" : "Вход"}
          </Text>
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
          />
          <Field
            glass
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="От 6 символов"
            secureTextEntry
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            textContentType={mode === "register" ? "newPassword" : "password"}
            importantForAutofill={mode === "register" ? "no" : "yes"}
            inputName={mode === "register" ? "fitness-register-password" : "fitness-password"}
          />
          {error ? <Text className="mb-4 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton
            label={mode === "register" ? "Зарегистрироваться" : "Войти"}
            onPress={submit}
            busy={busy}
          />
          <View className="mt-4">
            <GhostButton
              glass
              label={mode === "register" ? "Уже есть аккаунт — войти" : "Нет аккаунта — создать"}
              onPress={toggle}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
