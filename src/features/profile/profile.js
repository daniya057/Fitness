import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { Field, PillButton, PrimaryButton, SectionLabel, StatRow } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";
import { BirthdayCalendar } from "../onboarding/BirthdayCalendar";
import { GOALS, GOAL_LABELS, SEX_LABELS, SEX_OPTIONS } from "../onboarding/catalog";
import { ValueSlider } from "../onboarding/ValueSlider";

const HISTORY = [
  { id: "1", title: "Микро-разминка", time: "08:14", done: true },
  { id: "2", title: "Минута фокуса", time: "12:02", done: true },
  { id: "3", title: "Тихая прогулка", time: "18:40", done: false },
];

function weekLabel(count) {
  if (count === 1) {
    return "раз";
  }
  if (count < 5) {
    return "раза";
  }
  return "раз";
}

function seedForm(user) {
  return {
    name: user?.name || "",
    status: user?.status || "Двигаюсь мягко",
    weight: Number(user?.weight?.current) || 72,
    goal: Number(user?.weight?.goal) || 68,
    heightCm: Number(user?.heightCm) || 170,
    sex: user?.sex === "male" || user?.sex === "female" ? user.sex : "",
    birthDate: user?.birthDate || "2000-01-15",
    goals: user?.goals?.length ? [...user.goals] : ["walk"],
    daysPerWeek: Number(user?.daysPerWeek) || 3,
  };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, patch } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => seedForm(user));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const name = user?.name || "Гость";
  const status = user?.status || "Двигаюсь мягко";
  const goalNames = (user?.goals || []).map((id) => GOAL_LABELS[id]).filter(Boolean);
  const weight = user?.weight;

  const startEdit = () => {
    setError("");
    setForm(seedForm(user));
    setEditing(true);
  };

  const cancelEdit = () => {
    setError("");
    setEditing(false);
  };

  const toggleGoal = async (id) => {
    await lightTap();
    setForm((prev) => {
      const on = prev.goals.includes(id);
      const next = on ? prev.goals.filter((item) => item !== id) : [...prev.goals, id];
      return { ...prev, goals: next };
    });
  };

  const save = async () => {
    setError("");
    if (form.name.trim().length < 2) {
      setError("Имя от 2 символов");
      return;
    }
    if (!form.status.trim()) {
      setError("Напиши короткий статус");
      return;
    }
    if (form.goals.length < 1) {
      setError("Выбери хотя бы одно направление");
      return;
    }
    if (form.sex !== "male" && form.sex !== "female") {
      setError("Укажи пол");
      return;
    }
    setBusy(true);
    try {
      await patch({
        updateProfile: true,
        onboardingDone: true,
        name: form.name,
        status: form.status,
        weight: form.weight,
        goal: form.goal,
        heightCm: form.heightCm,
        sex: form.sex,
        birthDate: form.birthDate,
        goals: form.goals,
        daysPerWeek: form.daysPerWeek,
      });
      setEditing(false);
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-2 rounded-[28px] bg-mint px-6 py-7">
          <Text className="text-[12px] font-medium tracking-[1.2px] text-accent">Профиль</Text>
          <Text className="mt-2 text-[28px] font-semibold text-ink">{name}</Text>
          <Text className="mt-1 text-[14px] text-mute">{status}</Text>
          <Text className="mt-2 text-[13px] text-mute">{user?.email}</Text>
          <View className="mt-6 flex-row flex-wrap gap-2">
            {editing ? (
              <PillButton label="Отмена" onPress={cancelEdit} tone="canvas" />
            ) : (
              <PillButton label="Изменить" onPress={startEdit} tone="canvas" />
            )}
            <PillButton label="Выйти" onPress={logout} tone="canvas" />
          </View>
        </View>

        {editing ? (
          <View className="mt-8">
            <SectionLabel>Редактирование</SectionLabel>
            <Field label="Имя" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
            <Field
              label="Статус"
              value={form.status}
              onChangeText={(value) => setForm((prev) => ({ ...prev, status: value }))}
            />
            <ValueSlider
              label="Текущий вес"
              value={form.weight}
              min={40}
              max={160}
              step={0.5}
              unit="кг"
              onChange={(value) => setForm((prev) => ({ ...prev, weight: value }))}
            />
            <ValueSlider
              label="Желаемый вес"
              value={form.goal}
              min={40}
              max={160}
              step={0.5}
              unit="кг"
              onChange={(value) => setForm((prev) => ({ ...prev, goal: value }))}
            />
            <ValueSlider
              label="Рост"
              value={form.heightCm}
              min={140}
              max={210}
              step={1}
              unit="см"
              onChange={(value) => setForm((prev) => ({ ...prev, heightCm: value }))}
            />
            <SectionLabel>Пол</SectionLabel>
            <View className="mb-6 flex-row gap-3">
              {SEX_OPTIONS.map((item) => {
                const on = form.sex === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={async () => {
                      await lightTap();
                      setForm((prev) => ({ ...prev, sex: item.id }));
                    }}
                    className={`h-14 flex-1 items-center justify-center rounded-full ${on ? "bg-mint" : "bg-card"}`}
                  >
                    <Text className="text-[18px] font-semibold text-ink">{item.title}</Text>
                  </Pressable>
                );
              })}
            </View>
            <SectionLabel>Дата рождения</SectionLabel>
            <BirthdayCalendar value={form.birthDate} onChange={(value) => setForm((prev) => ({ ...prev, birthDate: value }))} />
            <View className="mt-6">
              <SectionLabel>Цели</SectionLabel>
            </View>
            <View className="flex-row flex-wrap justify-between">
              {GOALS.map((item) => {
                const on = form.goals.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleGoal(item.id)}
                    className={`mb-3 w-[48%] rounded-[22px] px-4 py-4 ${on ? "bg-mint" : "bg-card"}`}
                  >
                    <Text className="text-[16px] font-semibold text-ink">{item.title}</Text>
                    <Text className="mt-1 text-[12px] text-mute">{item.hint}</Text>
                  </Pressable>
                );
              })}
            </View>
            <ValueSlider
              label="Раз в неделю"
              value={form.daysPerWeek}
              min={1}
              max={7}
              step={1}
              unit={form.daysPerWeek === 1 ? "день" : "дней"}
              onChange={(value) => setForm((prev) => ({ ...prev, daysPerWeek: value }))}
            />
            {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
            <PrimaryButton label="Сохранить" onPress={save} busy={busy} />
          </View>
        ) : (
          <>
            <View className="mt-8">
              <SectionLabel>Из опросника</SectionLabel>
              <View className="rounded-[28px] bg-card px-5 py-1">
                <StatRow label="Возраст" value={user?.age ? `${user.age}` : "—"} />
                <StatRow label="Рост" value={user?.heightCm ? `${user.heightCm} см` : "—"} />
                <StatRow label="Пол" value={SEX_LABELS[user?.sex] || "—"} />
                <StatRow
                  label="Вес"
                  value={weight ? `${Number(weight.current).toFixed(1)} → ${Number(weight.goal).toFixed(1)} кг` : "—"}
                />
                <StatRow label="Цели" value={goalNames.length ? goalNames.join(", ") : "—"} />
                <StatRow last label="В неделю" value={user?.daysPerWeek ? `${user.daysPerWeek} ${weekLabel(user.daysPerWeek)}` : "—"} />
              </View>
            </View>

            <View className="mt-8">
              <SectionLabel>История сегодня</SectionLabel>
              {HISTORY.map((item) => (
                <View key={item.id} className="mb-2 flex-row items-center rounded-[22px] bg-card px-4 py-4">
                  <View
                    className={`mr-3 h-7 w-7 items-center justify-center rounded-full ${item.done ? "bg-accent" : "bg-canvas"}`}
                  >
                    {item.done ? <Check size={14} color="#FFFFFF" strokeWidth={2.2} /> : null}
                  </View>
                  <Text className="flex-1 text-[15px] font-medium text-ink">{item.title}</Text>
                  <Text className="text-[12px] font-medium text-mute">{item.time}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
