import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { GhostButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { AmbientWash, glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { useAuth } from "../auth/AuthContext";
import { AdviceView } from "../checkins/AdviceView";
import { draftUser } from "../checkins/recommend";
import { BirthdayCalendar } from "./BirthdayCalendar";
import { ChoiceGrid } from "./ChoiceGrid";
import { GOALS, SEX_OPTIONS, ageFromBirthDate } from "./catalog";
import { BmiMark } from "./BmiMark";
import { ExperiencePicker } from "./ExperiencePicker";
import {
  DEFAULT_TRAIN_DAYS,
  DIET_OPTIONS,
  FOCUS_OPTIONS,
  MEAL_OPTIONS,
  PAIN_OPTIONS,
  PLACE_OPTIONS,
  TIME_OPTIONS,
  coerceTrainDayIds,
  emptyQuiz,
  inferFocus,
  quizPayload,
} from "./quiz";
import { FoodSkipEditor } from "../calories/FoodSkipEditor";
import { DaysPicker } from "./DaysPicker";
import { ValueSlider } from "./ValueSlider";

const FULL_STEPS = ["body", "goals", "place", "time", "days", "pain", "diet", "foodSkip", "meals", "focus", "advice"];
const EXTRA_STEPS = ["place", "time", "days", "pain", "diet", "foodSkip", "meals", "focus", "advice"];

export default function OnboardingScreen({ extra = false }) {
  const insets = useSafeAreaInsets();
  const { user, completeOnboarding, patch } = useAuth();
  const steps = extra ? EXTRA_STEPS : FULL_STEPS;
  const [index, setIndex] = useState(0);
  const [weight, setWeight] = useState(Number(user?.weight?.current) || 72);
  const [goal, setGoal] = useState(Number(user?.weight?.goal) || 68);
  const [heightCm, setHeightCm] = useState(Number(user?.heightCm) || 170);
  const [sex, setSex] = useState(user?.sex === "male" || user?.sex === "female" ? user.sex : "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "2000-01-15");
  const [goals, setGoals] = useState(user?.goals?.length ? [...user.goals] : ["walk"]);
  const [trainDays, setTrainDays] = useState(() => coerceTrainDayIds(user?.trainDays, user?.daysPerWeek || 3));
  const [experience, setExperience] = useState(user?.experience || "");
  const [quiz, setQuiz] = useState(() => emptyQuiz());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const step = steps[index];
  const total = steps.length;
  const draft = useMemo(
    () =>
      draftUser(user, {
        weight,
        goal,
        heightCm,
        sex,
        birthDate,
        age: ageFromBirthDate(birthDate),
        goals,
        daysPerWeek: trainDays.length || 3,
        trainDays,
        experience,
        quiz: {
          ...quiz,
          focus: quiz.focus || inferFocus(goals, { current: weight, goal }),
        },
      }),
    [user, weight, goal, heightCm, sex, birthDate, goals, trainDays, experience, quiz]
  );

  const setQuizField = (key, value) => {
    setQuiz((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGoal = async (id) => {
    await lightTap();
    setGoals((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const go = async (nextIndex) => {
    await lightTap();
    setError("");
    setIndex(Math.max(0, Math.min(total - 1, nextIndex)));
  };

  const next = async () => {
    setError("");
    if (step === "body") {
      if (sex !== "male" && sex !== "female") {
        setError("Укажи пол — от этого считается ориентир калорий");
        return;
      }
    }
    if (step === "goals") {
      if (goals.length < 1) {
        setError("Выбери хотя бы одно направление");
        return;
      }
      if (!experience) {
        setError("Выбери, как давно занимаешься");
        return;
      }
    }
    if (step === "place" && !quiz.place) {
      setError("Где обычно занимаешься");
      return;
    }
    if (step === "time" && !quiz.timeBudget) {
      setError("Сколько времени обычно есть");
      return;
    }
    if (step === "days" && trainDays.length < 1) {
      setError("Выбери хотя бы один день");
      return;
    }
    if (step === "foodSkip") {
      setQuizField("foodSkipSet", true);
    }
    if (step === "meals" && !quiz.meals) {
      setError("Сколько раз обычно ешь");
      return;
    }
    if (step === "focus" && !quiz.focus) {
      setError("Что важнее сейчас");
      return;
    }
    await go(index + 1);
  };

  const skip = async () => {
    if (step === "place") {
      setQuizField("place", "anywhere");
    }
    if (step === "time") {
      setQuizField("timeBudget", "60");
    }
    if (step === "days") {
      setTrainDays(DEFAULT_TRAIN_DAYS);
    }
    if (step === "pain") {
      setQuizField("restrictions", []);
    }
    if (step === "diet") {
      setQuizField("diet", ["all"]);
    }
    if (step === "foodSkip") {
      setQuiz((prev) => ({ ...prev, foodSkip: [], foodSkipSet: true }));
    }
    if (step === "meals") {
      setQuizField("meals", "3");
    }
    if (step === "focus") {
      setQuizField("focus", inferFocus(goals, { current: weight, goal }));
    }
    await go(index + 1);
  };

  const finish = async () => {
    setError("");
    setBusy(true);
    const payload = quizPayload({
      ...quiz,
      focus: quiz.focus || inferFocus(goals, { current: weight, goal }),
      foodSkipSet: true,
    });
    try {
      if (extra) {
        await patch({ saveQuiz: true, quiz: payload, trainDays });
      } else {
        await completeOnboarding({
          weight,
          goal,
          heightCm,
          sex,
          birthDate,
          goals,
          daysPerWeek: trainDays.length || 3,
          trainDays,
          experience,
          quiz: payload,
        });
      }
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    body: { title: "О тебе", subtitle: "Вес, рост и ИМТ" },
    goals: { title: "Что делаем", subtitle: "Можно несколько. От этого зависят задания и план." },
    place: { title: "Где занимаешься?", subtitle: "Один ответ" },
    time: { title: "Сколько времени обычно есть?", subtitle: "Сегодня можно будет сказать иначе" },
    days: { title: "В какие дни удобно?", subtitle: "План встанет на эти дни" },
    pain: { title: "Что беспокоит?", subtitle: "Можно несколько или пропустить" },
    diet: { title: "Как питаешься?", subtitle: "Чтобы подсказки не предлагали лишнего" },
    foodSkip: { title: "Что нельзя или не любишь?", subtitle: "Добавь продукты по одному — рацион их не предложит" },
    meals: { title: "Сколько раз в день ешь?", subtitle: "Шаблон дня подстроится" },
    focus: { title: "Что важнее сейчас?", subtitle: "От этого собирается план недели" },
    advice: { title: "Твой план", subtitle: "Программа, калории и ориентиры по рациону" },
  };

  const canSkip = ["place", "time", "days", "pain", "diet", "foodSkip", "meals", "focus"].includes(step);

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: getPalette().bg }}>
      <StatusBar style="light" />
      <AmbientWash />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 36 }}>
        <SectionLabel glass>
          Шаг {index + 1} из {total}
        </SectionLabel>
        <View className="mb-2 h-[6px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.round(((index + 1) / total) * 100)}%`, backgroundColor: getPalette().bar }}
          />
        </View>

        <View className="mt-5">
          <ScreenHeader glass title={titles[step].title} subtitle={titles[step].subtitle} />

          {step === "body" ? (
            <>
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
            </>
          ) : null}

          {step === "goals" ? (
            <>
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
            </>
          ) : null}

          {step === "place" ? (
            <ChoiceGrid options={PLACE_OPTIONS} value={quiz.place} onChange={(id) => setQuizField("place", id)} />
          ) : null}
          {step === "time" ? (
            <ChoiceGrid options={TIME_OPTIONS} value={quiz.timeBudget} onChange={(id) => setQuizField("timeBudget", id)} />
          ) : null}
          {step === "days" ? <DaysPicker values={trainDays} onChange={setTrainDays} /> : null}
          {step === "pain" ? (
            <ChoiceGrid
              options={PAIN_OPTIONS}
              values={quiz.restrictions}
              onChange={(ids) => setQuizField("restrictions", ids)}
              multi
              columns={2}
            />
          ) : null}
          {step === "diet" ? (
            <ChoiceGrid options={DIET_OPTIONS} values={quiz.diet} onChange={(ids) => setQuizField("diet", ids)} multi columns={2} />
          ) : null}
          {step === "foodSkip" ? (
            <FoodSkipEditor values={quiz.foodSkip} onChange={(list) => setQuizField("foodSkip", list)} />
          ) : null}
          {step === "meals" ? (
            <ChoiceGrid options={MEAL_OPTIONS} value={quiz.meals} onChange={(id) => setQuizField("meals", id)} />
          ) : null}
          {step === "focus" ? (
            <ChoiceGrid options={FOCUS_OPTIONS} value={quiz.focus} onChange={(id) => setQuizField("focus", id)} />
          ) : null}
          {step === "advice" ? <AdviceView user={draft} /> : null}

          {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}

          <View className="mt-6">
            {step === "advice" ? (
              <PrimaryButton label="Начать" onPress={finish} busy={busy} />
            ) : (
              <PrimaryButton label="Дальше" onPress={next} />
            )}
          </View>
          {canSkip ? (
            <View className="mt-3">
              <GhostButton glass label="Пропустить" onPress={skip} />
            </View>
          ) : null}
          {index > 0 ? (
            <View className="mt-3">
              <GhostButton glass label="Назад" onPress={() => go(index - 1)} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
