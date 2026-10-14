import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Flame, Shield, Trophy, Zap } from "lucide-react-native";
import { lightTap } from "../../lib/haptics";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { AchievementPlaque } from "../achievements/plaque";
import { AvatarBadge } from "../avatar/AvatarBadge";
import { StreakMark } from "./StreakMark";

const KIND_TITLES = {
  strength: "Силовая",
  run: "Бег",
  nutrition: "Еда",
  walk: "Прогулка",
  stretch: "Растяжка",
  bike: "Вело",
};

const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

function sinceLabel(iso) {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) {
    return "";
  }
  const date = new Date(at);
  return `в приложении с ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function StatTile({ Icon, value, label }) {
  return (
    <View className="mb-2 w-[48%] rounded-[20px] px-3 py-4" style={glassStyle({ variant: "fill", borderRadius: 20 })}>
      <Icon size={18} color={getPalette().accent} strokeWidth={1.8} />
      <Text className="mt-2 text-[22px] font-semibold tabular-nums text-white">{value}</Text>
      <Text className="mt-0.5 text-[12px] leading-4 text-white/55">{label}</Text>
    </View>
  );
}

export function PublicProfile({ person, mine = false }) {
  const router = useRouter();
  const kinds = Array.isArray(person?.kindsDone) ? person.kindsDone : [];
  const since = sinceLabel(person?.createdAt);

  return (
    <View>
      <View className="rounded-[24px] px-5 py-6" style={glassStyle({ borderRadius: 24 })}>
        {mine ? (
          <Text className="mb-3 text-[12px] font-medium tracking-[1.2px] text-white/55">Так видят друзья</Text>
        ) : null}
        <View className="flex-row items-center">
          <AvatarBadge user={person} size="lg" />
          <View className="ml-4 flex-1">
            <Text className="text-[26px] font-semibold text-white">{person?.name || "Гость"}</Text>
            {person?.status ? <Text className="mt-1 text-[14px] text-white/60">{person.status}</Text> : null}
            <Text className="mt-1 text-[13px] text-white/55">{person?.activityToday ? "сегодня двигался" : "сегодня ещё нет"}</Text>
            {since ? <Text className="mt-1 text-[12px] text-white/40">{since}</Text> : null}
          </View>
          <StreakMark days={person?.streak || 0} />
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap justify-between">
        <StatTile Icon={Flame} value={person?.streak || 0} label="дней подряд" />
        <StatTile Icon={Trophy} value={person?.activityCount || 0} label="тренировок" />
        <StatTile Icon={Shield} value={person?.freezesLeft || 0} label="щитов" />
        <StatTile Icon={Zap} value={person?.dailyDoneCount || 0} label="заданий закрыто" />
      </View>

      {kinds.length ? (
        <View className="mt-2">
          <Text className="mb-2 text-[12px] font-medium tracking-[1.2px] text-white/55">Типы</Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {kinds.map((id) => (
              <View key={id} className="rounded-full px-3 py-2" style={{ backgroundColor: "rgba(125,255,179,0.16)" }}>
                <Text className="text-[13px] font-medium" style={{ color: getPalette().accent }}>
                  {KIND_TITLES[id] || id}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <AchievementPlaque
        tone="glass"
        user={person}
        onPress={
          mine
            ? async () => {
                await lightTap();
                router.replace("/rewards");
              }
            : undefined
        }
      />
    </View>
  );
}
