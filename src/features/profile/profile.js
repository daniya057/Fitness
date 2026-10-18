import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { Field, PrimaryButton, SectionLabel, TextLink } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { AvatarBadge } from "../avatar/AvatarBadge";
import { PublicProfile } from "../friends/PublicProfile";
import { utcDay } from "../calories/foods";
import { foodSkipLabel } from "../calories/foodSkip";
import { useAuth } from "../auth/AuthContext";
import { BirthdayCalendar } from "../onboarding/BirthdayCalendar";
import { BmiMark } from "../onboarding/BmiMark";
import { GOALS, EXPERIENCE_LABELS, SEX_LABELS, SEX_OPTIONS } from "../onboarding/catalog";
import { coerceTrainDayIds, DIET_LABELS, FOCUS_LABELS, PLACE_LABELS, TIME_LABELS, trainDaysLabel } from "../onboarding/quiz";
import { DaysPicker } from "../onboarding/DaysPicker";
import { ExperiencePicker } from "../onboarding/ExperiencePicker";
import { ValueSlider } from "../onboarding/ValueSlider";

function FactCell({ label, value }) {
  return (
    <View className="min-h-[60px] flex-1 justify-center rounded-[16px] px-3 py-3" style={glassStyle({ borderRadius: 16 })}>
      <Text className="text-[11px] text-white/45">{label}</Text>
      <Text className="mt-1 text-[16px] font-semibold text-white" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function weightProgress(weight) {
  const start = Number(weight?.start);
  const current = Number(weight?.current);
  const goal = Number(weight?.goal);
  if (![start, current, goal].every(Number.isFinite)) {
    return 0;
  }
  const total = goal - start;
  if (total === 0) {
    return current === goal ? 1 : 0;
  }
  return Math.max(0, Math.min(1, (current - start) / total));
}

function WeightCard({ weight }) {
  if (!weight) {
    return <FactCell label="Вес" value="—" />;
  }
  const current = Number(weight.current);
  const goal = Number(weight.goal);
  const fill = weightProgress(weight);
  const pct = Math.round(fill * 100);

  return (
    <View className="rounded-[16px] px-4 py-3" style={glassStyle({ borderRadius: 16 })}>
      <Text className="text-[11px] text-white/45">Вес</Text>
      <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
        <View className="flex-1 rounded-[14px] px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <Text className="text-[18px] font-semibold text-white">{current.toFixed(1)} кг</Text>
          <Text className="mt-0.5 text-[11px] text-white/45">текущий</Text>
        </View>
        <Text className="text-[16px] text-white/35">→</Text>
        <View className="flex-1 rounded-[14px] px-3 py-2" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <Text className="text-[18px] font-semibold text-white">{goal.toFixed(1)} кг</Text>
          <Text className="mt-0.5 text-[11px] text-white/45">цель</Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center" style={{ gap: 8 }}>
        <View className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.14)" }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: getPalette().bar }}
          />
        </View>
        <Text className="text-[11px] text-white/45">{current === goal ? "на цели" : `${pct}%`}</Text>
      </View>
    </View>
  );
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
    trainDays: coerceTrainDayIds(user?.trainDays, user?.daysPerWeek || 3),
    experience: EXPERIENCE_LABELS[user?.experience] ? user.experience : "",
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
  const status = String(user?.status || "").trim();
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
    if (!form.trainDays.length) {
      setError("Выбери хотя бы один день");
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
        daysPerWeek: form.trainDays.length || form.daysPerWeek,
        trainDays: form.trainDays,
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
        <View className="mt-2 rounded-[24px] px-6 py-7" style={glassStyle({ borderRadius: 24 })}>
          <Text className="text-[12px] font-medium tracking-[1.2px]" style={{ color: getPalette().accent }}>
            Профиль
          </Text>
          <View className="mt-4 flex-row items-center">
            <AvatarBadge user={user} size="lg" />
            <View className="ml-4 flex-1">
              <Text className="text-[28px] font-semibold text-white">{name}</Text>
              {status ? <Text className="mt-1 text-[14px] text-white/60">{status}</Text> : null}
              <Text className="mt-2 text-[13px] text-white/45">{user?.email}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row items-center" style={{ gap: 8 }}>
            {editing ? (
              <TextLink label="Отмена" onPress={cancelEdit} />
            ) : (
              <TextLink label="Изменить" onPress={startEdit} />
            )}
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
            <BmiMark kg={form.weight} heightCm={form.heightCm} goalKg={form.goal} />
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
            <DaysPicker
              label="В какие дни удобно"
              values={form.trainDays}
              onChange={(value) => setForm((prev) => ({ ...prev, trainDays: value, daysPerWeek: value.length || 1 }))}
            />
            {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
            <PrimaryButton label="Сохранить" onPress={save} busy={busy} />
          </View>
        ) : (
          <>
            <View className="mt-8">
              <SectionLabel glass>Из опросника</SectionLabel>
              <View style={{ gap: 10 }}>
                <View className="flex-row" style={{ gap: 10 }}>
                  <FactCell label="Возраст" value={user?.age ? `${user.age}` : "—"} />
                  <FactCell label="Рост" value={user?.heightCm ? `${user.heightCm} см` : "—"} />
                  <FactCell label="Пол" value={SEX_LABELS[user?.sex] || "—"} />
                </View>
                <WeightCard weight={weight} />
                <BmiMark kg={weight?.current} heightCm={user?.heightCm} goalKg={weight?.goal} />
                <View className="flex-row" style={{ gap: 10 }}>
                  <FactCell
                    label="Дни"
                    value={trainDaysLabel(user?.trainDays, user?.daysPerWeek) || "—"}
                  />
                  <FactCell label="Как давно" value={EXPERIENCE_LABELS[user?.experience] || "—"} />
                </View>
                {user?.quizDone && user?.quiz ? (
                  <>
                    <View className="flex-row" style={{ gap: 10 }}>
                      <FactCell label="Фокус" value={FOCUS_LABELS[user.quiz.focus] || "—"} />
                      <FactCell label="Время" value={TIME_LABELS[user.quiz.timeBudget] || "—"} />
                    </View>
                    <FactCell label="Где" value={PLACE_LABELS[user.quiz.place] || "—"} />
                    <FactCell
                      label="Питание"
                      value={(user.quiz.diet || []).map((id) => DIET_LABELS[id]).filter(Boolean).join(" · ") || "—"}
                    />
                    <FactCell
                      label="Не ем"
                      value={foodSkipLabel(user.quiz.foodSkip) || "ем всё"}
                    />
                  </>
                ) : null}
              </View>
            </View>
            <View className="mt-8">
              <PublicProfile
                mine
                person={{
                  ...user,
                  activityToday: user?.lastActivityDate === utcDay(),
                }}
              />
            </View>
          </>
        )}
        <View className="mt-10 items-start">
          <TextLink label="Выйти" danger onPress={logout} />
        </View>
      </ScrollView>
    </View>
  );
}
