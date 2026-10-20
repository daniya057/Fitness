import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { celebrateTap } from "../../lib/haptics";
import { GlassPanel } from "../../ui/Glass";
import { PillButton } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";
import { ACHIEVEMENTS, iconOf } from "./catalog";
import { Medal } from "./Medal";

const COLORS = ["#8FDCB8", "#76C9A8", "#FFD54F", "#FFFFFF", "#FF8A65", "#FF6B7A"];

function ConfettiPiece({ x, drift, delay, color, w, h, rot, fall }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }));
  }, [delay, progress]);

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const fade = t < 0.12 ? t / 0.12 : t > 0.72 ? (1 - t) / 0.28 : 1;
    return {
      opacity: fade,
      transform: [
        { translateX: x + drift * t },
        { translateY: -36 + fall * t },
        { rotate: `${rot + t * 420}deg` },
        { scale: 1 - t * 0.15 },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 72,
          left: 0,
          width: w,
          height: h,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function ConfettiBurst({ burstKey }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(() => {
    return Array.from({ length: 28 }, (_, index) => ({
      id: `${burstKey}-${index}`,
      x: width / 2 + (Math.random() - 0.5) * 72,
      drift: (Math.random() - 0.5) * 240,
      delay: Math.round(Math.random() * 260),
      color: COLORS[index % COLORS.length],
      w: 6 + (index % 5),
      h: 9 + (index % 6),
      rot: (index * 47) % 360,
      fall: height * 0.72 + (index % 7) * 18,
    }));
  }, [burstKey, height, width]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>
      {pieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </View>
  );
}

export function AchievementUnlock() {
  const { user } = useAuth();
  const seen = useRef(null);
  const [queue, setQueue] = useState([]);
  const currentId = queue[0] || "";
  const item = ACHIEVEMENTS.find((entry) => entry.id === currentId) || null;
  const Icon = iconOf(item?.id);
  const more = queue.length > 1;

  useEffect(() => {
    if (!user?.id) {
      seen.current = null;
      setQueue([]);
      return;
    }
    const ids = Array.isArray(user.achievements) ? user.achievements : [];
    if (!seen.current || seen.current.userId !== user.id) {
      seen.current = { userId: user.id, ids: new Set(ids) };
      return;
    }
    const fresh = ids.filter((id) => !seen.current.ids.has(id));
    if (!fresh.length) {
      return;
    }
    fresh.forEach((id) => seen.current.ids.add(id));
    setQueue((prev) => [...prev, ...fresh]);
  }, [user?.achievements, user?.id]);

  useEffect(() => {
    if (!item) {
      return undefined;
    }
    celebrateTap();
    return undefined;
  }, [item]);

  const close = () => {
    setQueue((prev) => prev.slice(1));
  };

  if (!item) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
        <ConfettiBurst burstKey={item.id} />
        <GlassPanel glow style={{ width: "100%", maxWidth: 360, borderRadius: 32, paddingHorizontal: 24, paddingVertical: 28 }}>
          <View className="items-center">
            <Medal Icon={Icon} open size={96} />
            <Text className="mt-4 text-center text-[13px] font-medium tracking-[1.2px] text-accent">Новое достижение</Text>
            <Text className="mt-2 text-center text-[24px] font-semibold text-white">{item.title}</Text>
            {item.hint ? (
              <Text className="mt-2 text-center text-[14px] leading-5 text-white/60">{item.hint}</Text>
            ) : null}
          </View>
          <View className="mt-6 items-center">
            <PillButton label={more ? "Дальше" : "Круто"} onPress={close} tone="glassOn" />
          </View>
        </GlassPanel>
      </View>
    </Modal>
  );
}
