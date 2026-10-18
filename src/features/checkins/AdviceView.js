import { Text, View } from "react-native";
import { glassStyle } from "../../ui/Glass";
import { FOCUS_LABELS } from "../onboarding/quiz";
import { dayLoad, loadLabel, macroTargets, nutrientHints, quizOf, todayCheckin, todayPlanItem, weekPlan } from "./recommend";
import { WeekPlan } from "./WeekPlan";

export function AdviceView({ user, onOpen }) {
  const quiz = quizOf(user);
  const macros = macroTargets(user);
  const hints = nutrientHints(user);
  const plan = weekPlan(user);
  const today = todayPlanItem(user);
  const load = loadLabel(dayLoad(todayCheckin(user)));

  return (
    <View>
      <View className="mb-5 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
        <Text className="text-[13px] text-white/55">Собрали из твоих ответов</Text>
        <Text className="mt-1 text-[22px] font-semibold text-white">{FOCUS_LABELS[quiz.focus]}</Text>
        {load ? <Text className="mt-2 text-[14px] text-[#9BFFC8]">{load}</Text> : null}
        {today?.reason ? <Text className="mt-2 text-[14px] leading-5 text-white/60">{today.reason}</Text> : null}
      </View>

      {plan.length ? <WeekPlan user={user} onOpen={onOpen} /> : null}

      <View className="mb-5 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
        <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">ПИТАНИЕ</Text>
        <Text className="mt-2 text-[32px] font-semibold text-white">{macros.kcal}</Text>
        <Text className="text-[13px] text-white/55">ккал в день · {macros.meals} приёма</Text>
        <View className="mt-4 flex-row">
          <MacroCell label="Белок" value={`${macros.protein} г`} />
          <MacroCell label="Жиры" value={`${macros.fat} г`} />
          <MacroCell label="Углеводы" value={`${macros.carbs} г`} />
        </View>
        {macros.safe ? (
          <Text className="mt-3 text-[13px] leading-5 text-white/55">
            Дефицит не предлагаем: возраст до 18 или ИМТ ниже нормы.
          </Text>
        ) : null}
      </View>

      {hints.length ? (
        <View className="mb-5 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
          <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">ОРИЕНТИР ПО РАЦИОНУ</Text>
          {hints.map((line) => (
            <Text key={line} className="mt-2 text-[14px] leading-5 text-white/70">
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function MacroCell({ label, value }) {
  return (
    <View className="flex-1">
      <Text className="text-[18px] font-semibold text-white">{value}</Text>
      <Text className="mt-0.5 text-[12px] text-white/45">{label}</Text>
    </View>
  );
}
