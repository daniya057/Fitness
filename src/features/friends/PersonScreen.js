import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";
import { PillButton, TextLink } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";
import { PublicProfile } from "./PublicProfile";

export default function PersonScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, getPerson, listFriends, requestFriend, acceptFriend, declineFriend, removeFriend, nudgeFriend } =
    useAuth();
  const [person, setPerson] = useState(null);
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const mine = Boolean(user?.id && user.id === id);
  const added = friends.some((item) => item.id === id);
  const askedMe = incoming.some((item) => item.id === id);
  const waiting = outgoing.includes(id);

  const applyPack = (pack) => {
    setFriends(pack.friends || []);
    setIncoming(pack.incoming || []);
    setOutgoing(pack.outgoing || []);
  };

  useEffect(() => {
    let alive = true;
    getPerson(id)
      .then((card) => {
        if (alive) {
          setPerson(card);
          setError("");
        }
      })
      .catch((err) => {
        if (alive) {
          setError(err.message || "Профиль не открылся");
        }
      });
    listFriends()
      .then((pack) => {
        if (alive) {
          applyPack(pack);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, getPerson, listFriends]);

  const run = async (kind, action) => {
    await lightTap();
    setBusy(kind);
    setError("");
    try {
      const pack = await action();
      if (pack && (Array.isArray(pack.friends) || Array.isArray(pack.incoming))) {
        applyPack(pack);
      }
      if (kind === "nudge") {
        setError("Приглашение ушло");
      }
      if (kind === "add") {
        setError(pack?.status === "friends" ? "Теперь друзья" : "Заявка ушла — ждём ответ");
      }
    } catch (err) {
      setError(err.message || "Не вышло");
    } finally {
      setBusy("");
    }
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <TextLink
          label="Назад"
          onPress={() => {
            if (router.canGoBack?.()) {
              router.back();
              return;
            }
            router.replace(mine ? "/profile" : "/friends");
          }}
        />
        {person ? <PublicProfile person={person} mine={mine} /> : null}
        {!person && !error ? <Text className="mt-6 text-[15px] text-white/45">Открываем…</Text> : null}
        {error ? <Text className="mt-4 text-[14px] text-white/55">{error}</Text> : null}
        {person && !mine ? (
          <View className="mt-6 flex-row" style={{ gap: 10 }}>
            {added ? (
              <>
                <View className="flex-1">
                  <PillButton
                    wide
                    label={busy === "nudge" ? "Секунду" : "Позвать"}
                    onPress={() =>
                      run("nudge", async () => {
                        await nudgeFriend(person.id);
                        return { friends, incoming, outgoing };
                      })
                    }
                    tone="glassOn"
                  />
                </View>
                <View className="flex-1">
                  <PillButton
                    wide
                    label={busy === "remove" ? "Секунду" : "Убрать"}
                    onPress={() => run("remove", () => removeFriend(person.id))}
                    tone="fill"
                  />
                </View>
              </>
            ) : askedMe ? (
              <>
                <View className="flex-1">
                  <PillButton
                    wide
                    label={busy === "accept" ? "Секунду" : "Принять"}
                    onPress={() => run("accept", () => acceptFriend(person.id))}
                    tone="glassOn"
                  />
                </View>
                <View className="flex-1">
                  <PillButton
                    wide
                    label={busy === "decline" ? "Секунду" : "Отклонить"}
                    onPress={() => run("decline", () => declineFriend(person.id))}
                    tone="fill"
                  />
                </View>
              </>
            ) : waiting ? (
              <View className="flex-1">
                <PillButton wide label="Заявка ушла" disabled tone="fill" />
              </View>
            ) : (
              <View className="flex-1">
                <PillButton
                  wide
                  label={busy === "add" ? "Секунду" : "Добавить"}
                  onPress={() => run("add", () => requestFriend(person.id))}
                  tone="glassOn"
                />
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
