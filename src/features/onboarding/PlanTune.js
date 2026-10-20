import { useState } from "react";
import { Text, View } from "react-native";
import { GhostButton, PrimaryButton } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { useAuth } from "../auth/AuthContext";
import { ChoiceGrid } from "./ChoiceGrid";
import { DaysPicker } from "./DaysPicker";
import {
  DEFAULT_TRAIN_DAYS,
  PLACE_OPTIONS,
  QUIZ_DEFAULTS,
  TIME_OPTIONS,
  coerceTrainDayIds,
  quizPayload,
} from "./quiz";

export function PlanTuneCard() {
  const { user, patch } = useAuth();
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState(user?.quiz?.place || QUIZ_DEFAULTS.place);
  const [timeBudget, setTimeBudget] = useState(user?.quiz?.timeBudget || QUIZ_DEFAULTS.timeBudget);
  const [trainDays, setTrainDays] = useState(() => coerceTrainDayIds(user?.trainDays, user?.daysPerWeek || 3));
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  if (user?.quizDone) {
    return null;
  }

  const save = async (quiz, days) => {
    setError("");
    setBusy("save");
    try {
      await patch({
        saveQuiz: true,
        quiz: quizPayload({ ...QUIZ_DEFAULTS, ...user?.quiz, ...quiz }),
        trainDays: days,
      });
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy("");
    }
  };

  const skip = () => save({ place: "home", timeBudget: "60" }, DEFAULT_TRAIN_DAYS);

  return (
    <View className="mb-5 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
      <Text className="text-[11px] font-medium tracking-[1px] text-white/55">ПЛАН</Text>
      <Text className="mt-1 text-[18px] font-semibold text-white">Подстроим план</Text>
      <Text className="mt-1 text-[13px] leading-5 text-white/55">
        Можно позже. Пропуск — дома, час, пн · ср · пт. Разминку можно начать сразу.
      </Text>
      {open ? (
        <View className="mt-4">
          <ChoiceGrid options={PLACE_OPTIONS} value={place} onChange={setPlace} />
          <ChoiceGrid options={TIME_OPTIONS} value={timeBudget} onChange={setTimeBudget} />
          <DaysPicker values={trainDays} onChange={setTrainDays} />
          {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
          <PrimaryButton
            label="Сохранить"
            busy={busy === "save"}
            onPress={() => save({ place, timeBudget }, trainDays.length ? trainDays : DEFAULT_TRAIN_DAYS)}
          />
          <View className="mt-2">
            <GhostButton glass label="Позже — дом, час, три дня" onPress={skip} />
          </View>
        </View>
      ) : (
        <View className="mt-4">
          <PrimaryButton label="Выбрать место и дни" onPress={() => setOpen(true)} />
          <View className="mt-2">
            <GhostButton glass label="Позже — дом, час, три дня" onPress={skip} />
          </View>
        </View>
      )}
    </View>
  );
}
