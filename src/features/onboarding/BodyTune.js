import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PrimaryButton, SectionLabel } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { lightTap } from "../../lib/haptics";
import { useAuth } from "../auth/AuthContext";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { BmiMark } from "./BmiMark";
import { choiceSurface, choiceTitleStyle } from "./ChoiceGrid";
import { SEX_OPTIONS } from "./catalog";
import { DEFAULT_TRAIN_DAYS, coerceTrainDayIds } from "./quiz";
import { ValueSlider } from "./ValueSlider";

export function BodyTuneCard() {
  const { user, completeOnboarding } = useAuth();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(Number(user?.weight?.current) || 70);
  const [goal, setGoal] = useState(Number(user?.weight?.goal) || 70);
  const [heightCm, setHeightCm] = useState(Number(user?.heightCm) || 170);
  const [sex, setSex] = useState(user?.sex === "male" || user?.sex === "female" ? user.sex : "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "2000-01-15");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user?.onboardingDone && (user?.sex === "male" || user?.sex === "female") && Number(user?.heightCm) >= 140) {
    return null;
  }

  const save = async () => {
    if (sex !== "male" && sex !== "female") {
      setError("Укажи пол — от этого считается ориентир калорий");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await completeOnboarding({
        weight,
        goal,
        heightCm,
        sex,
        birthDate,
        goals: user?.goals?.length ? user.goals : ["walk"],
        daysPerWeek: user?.daysPerWeek || 3,
        trainDays: coerceTrainDayIds(user?.trainDays, user?.daysPerWeek || 3).length
          ? coerceTrainDayIds(user?.trainDays, user?.daysPerWeek || 3)
          : DEFAULT_TRAIN_DAYS,
        experience: user?.experience || "none",
        quiz: user?.quiz || undefined,
      });
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mb-5 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
      <Text className="text-[18px] font-semibold text-white">Ориентир калорий</Text>
      <Text className="mt-1 text-[13px] leading-5 text-white/55">
        Пол, рост и дата рождения — чтобы норма была про тебя, не средняя две тысячи.
      </Text>
      {open ? (
        <View className="mt-4">
          <ValueSlider glass label="Текущий вес" value={weight} min={40} max={160} step={0.5} unit="кг" onChange={setWeight} />
          <ValueSlider glass label="Желаемый вес" value={goal} min={40} max={160} step={0.5} unit="кг" onChange={setGoal} />
          <ValueSlider glass label="Рост" value={heightCm} min={140} max={210} step={1} unit="см" onChange={setHeightCm} />
          <BmiMark kg={weight} heightCm={heightCm} goalKg={goal} />
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
                  style={choiceSurface(on, { radius: 999 })}
                >
                  <Text className="text-[18px] font-semibold" style={choiceTitleStyle(on)}>
                    {item.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <SectionLabel glass>Дата рождения</SectionLabel>
          <BirthdayCalendar glass value={birthDate} onChange={setBirthDate} />
          {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton label="Сохранить" onPress={save} busy={busy} />
        </View>
      ) : (
        <View className="mt-4">
          <PrimaryButton label="Указать" onPress={() => setOpen(true)} />
        </View>
      )}
    </View>
  );
}
