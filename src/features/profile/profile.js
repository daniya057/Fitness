import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { Field, PillButton, PrimaryButton, SectionLabel, StatRow } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { AchievementPlaque } from "../achievements/plaque";
import { useAuth } from "../auth/AuthContext";
import { BirthdayCalendar } from "../onboarding/BirthdayCalendar";
import { GOALS, GOAL_LABELS, EXPERIENCE_LABELS, SEX_LABELS, SEX_OPTIONS } from "../onboarding/catalog";
import { ExperiencePicker } from "../onboarding/ExperiencePicker";
import { ValueSlider } from "../onboarding/ValueSlider";

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
    status: user?.status || "",
    weight: Number(user?.weight?.current) || 72,
    goal: Number(user?.weight?.goal) || 68,
    heightCm: Number(user?.heightCm) || 170,
    sex: user?.sex === "male" || user?.sex === "female" ? user.sex : "",
    birthDate: user?.birthDate || "2000-01-15",
    goals: user?.goals?.length ? [...user.goals] : ["walk"],
    daysPerWeek: Number(user?.daysPerWeek) || 3,
    experience: EXPERIENCE_LABELS[user?.experience] ? user.experience : "",
  };
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, patch } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => seedForm(user));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const name = user?.name || "Гость";
  const status = String(user?.status || "").trim();
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
    if (form.goals.length < 1) {
      setError("Выбери хотя бы одно направление");
      return;
    }
    if (form.sex !== "male" && form.sex !== "female") {
      setError("Укажи пол");
      return;
    }
    if (!form.experience) {
      setError("Выбери, как давно занимаешься");
      return;
    }
    setBusy(true);
    try {
      await patch({
        updateProfile: true,
        onboardingDone: true,
        name: form.name,
        status: form.status.trim(),
        weight: form.weight,
        goal: form.goal,
        heightCm: form.heightCm,
        sex: form.sex,
        birthDate: form.birthDate,
        goals: form.goals,
        daysPerWeek: form.daysPerWeek,
        experience: form.experience,
      });
      setEditing(false);
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-2 rounded-[28px] px-6 py-7" style={glassStyle({ borderRadius: 28 })}>
          <Text className="text-[12px] font-medium tracking-[1.2px]" style={{ color: getPalette().accent }}>
            Профиль
          </Text>
          <Text className="mt-2 text-[28px] font-semibold text-white">{name}</Text>
          {status ? <Text className="mt-1 text-[14px] text-white/60">{status}</Text> : null}
          <Text className="mt-2 text-[13px] text-white/45">{user?.email}</Text>
          <View className="mt-6 flex-row flex-wrap gap-2">
            {editing ? (
              <PillButton label="Отмена" onPress={cancelEdit} tone="fill" />
            ) : (
              <PillButton label="Изменить" onPress={startEdit} tone="fill" />
            )}
            <PillButton label="Выйти" onPress={logout} tone="fill" />
          </View>
        </View>

        {editing ? (
          <View className="mt-8">
            <SectionLabel glass>Редактирование</SectionLabel>
            <Field glass label="Имя" value={form.name} onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} />
            <Field
              glass
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
              glass
              onChange={(value) => setForm((prev) => ({ ...prev, weight: value }))}
            />
            <ValueSlider
              label="Желаемый вес"
              value={form.goal}
              min={40}
              max={160}
              step={0.5}
              unit="кг"
              glass
              onChange={(value) => setForm((prev) => ({ ...prev, goal: value }))}
            />
            <ValueSlider
              label="Рост"
              value={form.heightCm}
              min={140}
              max={210}
              step={1}
              unit="см"
              glass
              onChange={(value) => setForm((prev) => ({ ...prev, heightCm: value }))}
            />
            <SectionLabel glass>Пол</SectionLabel>
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
                    className="h-14 flex-1 items-center justify-center rounded-full"
                    style={glassStyle({
                      borderRadius: 999,
                      backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.08)",
                    })}
                  >
                    <Text className="text-[18px] font-semibold text-white">{item.title}</Text>
                  </Pressable>
                );
              })}
            </View>
            <SectionLabel glass>Дата рождения</SectionLabel>
            <BirthdayCalendar glass value={form.birthDate} onChange={(value) => setForm((prev) => ({ ...prev, birthDate: value }))} />
            <View className="mt-6">
              <SectionLabel glass>Цели</SectionLabel>
            </View>
            <View className="flex-row flex-wrap justify-between">
              {GOALS.map((item) => {
                const on = form.goals.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleGoal(item.id)}
                    className="mb-3 w-[48%] rounded-[22px] px-4 py-4"
                    style={glassStyle({
                      borderRadius: 22,
                      backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.08)",
                    })}
                  >
                    <Text className="text-[16px] font-semibold text-white">{item.title}</Text>
                    {item.hint ? <Text className="mt-1 text-[12px] text-white/50">{item.hint}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            <View className="mt-2">
              <ExperiencePicker
                glass
                value={form.experience}
                onChange={(id) => setForm((prev) => ({ ...prev, experience: id }))}
              />
            </View>
            <ValueSlider
              label="Раз в неделю"
              value={form.daysPerWeek}
              min={1}
              max={7}
              step={1}
              unit={form.daysPerWeek === 1 ? "день" : "дней"}
              glass
              onChange={(value) => setForm((prev) => ({ ...prev, daysPerWeek: value }))}
            />
            {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
            <PrimaryButton label="Сохранить" onPress={save} busy={busy} />
          </View>
        ) : (
          <>
            <AchievementPlaque
              tone="glass"
              user={user}
              onPress={async () => {
                await lightTap();
                router.replace("/rewards");
              }}
            />

            <View className="mt-8">
              <SectionLabel glass>Из опросника</SectionLabel>
              <View className="rounded-[28px] px-5 py-1" style={glassStyle({ borderRadius: 28 })}>
                <StatRow glass label="Возраст" value={user?.age ? `${user.age}` : "—"} />
                <StatRow glass label="Рост" value={user?.heightCm ? `${user.heightCm} см` : "—"} />
                <StatRow glass label="Пол" value={SEX_LABELS[user?.sex] || "—"} />
                <StatRow
                  glass
                  label="Вес"
                  value={weight ? `${Number(weight.current).toFixed(1)} → ${Number(weight.goal).toFixed(1)} кг` : "—"}
                />
                <StatRow glass label="Цели" value={goalNames.length ? goalNames.join(", ") : "—"} />
                <StatRow glass label="В неделю" value={user?.daysPerWeek ? `${user.daysPerWeek} ${weekLabel(user.daysPerWeek)}` : "—"} />
                <StatRow glass last label="Как давно" value={EXPERIENCE_LABELS[user?.experience] || "—"} />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
