import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Field, GhostButton, PrimaryButton } from "../../ui/kit";
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
    setMode(mode === "register" ? "login" : "register");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-8 rounded-[28px] bg-mint px-6 py-8">
          <Text className="text-[12px] font-medium tracking-[1.2px] text-accent">FITNESS</Text>
          <Text className="mt-2 text-[28px] font-semibold text-ink">
            {mode === "register" ? "Создай аккаунт" : "С возвращением"}
          </Text>
          <Text className="mt-2 text-[14px] leading-5 text-mute">
            Короткий вход, без стен текста. Дальше подстроим тренировки под тебя.
          </Text>
        </View>

        <View className="mt-8">
          {mode === "register" ? (
            <Field label="Имя" value={name} onChangeText={setName} placeholder="Как к тебе обращаться" />
          ) : null}
          <Field
            label="Почта"
            value={email}
            onChangeText={setEmail}
            placeholder="you@mail.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Field
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            placeholder="От 6 символов"
            secureTextEntry
          />
          {error ? <Text className="mb-4 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton
            label={mode === "register" ? "Зарегистрироваться" : "Войти"}
            onPress={submit}
            busy={busy}
          />
          <View className="mt-4">
            <GhostButton
              label={mode === "register" ? "Уже есть аккаунт — войти" : "Нет аккаунта — создать"}
              onPress={toggle}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
