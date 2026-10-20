import { useState } from "react";
import { Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";
import { Field, GhostButton, PrimaryButton } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import {
  BLOCKER_OPTIONS,
  FAVORITE_OPTIONS,
  PACE_OPTIONS,
  WEEK_MOOD_OPTIONS,
  coerceTrainDayIds,
} from "../onboarding/quiz";
import { ChoiceGrid, ChoiceRow } from "../onboarding/ChoiceGrid";
import { DaysPicker } from "../onboarding/DaysPicker";
import { useAuth } from "../auth/AuthContext";
import { needsWeeklyReview, weekStartUtc } from "./recommend";
import { checkinSkipped, skipCheckin } from "./skip";

export function WeeklyCard({ startOpen = false, onClose } = {}) {
  const { user, patch } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [mood, setMood] = useState("");
  const [blockers, setBlockers] = useState([]);
  const [favorite, setFavorite] = useState("");
  const [trainDays, setTrainDays] = useState(() => coerceTrainDayIds(user?.trainDays, user?.daysPerWeek || 3));
  const [pace, setPace] = useState("same");
  const [weightText, setWeightText] = useState("");
  const [skipWeight, setSkipWeight] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user?.quizDone || !needsWeeklyReview(user) || hidden || checkinSkipped("weeklyHome", user.id)) {
    return null;
  }

  const postpone = async () => {
    await lightTap();
    skipCheckin("weeklyHome", user.id);
    setHidden(true);
    onClose?.();
  };

  const save = async () => {
    setError("");
    if (!mood || !favorite || !pace) {
      setError("Настроение, любимый тип и темп");
      return;
    }
    if (trainDays.length < 1) {
      setError("Выбери дни на следующей неделе");
      return;
    }
    setBusy(true);
    try {
      const weightKg = skipWeight ? null : Number(String(weightText).replace(",", "."));
      await patch({
        weeklyReview: {
          weekStart: weekStartUtc(),
          mood,
          blockers,
          favorite,
          nextDays: trainDays.length,
          trainDays,
          pace,
          weightKg: Number.isFinite(weightKg) && weightKg >= 40 && weightKg <= 160 ? weightKg : null,
          skippedWeight: skipWeight || !weightText,
        },
      });
      onClose?.();
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  if (!startOpen) {
    return null;
  }

  return (
    <View
      className="mt-5 rounded-[24px] px-5 py-5"
      style={glassStyle({
        borderRadius: 24,
        lens: false,
        backgroundColor: "rgba(16, 28, 24, 0.18)",
      })}
    >
      <Text className="text-[11px] font-medium tracking-[1px] text-white/55">НЕДЕЛЯ</Text>
      <Text className="mt-1 text-[20px] font-semibold text-white">Как прошла?</Text>

      <View className="mt-4">
        <ChoiceRow fill options={WEEK_MOOD_OPTIONS} value={mood} onChange={setMood} />
      </View>
      <Text className="mb-2 text-[13px] text-white/55">Что мешало</Text>
      <ChoiceRow fill options={BLOCKER_OPTIONS} values={blockers} onChange={setBlockers} multi />
      <ChoiceGrid fill label="Нравилось больше" options={FAVORITE_OPTIONS} value={favorite} onChange={setFavorite} columns={2} />
      <DaysPicker fill label="Дни на следующей" values={trainDays} onChange={setTrainDays} />
      <ChoiceGrid fill label="Темп" options={PACE_OPTIONS} value={pace} onChange={setPace} />
      {skipWeight ? (
        <Text className="mb-4 text-[13px] text-white/55">Вес пропускаем</Text>
      ) : (
        <Field
          glass
          label="Вес за неделю, кг"
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="decimal-pad"
        />
      )}

      {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
      <PrimaryButton label="Сохранить" onPress={save} busy={busy} />
      <View className="mt-3">
        <GhostButton
          glass
          label={skipWeight ? "Позже" : "Не хочу говорить вес"}
          onPress={async () => {
            if (!skipWeight) {
              await lightTap();
              setSkipWeight(true);
              setWeightText("");
              return;
            }
            await postpone();
          }}
        />
      </View>
    </View>
  );
}
