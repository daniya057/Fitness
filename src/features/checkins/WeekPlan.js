import { Text, View } from "react-native";
import { Play } from "lucide-react-native";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { isSetSession, minSets, sessionDetail } from "../workouts/catalog";
import { lookOfGroup } from "../workouts/look";
import { ACCENT_INK } from "../../ui/layout";
import { todayPlanItem, weekPlan } from "./recommend";

export function WeekPlan({ user, onOpen }) {
  const plan = weekPlan(user);
  if (!plan.length) {
    return null;
  }

  const rest = todayPlanItem(user);

  return (
    <View className="mb-5">
      <Text className="mb-3 text-[12px] font-medium tracking-[1.2px] text-white/55">План недели</Text>
      {rest?.rest ? (
        <Text className="mb-3 text-[13px] leading-5 text-white/55">{rest.reason || "Сегодня по плану отдых."}</Text>
      ) : null}
      {plan.map((item) => {
        const look = lookOfGroup(item.session?.group || item.group);
        return (
          <View
            key={`${item.weekday}-${item.session?.id}`}
            className="mb-2 flex-row items-center rounded-[20px] px-4 py-3"
            style={glassStyle({
              variant: "fill",
              borderRadius: 20,
              backgroundColor: item.today ? "rgba(125,255,179,0.12)" : undefined,
            })}
          >
            <View className="mr-3 w-10">
              <Text className="text-[13px] font-semibold text-white/70">{item.dayLabel}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-white">{item.session?.title}</Text>
              <Text className="mt-0.5 text-[12px] text-white/45">
                {item.reason || sessionDetail(item.session)}
              </Text>
            </View>
            {onOpen ? (
              <SoftPress
                onPress={() => onOpen(item.session)}
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: look.accent, width: 44, height: 44, borderRadius: 999 }}
              >
                    <Play size={18} color={ACCENT_INK} fill={ACCENT_INK} strokeWidth={1.8} />
              </SoftPress>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function TodayPlanCard({ user, onOpen }) {
  const item = todayPlanItem(user);
  if (!item?.session) {
    return null;
  }
  const look = lookOfGroup(item.session.group || item.group);

  return (
    <View className="mb-5 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
      <Text className="text-[11px] font-medium tracking-[1px]" style={{ color: getPalette().accent }}>
        НА СЕГОДНЯ
      </Text>
      <Text className="mt-1 text-[20px] font-semibold text-white">{item.session.title}</Text>
      <Text className="mt-1 text-[13px] leading-5 text-white/55">{item.reason || sessionDetail(item.session)}</Text>
      <Text className="mt-2 text-[12px] leading-4 text-white/45">
        {isSetSession(item.session)
          ? `Засчитаем от ${minSets(item.session)} рабочих подходов. Разминку и дорожку в конце можно пропустить.`
          : "Засчитаем, если сделаешь хотя бы половину упражнений по времени. Паузы не считаются."}
      </Text>
      {onOpen ? (
        <SoftPress
          onPress={() => onOpen(item.session)}
          className="mt-4 items-center rounded-full"
          style={{ backgroundColor: look.accent, minHeight: 48, justifyContent: "center" }}
        >
          <Text className="text-[15px] font-semibold" style={{ color: ACCENT_INK }}>
            Начать
          </Text>
        </SoftPress>
      ) : null}
    </View>
  );
}
