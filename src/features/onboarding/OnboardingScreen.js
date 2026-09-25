import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { GhostButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { GOALS, SEX_OPTIONS } from "./catalog";
import { ValueSlider } from "./ValueSlider";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [weight, setWeight] = useState(72);
  const [goal, setGoal] = useState(68);
  const [heightCm, setHeightCm] = useState(170);
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState("2000-01-15");
  const [goals, setGoals] = useState(["walk"]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleGoal = async (id) => {
    await lightTap();
    setGoals((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const next = async () => {
    setError("");
    if (sex !== "male" && sex !== "female") {
      setError("Укажи пол — от этого считается ориентир калорий");
      return;
    }
    await lightTap();
    setStep(2);
  };

  const back = () => {
    setError("");
    setStep(1);
  };

  const finish = async () => {
    setError("");
    if (goals.length < 1) {
      setError("Выбери хотя бы одно направление");
      return;
    }
    setBusy(true);
    try {
      await completeOnboarding({
        weight,
        goal,
        heightCm,
        sex,
        birthDate,
        goals,
        daysPerWeek,
      });
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <SectionLabel>Шаг {step} из 2</SectionLabel>
        <View className="mb-2 h-[6px] overflow-hidden rounded-full bg-card">
          <View className="h-full rounded-full bg-accent" style={{ width: step === 1 ? "50%" : "100%" }} />
        </View>

        {step === 1 ? (
          <View className="mt-5">
            <ScreenHeader
              title="О тебе"
              subtitle="Слайдерами вес и рост, день рождения — в календаре. Без давления."
            />
            <ValueSlider label="Текущий вес" value={weight} min={40} max={160} step={0.5} unit="кг" onChange={setWeight} />
            <ValueSlider label="Желаемый вес" value={goal} min={40} max={160} step={0.5} unit="кг" onChange={setGoal} />
            <ValueSlider label="Рост" value={heightCm} min={140} max={210} step={1} unit="см" onChange={setHeightCm} />
            <SectionLabel>Пол</SectionLabel>
            <View className="mb-6 flex-row gap-3">
              {SEX_OPTIONS.map((item) => {
                const on = sex === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={async () => {
                      await lightTap();
                      setSex(item.id);
                      setError("");
                    }}
                    className={`h-14 flex-1 items-center justify-center rounded-full ${on ? "bg-mint" : "bg-card"}`}
                  >
                    <Text className="text-[18px] font-semibold text-ink">{item.title}</Text>
                  </Pressable>
                );
              })}
            </View>
            <SectionLabel>Дата рождения</SectionLabel>
            <BirthdayCalendar value={birthDate} onChange={setBirthDate} />
            {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
            <View className="mt-8">
              <PrimaryButton label="Дальше" onPress={next} />
            </View>
          </View>
        ) : (
          <View className="mt-5">
            <ScreenHeader
              title="Что делаем"
              subtitle="Можно несколько. От этого зависят задания на главной и в тренировке."
            />
            <View className="flex-row flex-wrap justify-between">
              {GOALS.map((item) => {
                const on = goals.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleGoal(item.id)}
                    className={`mb-3 w-[48%] rounded-[22px] px-4 py-4 ${on ? "bg-mint" : "bg-card"}`}
                  >
                    <Text className="text-[16px] font-semibold text-ink">{item.title}</Text>
                    <Text className="mt-1 text-[12px] leading-4 text-mute">{item.hint}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="mt-2">
              <ValueSlider
                label="Раз в неделю"
                value={daysPerWeek}
                min={1}
                max={7}
                step={1}
                unit={daysPerWeek === 1 ? "день" : "дней"}
                onChange={setDaysPerWeek}
              />
            </View>
            {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
            <PrimaryButton label="Готово" onPress={finish} busy={busy} />
            <View className="mt-3">
              <GhostButton label="Назад" onPress={back} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
