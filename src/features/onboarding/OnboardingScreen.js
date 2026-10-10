import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { GhostButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { AmbientWash, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "../auth/AuthContext";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { GOALS, SEX_OPTIONS } from "./catalog";
import { ExperiencePicker } from "./ExperiencePicker";
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
  const [experience, setExperience] = useState("");
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
    if (!experience) {
      setError("Выбери, как давно занимаешься");
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
        experience,
      });
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: getPalette().bg }}>
      <StatusBar style="light" />
      <AmbientWash />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <SectionLabel glass>Шаг {step} из 2</SectionLabel>
        <View className="mb-2 h-[6px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
          <View className="h-full rounded-full" style={{ width: step === 1 ? "50%" : "100%", backgroundColor: getPalette().bar }} />
        </View>

        {step === 1 ? (
          <View className="mt-5">
            <ScreenHeader
              glass
              title="О тебе"
              subtitle="Вес, рост и дата рождения"
            />
            <ValueSlider glass label="Текущий вес" value={weight} min={40} max={160} step={0.5} unit="кг" onChange={setWeight} />
            <ValueSlider glass label="Желаемый вес" value={goal} min={40} max={160} step={0.5} unit="кг" onChange={setGoal} />
            <ValueSlider glass label="Рост" value={heightCm} min={140} max={210} step={1} unit="см" onChange={setHeightCm} />
            <SectionLabel glass>Пол</SectionLabel>
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
            <BirthdayCalendar glass value={birthDate} onChange={setBirthDate} />
            {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
            <View className="mt-8">
              <PrimaryButton label="Дальше" onPress={next} />
            </View>
          </View>
        ) : (
          <View className="mt-5">
            <ScreenHeader
              glass
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
                    className="mb-3 w-[48%] rounded-[22px] px-4 py-4"
                    style={glassStyle({
                      borderRadius: 22,
                      backgroundColor: on ? "rgba(125,255,179,0.16)" : "rgba(255,255,255,0.08)",
                    })}
                  >
                    <Text className="text-[16px] font-semibold text-white">{item.title}</Text>
                    {item.hint ? <Text className="mt-1 text-[12px] leading-4 text-white/50">{item.hint}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
            <View className="mt-4">
              <ExperiencePicker
                glass
                value={experience}
                onChange={(id) => {
                  setExperience(id);
                  setError("");
                }}
              />
            </View>
            <View className="mt-2">
              <ValueSlider
                glass
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
              <GhostButton glass label="Назад" onPress={back} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
