import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SoftPress } from "../../ui/SoftPress";
import { ScreenHeader } from "../../ui/kit";
import { SessionPlayer } from "./SessionPlayer";
import { WORKOUT_GROUPS, sessionDetail, sessionsInGroup } from "./catalog";
import { lookOfGroup } from "./look";
import { useSession } from "./sessionStore";

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession((s) => s.session);
  const open = useSession((s) => s.open);
  const [groupId, setGroupId] = useState(WORKOUT_GROUPS[0].id);
  const list = useMemo(() => sessionsInGroup(groupId), [groupId]);
  const look = lookOfGroup(groupId);

  if (session) {
    return <SessionPlayer />;
  }

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Тренинг" subtitle="Без железа. Короткие круги и длинные на несколько подходов." />
        <View className="mb-5 flex-row flex-wrap gap-2">
          {WORKOUT_GROUPS.map((group) => {
            const on = group.id === groupId;
            const chip = lookOfGroup(group.id);
            return (
              <Pressable
                key={group.id}
                onPress={() => setGroupId(group.id)}
                className="rounded-full px-4 py-2.5"
                style={{ backgroundColor: on ? chip.chipOn : chip.chipOff }}
              >
                <Text className="text-[13px] font-medium" style={{ color: on ? "#FFFFFF" : chip.ink }}>
                  {group.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {list.map((item) => {
          const Icon = look.Icon;
          return (
            <View key={item.id} className="mb-3 rounded-[28px] px-5 py-6" style={{ backgroundColor: look.card }}>
              <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-white">
                <Icon size={20} color={look.accent} strokeWidth={2.2} />
              </View>
              <Text className="text-[22px] font-semibold leading-7" style={{ color: look.ink }}>
                {item.title}
              </Text>
              <Text className="mt-2 text-[13px]" style={{ color: look.mute }}>
                {sessionDetail(item)}
              </Text>
              <SoftPress
                onPress={() => open(item)}
                className="mt-5 items-center rounded-full py-3.5"
                style={{ backgroundColor: look.accent }}
              >
                <Text className="text-[14px] font-semibold text-white">Старт</Text>
              </SoftPress>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
