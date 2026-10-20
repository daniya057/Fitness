import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/features/auth/AuthContext";
import { isInviteId, writePendingInvite } from "../../src/features/friends/invite";
import { glassStyle } from "../../src/ui/Glass";
import { getPalette } from "../../src/ui/theme";

export default function InviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, requestFriend } = useAuth();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [text, setText] = useState("Открываем заявку");
  const sent = useRef("");
  const requestRef = useRef(requestFriend);
  requestRef.current = requestFriend;

  useEffect(() => {
    if (!isInviteId(id)) {
      router.replace("/friends");
      return undefined;
    }
    writePendingInvite(id);
    if (!user?.id) {
      return undefined;
    }
    const target = String(id).toLowerCase();
    if (user.id === target) {
      router.replace("/friends");
      return undefined;
    }
    if (sent.current === target) {
      return undefined;
    }
    sent.current = target;
    requestRef
      .current(target)
      .then(() => {
        setText("Заявка ушла. Ждём, пока примет.");
      })
      .catch((err) => {
        setText(err.message || "Не вышло");
      })
      .finally(() => {
        setTimeout(() => {
          router.replace("/friends");
        }, 900);
      });
    return undefined;
  }, [id, user?.id, router]);

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: getPalette().bg }}>
      <StatusBar style="light" />
      <View className="w-full rounded-[28px] px-5 py-6" style={glassStyle({ variant: "fill", borderRadius: 28 })}>
        <Text className="text-[20px] font-semibold text-white">Приглашение</Text>
        <Text className="mt-2 text-[15px] leading-6 text-white/60">{text}</Text>
      </View>
    </View>
  );
}
