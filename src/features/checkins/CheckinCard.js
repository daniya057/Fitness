import { useState } from "react";
import { Text, View } from "react-native";
import { lightTap } from "../../lib/haptics";
import { GhostButton, PrimaryButton } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { coerceTimeId, DAY_TIME_OPTIONS, ENERGY_OPTIONS, PAIN_OPTIONS, SLEEP_OPTIONS } from "../onboarding/quiz";
import { ChoiceRow } from "../onboarding/ChoiceGrid";
import { useAuth } from "../auth/AuthContext";
import { PromptRow } from "./PromptRow";
import { todayCheckin } from "./recommend";
import { checkinSkipped, skipCheckin } from "./skip";

export function CheckinCard({ compact = false } = {}) {
  const { user, patch } = useAuth();
  const existing = todayCheckin(user);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(!compact);
  const [energy, setEnergy] = useState(existing?.energy || "");
  const [sleep, setSleep] = useState(existing?.sleep || "");
  const [pain, setPain] = useState(Array.isArray(existing?.pain) ? existing.pain : []);
  const [time, setTime] = useState(coerceTimeId(existing?.time) || coerceTimeId(user?.quiz?.timeBudget) || "60");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (existing || !user?.quizDone || hidden || checkinSkipped("dailyHome", user.id)) {
    return null;
  }

  const postpone = async () => {
    await lightTap();
    skipCheckin("dailyHome", user.id);
    setHidden(true);
  };

  const save = async () => {
    setError("");
    if (!energy || !sleep || !time) {
      setError("Ответь коротко — три ряда");
      return;
    }
    setBusy(true);
    try {
      await patch({ checkin: { energy, sleep, pain, time } });
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  if (compact && !open) {
    return <PromptRow kicker="СЕГОДНЯ" title="Как ты?" action="Ответить" onPress={() => setOpen(true)} />;
  }

  return (
    <View
      className="mb-5 rounded-[24px] px-5 py-5"
      style={glassStyle({
        borderRadius: 24,
        lens: false,
        backgroundColor: "rgba(7, 20, 15, 0.55)",
      })}
    >
      <Text className="text-[11px] font-medium tracking-[1px] text-white/55">СЕГОДНЯ</Text>
      <Text className="mt-1 text-[20px] font-semibold text-white">Как ты?</Text>

      <Text className="mb-2 mt-4 text-[13px] text-white/55">Силы</Text>
      <ChoiceRow fill options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />
      <Text className="mb-2 text-[13px] text-white/55">Сон</Text>
      <ChoiceRow fill options={SLEEP_OPTIONS} value={sleep} onChange={setSleep} />
      <Text className="mb-2 text-[13px] text-white/55">Где болит</Text>
      <ChoiceRow fill options={[{ id: "none", title: "Нет" }, ...PAIN_OPTIONS]} values={pain} onChange={setPain} multi />
      <Text className="mb-2 text-[13px] text-white/55">Сколько времени</Text>
      <ChoiceRow fill options={DAY_TIME_OPTIONS} value={time} onChange={setTime} />

      {error ? <Text className="mb-3 text-[14px] font-medium text-accent">{error}</Text> : null}
      <PrimaryButton label="Готово" onPress={save} busy={busy} />
      <View className="mt-3">
        <GhostButton glass label="Позже" onPress={postpone} />
      </View>
    </View>
  );
}
