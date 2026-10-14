import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { Field, PillButton, ScreenHeader } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { AvatarBadge } from "../avatar/AvatarBadge";
import { ProfileChip } from "../avatar/ProfileChip";
import { useAuth } from "../auth/AuthContext";
import { NudgeBanner } from "./NudgeBanner";
import { StreakMark } from "./StreakMark";

function FriendCard({ person, onNudge, onRemove, busy }) {
  const router = useRouter();
  const openProfile = async () => {
    await lightTap();
    router.push(`/person/${person.id}`);
  };
  return (
    <View className="mb-3 rounded-[24px] px-4 py-4" style={glassStyle({ borderRadius: 24 })}>
      <Pressable onPress={openProfile} className="flex-row items-center">
        <AvatarBadge user={person} size="sm" />
        <View className="ml-3 flex-1">
          <Text className="text-[18px] font-semibold text-white">{person.name}</Text>
          <Text className="mt-1 text-[13px] text-white/55">{person.activityToday ? "сегодня" : "не сегодня"}</Text>
        </View>
        <StreakMark days={person.streak || 0} />
      </Pressable>
      <View className="mt-4 flex-row" style={{ gap: 10 }}>
        <View className="flex-1">
          <PillButton wide label={busy === "nudge" ? "Секунду" : "Позвать"} onPress={onNudge} tone="glassOn" />
        </View>
        <View className="flex-1">
          <PillButton wide label={busy === "remove" ? "Секунду" : "Убрать"} onPress={onRemove} tone="fill" />
        </View>
      </View>
    </View>
  );
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchPeople, listFriends, addFriend, removeFriend, nudgeFriend } = useAuth();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [friends, setFriends] = useState([]);
  const [hint, setHint] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busyKind, setBusyKind] = useState("");
  const known = new Set(friends.map((item) => item.id));

  useEffect(() => {
    let alive = true;
    listFriends()
      .then((rows) => {
        if (alive) {
          setFriends(rows);
        }
      })
      .catch((err) => {
        if (alive) {
          setHint(err.message || "Список не открылся");
        }
      });
    return () => {
      alive = false;
    };
  }, [listFriends]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setHits([]);
      return undefined;
    }
    let alive = true;
    const id = setTimeout(() => {
      searchPeople(text)
        .then((rows) => {
          if (alive) {
            setHits(rows);
            setHint("");
          }
        })
        .catch((err) => {
          if (alive) {
            setHint(err.message || "Не нашлось");
          }
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query, searchPeople]);

  const run = async (kind, id, action) => {
    await lightTap();
    setBusyId(id);
    setBusyKind(kind);
    setHint("");
    try {
      const rows = await action();
      if (Array.isArray(rows)) {
        setFriends(rows);
      }
      if (kind === "nudge") {
        setHint("Приглашение ушло");
      }
    } catch (err) {
      setHint(err.message || "Не вышло");
    } finally {
      setBusyId("");
      setBusyKind("");
    }
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader glass title="Друзья" subtitle="По имени в приложении" right={<ProfileChip />} />
        <NudgeBanner />
        <Field
          glass
          label="Имя"
          value={query}
          onChangeText={setQuery}
          placeholder="Найди по имени"
          autoCorrect={false}
        />
        {hits.length ? (
          <View className="mb-6 rounded-[24px] px-4 py-2" style={glassStyle({ borderRadius: 24 })}>
            {hits.map((person, index) => {
              const added = known.has(person.id);
              return (
                <View key={person.id}>
                  <View className="flex-row items-center py-3">
                    <Pressable
                      className="min-h-[48px] flex-1 flex-row items-center"
                      onPress={async () => {
                        await lightTap();
                        router.push(`/person/${person.id}`);
                      }}
                    >
                      <AvatarBadge user={person} size="sm" />
                      <View className="ml-3 flex-1">
                        <Text className="text-[16px] font-medium text-white">{person.name}</Text>
                        <View className="mt-1">
                          <StreakMark days={person.streak || 0} compact />
                        </View>
                      </View>
                    </Pressable>
                    {added ? (
                      <Text className="text-[13px] text-white/45">В друзьях</Text>
                    ) : (
                      <PillButton
                        label={busyId === person.id ? "Секунду" : "Добавить"}
                        onPress={() => run("add", person.id, () => addFriend(person.id))}
                        tone="glassOn"
                      />
                    )}
                  </View>
                  {index < hits.length - 1 ? <View className="h-px bg-white/10" /> : null}
                </View>
              );
            })}
          </View>
        ) : null}
        {friends.length ? (
          friends.map((person) => (
            <FriendCard
              key={person.id}
              person={person}
              busy={busyId === person.id ? busyKind : ""}
              onNudge={() => run("nudge", person.id, async () => {
                await nudgeFriend(person.id);
                return friends;
              })}
              onRemove={() => run("remove", person.id, () => removeFriend(person.id))}
            />
          ))
        ) : (
          <Text className="mt-2 text-[15px] text-white/45">Найди по имени</Text>
        )}
        {hint ? <Text className="mt-3 text-[13px] text-white/55">{hint}</Text> : null}
      </ScrollView>
    </View>
  );
}
