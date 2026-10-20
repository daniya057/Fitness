import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { Field, GhostButton, PillButton, PrimaryButton, ScreenHeader } from "../../ui/kit";
import { glassStyle } from "../../ui/Glass";
import { AvatarBadge } from "../avatar/AvatarBadge";
import { ProfileChip } from "../avatar/ProfileChip";
import { useAuth } from "../auth/AuthContext";
import { checkinSkipped } from "../checkins/skip";
import { NudgeBanner } from "./NudgeBanner";
import { StreakMark } from "./StreakMark";
import { copyInviteLink, inviteLink, shareInviteLink, useInviteOrigin } from "./invite";

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

function RequestCard({ person, onAccept, onDecline, busy }) {
  const router = useRouter();
  return (
    <View className="mb-3 rounded-[24px] px-4 py-4" style={glassStyle({ borderRadius: 24 })}>
      <Pressable
        onPress={async () => {
          await lightTap();
          router.push(`/person/${person.id}`);
        }}
        className="flex-row items-center"
      >
        <AvatarBadge user={person} size="sm" />
        <View className="ml-3 flex-1">
          <Text className="text-[18px] font-semibold text-white">{person.name}</Text>
          <Text className="mt-1 text-[13px] text-white/55">хочет в друзья</Text>
        </View>
        <StreakMark days={person.streak || 0} />
      </Pressable>
      <View className="mt-4 flex-row" style={{ gap: 10 }}>
        <View className="flex-1">
          <PillButton wide label={busy === "accept" ? "Секунду" : "Принять"} onPress={onAccept} tone="glassOn" />
        </View>
        <View className="flex-1">
          <PillButton wide label={busy === "decline" ? "Секунду" : "Отклонить"} onPress={onDecline} tone="fill" />
        </View>
      </View>
    </View>
  );
}

function InviteSheet({ userId, origin, onLater, onCopied }) {
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState("");
  const link = inviteLink(userId, origin);

  const copy = async () => {
    setBusy("copy");
    setHint("");
    try {
      await copyInviteLink(userId);
      setHint("Ссылка скопирована");
      onCopied?.();
    } catch (err) {
      setHint(err.message || "Скопируй ссылку вручную");
    } finally {
      setBusy("");
    }
  };

  const share = async () => {
    setBusy("share");
    setHint("");
    try {
      await shareInviteLink(userId);
    } catch (err) {
      setHint(err.message || "Не вышло");
    } finally {
      setBusy("");
    }
  };

  return (
    <View
      className="px-5 py-5"
      style={glassStyle({ variant: "fill", borderRadius: 28 })}
    >
      <Text className="text-[20px] font-semibold text-white">Позови друга</Text>
      <Text className="mt-2 text-[14px] leading-5 text-white/60">
        Скинь ссылку. Он откроет и отправит заявку — ты примешь её здесь.
      </Text>
      <Text selectable className="mt-3 text-[12px] leading-5 text-white/45">
        {link}
      </Text>
      <View className="mt-4">
        <PrimaryButton label={busy === "copy" ? "Секунду" : hint === "Ссылка скопирована" ? "Скопировано" : "Скопировать ссылку"} onPress={copy} />
      </View>
      <View className="mt-2">
        <PillButton wide label={busy === "share" ? "Секунду" : "Поделиться"} onPress={share} tone="fill" />
      </View>
      <View className="mt-2">
        <GhostButton glass label="Больше не показывать" onPress={onLater} />
      </View>
      {hint && hint !== "Ссылка скопирована" ? <Text className="mt-3 text-[13px] text-white/55">{hint}</Text> : null}
    </View>
  );
}

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, patch, searchPeople, listFriends, requestFriend, acceptFriend, declineFriend, removeFriend, nudgeFriend } =
    useAuth();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [hint, setHint] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busyKind, setBusyKind] = useState("");
  const [ready, setReady] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [searching, setSearching] = useState(false);
  const origin = useInviteOrigin();
  const known = new Set(friends.map((item) => item.id));
  const waiting = new Set(outgoing);
  const incomingIds = new Set(incoming.map((item) => item.id));

  const applyPack = (pack) => {
    setFriends(pack.friends || []);
    setIncoming(pack.incoming || []);
    setOutgoing(pack.outgoing || []);
  };

  useEffect(() => {
    let alive = true;
    listFriends()
      .then((pack) => {
        if (!alive) {
          return;
        }
        applyPack(pack);
        setReady(true);
        if (!(pack.friends || []).length && user?.id && !user?.inviteHidden && !checkinSkipped("invite", user.id)) {
          setSheet(true);
        }
      })
      .catch((err) => {
        if (alive) {
          setHint(err.message || "Список не открылся");
          setReady(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [listFriends, user?.id, user?.inviteHidden]);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    let alive = true;
    setSearching(true);
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
            setHits([]);
            setHint(err.message || "Не нашлось");
          }
        })
        .finally(() => {
          if (alive) {
            setSearching(false);
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
      const pack = await action();
      if (pack && (Array.isArray(pack.friends) || Array.isArray(pack.incoming))) {
        applyPack(pack);
      }
      if (kind === "nudge") {
        setHint("Приглашение ушло");
      }
      if (kind === "add") {
        setHint(pack?.status === "friends" ? "Теперь друзья" : "Заявка ушла — ждём ответ");
      }
    } catch (err) {
      setHint(err.message || "Не вышло");
    } finally {
      setBusyId("");
      setBusyKind("");
    }
  };

  const copyLink = async () => {
    if (!user?.id) {
      return;
    }
    await lightTap();
    try {
      await copyInviteLink(user.id);
      setHint("Ссылка скопирована");
    } catch (err) {
      setHint(err.message || inviteLink(user.id, origin));
    }
  };

  const later = async () => {
    await lightTap();
    setSheet(false);
    try {
      await patch({ inviteHidden: true });
    } catch {
      // окно уже закрыли; при следующем входе спросим снова, если сервер не записал
    }
  };

  const hitAction = (person) => {
    if (known.has(person.id)) {
      return <Text className="text-[13px] text-white/45">В друзьях</Text>;
    }
    if (incomingIds.has(person.id)) {
      return (
        <PillButton
          label={busyId === person.id ? "Секунду" : "Принять"}
          onPress={() => run("accept", person.id, () => acceptFriend(person.id))}
          tone="glassOn"
        />
      );
    }
    if (waiting.has(person.id)) {
      return <Text className="text-[13px] text-white/45">Заявка ушла</Text>;
    }
    return (
      <PillButton
        label={busyId === person.id ? "Секунду" : "Добавить"}
        onPress={() => run("add", person.id, () => requestFriend(person.id))}
        tone="glassOn"
      />
    );
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader glass title="Друзья" subtitle="Вместе только по заявке" right={<ProfileChip />} />
        <NudgeBanner />
        <Field
          glass
          label="Имя"
          value={query}
          onChangeText={setQuery}
          placeholder="Найди по имени"
          autoCorrect={false}
        />
        <View className="mb-5">
          <PillButton wide label="Ссылка-приглашение" onPress={copyLink} tone="glassOn" />
        </View>
        {query.trim().length >= 2 && !searching && !hits.length ? (
          <Text className="mb-4 text-[13px] leading-5 text-white/45">Никого с таким именем. Ссылка ниже — если человека ещё нет в приложении.</Text>
        ) : null}
        {hits.length ? (
          <View className="mb-6 rounded-[24px] px-4 py-2" style={glassStyle({ borderRadius: 24 })}>
            {hits.map((person, index) => (
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
                  {hitAction(person)}
                </View>
                {index < hits.length - 1 ? <View className="h-px bg-white/10" /> : null}
              </View>
            ))}
          </View>
        ) : null}
        {incoming.length ? (
          <View className="mb-2">
            <Text className="mb-3 text-[12px] font-medium tracking-[1.2px] text-white/55">ЗАЯВКИ</Text>
            {incoming.map((person) => (
              <RequestCard
                key={person.id}
                person={person}
                busy={busyId === person.id ? busyKind : ""}
                onAccept={() => run("accept", person.id, () => acceptFriend(person.id))}
                onDecline={() => run("decline", person.id, () => declineFriend(person.id))}
              />
            ))}
          </View>
        ) : null}
        {friends.length ? (
          friends.map((person) => (
            <FriendCard
              key={person.id}
              person={person}
              busy={busyId === person.id ? busyKind : ""}
              onNudge={() =>
                run("nudge", person.id, async () => {
                  await nudgeFriend(person.id);
                  return { friends, incoming, outgoing };
                })
              }
              onRemove={() => run("remove", person.id, () => removeFriend(person.id))}
            />
          ))
        ) : (
          <View className="mt-2 rounded-[24px] px-5 py-6" style={glassStyle({ variant: "fill", borderRadius: 24 })}>
            <Text className="text-[17px] font-semibold text-white">Пока никого</Text>
            <Text className="mt-2 text-[14px] leading-5 text-white/55">
              Найди по имени или скинь ссылку. Друг появится в списке, когда примет заявку.
            </Text>
          </View>
        )}
        {hint ? <Text className="mt-3 text-[13px] text-white/55">{hint}</Text> : null}
      </ScrollView>
      {ready && sheet ? (
        <ScrollView
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 40,
            backgroundColor: "rgba(4, 12, 10, 0.58)",
          }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 22,
            paddingTop: 24,
            paddingBottom: 18,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <InviteSheet userId={user?.id} origin={origin} onLater={later} onCopied={() => setHint("Ссылка скопирована")} />
        </ScrollView>
      ) : null}
    </View>
  );
}
