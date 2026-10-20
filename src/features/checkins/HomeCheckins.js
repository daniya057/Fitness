import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import { ChevronRight } from "lucide-react-native";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { lightTap } from "../../lib/haptics";
import { useAuth } from "../auth/AuthContext";
import { CheckinCard } from "./CheckinCard";
import { WeeklyCard } from "./WeeklyCard";
import { needsWeeklyReview, todayCheckin } from "./recommend";
import { checkinSkipped } from "./skip";

function pending(user) {
  const week = Boolean(user?.quizDone && needsWeeklyReview(user) && !checkinSkipped("weeklyHome", user.id));
  const day = Boolean(user?.quizDone && !todayCheckin(user) && !checkinSkipped("dailyHome", user.id));
  return { week, day };
}

export function HomeCheckins() {
  const { user } = useAuth();
  const [open, setOpen] = useState("");
  const { week, day } = pending(user);

  if (open === "weekly" && week) {
    return (
      <WeeklyCard
        startOpen
        onClose={() => setOpen(day ? "daily" : "")}
      />
    );
  }
  if (open === "daily" && day) {
    return <CheckinCard startOpen onClose={() => setOpen("")} />;
  }
  if (!week && !day) {
    return null;
  }

  const title = week ? "Как прошла неделя?" : "Как ты сегодня?";
  const hint = week && day ? "Потом ещё коротко про сегодня" : week ? "Пара вопросов — план на следующую" : "Силы, сон, сколько времени есть";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        lightTap();
        setOpen(week ? "weekly" : "daily");
      }}
      className="mt-5 flex-row items-center rounded-[24px] px-5"
      style={{ ...glassStyle({ variant: "fill", borderRadius: 24 }), minHeight: 72 }}
    >
      <View className="min-w-0 flex-1 py-4 pr-3">
        <Text className="text-[17px] font-semibold text-white">{title}</Text>
        <Text className="mt-1 text-[13px] leading-5 text-white/50">{hint}</Text>
      </View>
      <View
        className="flex-row items-center rounded-full pl-3 pr-2"
        style={{ backgroundColor: getPalette().pill, minHeight: 36, flexShrink: 0 }}
      >
        <Text className="text-[13px] font-semibold" style={{ color: getPalette().accent }}>
          Ответить
        </Text>
        <ChevronRight size={16} color={getPalette().accent} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}
