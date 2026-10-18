import { useState } from "react";
import { Text, View } from "react-native";
import { GhostButton, PrimaryButton } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { useAuth } from "../auth/AuthContext";
import { quizPayload } from "../onboarding/quiz";
import { FoodSkipEditor } from "./FoodSkipEditor";
import { parseFoodSkipList } from "./foodSkip";
import { useMealPlan } from "./mealPlanStore";

export async function persistFoodSkip(patch, user, list, rebuild) {
  const updated = await patch({
    saveQuiz: true,
    quiz: quizPayload({
      ...(user?.quiz || {}),
      foodSkip: parseFoodSkipList(list),
      foodSkipSet: true,
    }),
  });
  const store = useMealPlan.getState();
  if (rebuild && updated) {
    store.compose(updated);
  } else {
    store.clear();
  }
  return updated;
}

export function FoodSkipCard({ user }) {
  const { patch } = useAuth();
  const [chips, setChips] = useState(() => parseFoodSkipList(user?.quiz?.foodSkip));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (list) => {
    setBusy(true);
    setError("");
    try {
      await persistFoodSkip(patch, user, list, false);
    } catch (err) {
      setError(err.message || "Не сохранилось");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-4 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24, backgroundColor: "rgba(125,255,179,0.08)" })}>
      <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">РАЦИОН</Text>
      <Text className="mt-2 text-[18px] font-semibold text-white">Что нельзя или не любишь?</Text>
      <Text className="mt-1 text-[13px] leading-5 text-white/55">
        Добавь продукты или блюда по одному. Рацион их не предложит.
      </Text>
      <View className="mt-4">
        <FoodSkipEditor values={chips} onChange={setChips} />
      </View>
      {error ? <Text className="mt-3 text-[13px] text-accent">{error}</Text> : null}
      <View className="mt-4">
        <PrimaryButton glass label="Учитывать в рационе" busy={busy} onPress={() => save(chips)} />
      </View>
      <View className="mt-3">
        <GhostButton glass label="Ем всё" onPress={() => save([])} />
      </View>
    </View>
  );
}
