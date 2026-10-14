import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Sun, Sunset } from "lucide-react-native";
import { SoftPress } from "../../ui/SoftPress";
import { ScreenHeader } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { MoveHintModal, MoveList } from "./MoveHint";
import { SessionPlayer } from "./SessionPlayer";
import {
  WORKOUT_GROUPS,
  levelLabel,
  levelProgressCount,
  nextLockedSession,
  openLevel,
  openSessions,
  sessionDetail,
  warmupSessions,
  workoutsLeftPhrase,
} from "./catalog";
import { ProfileChip } from "../avatar/ProfileChip";
import { useAuth } from "../auth/AuthContext";
import { lookOfGroup } from "./look";
import { useSession } from "./sessionStore";

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const session = useSession((s) => s.session);
  const open = useSession((s) => s.open);
  const [groupId, setGroupId] = useState(WORKOUT_GROUPS[0].id);
  const [hintTitle, setHintTitle] = useState("");
  const list = useMemo(() => openSessions(groupId, user), [groupId, user]);
  const locked = useMemo(() => nextLockedSession(groupId, user), [groupId, user]);
  const warmups = useMemo(() => warmupSessions(), []);
  const todaySessions = new Set(Array.isArray(user?.todaySessions) ? user.todaySessions : []);
  const look = lookOfGroup(groupId);
  const current = openLevel(user);
  const leftPhrase = current >= 5 ? "Все уровни открыты" : workoutsLeftPhrase(levelProgressCount(user));

  if (session) {
    return <SessionPlayer />;
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader glass title="Тренировки" subtitle="Следующий уровень — после трёх тренировок" right={<ProfileChip />} />
        <Text className="mb-4 text-[15px] font-medium text-white">
          {levelLabel(current)}. {leftPhrase}.
        </Text>
        {warmups.length ? (
          <View className="mb-5 flex-row gap-2">
            {warmups.map((item) => {
              const on = todaySessions.has(item.id);
              const evening = item.id === "warmup-evening";
              const Icon = evening ? Sunset : Sun;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => open(item)}
                  className="flex-1 rounded-[24px] px-4 py-4"
                  style={glassStyle({
                    borderRadius: 24,
                    backgroundColor: on ? "rgba(125,255,179,0.12)" : undefined,
                  })}
                >
                  <Icon size={18} color={on ? getPalette().accent : getPalette().ink} strokeWidth={1.8} />
                  <Text className="mt-2 text-[15px] font-semibold text-white">{item.title}</Text>
                  <Text className="mt-1 text-[12px] text-white/45">{on ? "уже сегодня" : sessionDetail(item)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <View className="mb-5 flex-row flex-wrap gap-2">
          {WORKOUT_GROUPS.map((group) => {
            const on = group.id === groupId;
            const chip = lookOfGroup(group.id);
            return (
              <Pressable
                key={group.id}
                onPress={() => setGroupId(group.id)}
                className="rounded-full px-4"
                style={{
                  ...glassStyle({
                    borderRadius: 999,
                    backgroundColor: on ? getPalette().pill : getPalette().fill,
                    borderColor: on ? chip.accent : getPalette().line,
                  }),
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text className="text-[13px] font-medium" style={{ color: on ? getPalette().ink : getPalette().mute }}>
                  {group.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {list.map((item) => {
          return (
            <View key={item.id} className="mb-3 rounded-[24px] px-4 py-4" style={glassStyle({ borderRadius: 24 })}>
              <Text className="text-[12px] font-medium" style={{ color: look.accent }}>
                {levelLabel(item.level)}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <Text className="mr-3 flex-1 text-[18px] font-semibold leading-6 text-white">{item.title}</Text>
                <SoftPress
                  onPress={() => open(item)}
                  className="h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: look.accent, width: 44, height: 44, borderRadius: 999 }}
                >
                  <Play size={18} color="#FFFFFF" fill="#FFFFFF" strokeWidth={1.8} />
                </SoftPress>
              </View>
              <Text className="mt-1 text-[13px] text-white/55">{sessionDetail(item)}</Text>
              <MoveList session={item} onHint={setHintTitle} />
            </View>
          );
        })}
        {locked ? (
          <View className="mb-3 rounded-[24px] px-4 py-4 opacity-70" style={glassStyle({ borderRadius: 24 })}>
            <Text className="text-[13px] font-medium text-white/55">{levelLabel(locked.level)}</Text>
            <Text className="mt-1 text-[22px] font-semibold leading-7 text-white">{locked.title}</Text>
            <Text className="mt-2 text-[13px] text-white/55">
              {sessionDetail(locked)}. {leftPhrase} — и эта откроется.
            </Text>
            <MoveList session={locked} onHint={setHintTitle} />
          </View>
        ) : null}
      </ScrollView>
      <MoveHintModal title={hintTitle} onClose={() => setHintTitle("")} />
    </View>
  );
}
