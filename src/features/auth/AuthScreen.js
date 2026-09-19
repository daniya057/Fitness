import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { useAuth } from "./AuthContext";

function Field({ label, ...props }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[12px] tracking-[1px] text-mute">{label}</Text>
      <TextInput
        className="rounded-2xl bg-card px-4 py-3.5 text-[16px] text-ink"
        placeholderTextColor="#9E9E9E"
        {...props}
      />
    </View>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { register, login } = useAuth();
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    await lightTap();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register({
          name,
          email,
          password,
          weight: weight ? Number(weight.replace(",", ".")) : undefined,
        });
      } else {
        await login({ email, password });
      }
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async () => {
    await lightTap();
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
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-10 rounded-[28px] bg-mint px-6 py-8">
          <Text className="text-[28px] font-semibold text-ink">
            {mode === "register" ? "Создай аккаунт" : "С возвращением"}
          </Text>
          <Text className="mt-2 text-[14px] leading-5 text-mute">
            Без профиля на сайт не пускаем. Данные лежат у нас в папке data/users — по файлу на человека.
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
          {mode === "register" ? (
            <Field
              label="Текущий вес, кг (необязательно)"
              value={weight}
              onChangeText={setWeight}
              placeholder="78.5"
              keyboardType="decimal-pad"
            />
          ) : null}

          {error ? <Text className="mb-4 text-[14px] text-accent">{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={busy}
            className="items-center rounded-full bg-accent py-4"
          >
            <Text className="text-[14px] tracking-[2px] text-white">
              {busy ? "Секунду" : mode === "register" ? "Зарегистрироваться" : "Войти"}
            </Text>
          </Pressable>

          <Pressable onPress={toggle} className="mt-5 items-center py-2">
            <Text className="text-[14px] text-mute">
              {mode === "register" ? "Уже есть аккаунт — войти" : "Нет аккаунта — создать"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
