import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTap } from "../../lib/haptics";

const LIFE_MAX = 100;
const MOVE_MAX = 100;

function EnergyBar({ label, value, max, tone }) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[14px] font-light text-ink">{label}</Text>
        <Text className="text-[12px] text-mute">
          {Math.round(value)} / {max}
        </Text>
      </View>
      <View className="h-[5px] overflow-hidden rounded-full bg-card">
        <View className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </View>
    </View>
  );
}

function RoundAction({ label, onPress }) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const handlePress = async () => {
    await lightTap();
    rotate.value = withSequence(
      withTiming(-8, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(8, { duration: 90 }),
      withSpring(0, { damping: 10, stiffness: 180 })
    );
    scale.value = withSequence(withTiming(0.94, { duration: 80 }), withSpring(1));
    onPress();
  };

  return (
    <Animated.View style={style} className="items-center">
      <Pressable onPress={handlePress}>
        <View className="h-[88px] w-[88px] items-center justify-center rounded-full border border-ink/10 bg-card px-3">
          <Text className="text-center text-[12px] font-light leading-4 text-ink">{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CaloriesScreen() {
  const insets = useSafeAreaInsets();
  const [life, setLife] = useState(38);
  const [move] = useState(54);

  const add = (amount) => {
    setLife((value) => Math.min(LIFE_MAX, value + amount));
  };

  return (
    <View className="flex-1 bg-canvas px-6" style={{ paddingTop: insets.top }}>
      <View className="pt-3">
        <Text className="text-[28px] font-light text-ink">Топливо</Text>
        <Text className="mt-2 text-[13px] leading-5 text-mute">
          Не счёт грехов. Только забота: сколько сил пришло и сколько ушло в движение.
        </Text>
      </View>

      <View className="mt-10 rounded-panel border border-ink/5 bg-card px-5 py-7">
        <EnergyBar label="Энергия для жизни ⚡" value={life} max={LIFE_MAX} tone="bg-[#A5D6A7]" />
        <EnergyBar label="Энергия в движении 🔥" value={move} max={MOVE_MAX} tone="bg-ink" />
        <Text className="text-[12px] leading-5 text-mute">
          Баланс мягкий. Можно добавить перекус или воду — полоса жизни чуть наполнится.
        </Text>
      </View>

      <View className="mt-10 flex-row justify-between">
        <RoundAction label={"+ Перекус"} onPress={() => add(8)} />
        <RoundAction label={"+ Обед"} onPress={() => add(18)} />
        <RoundAction label={"+ Вода"} onPress={() => add(4)} />
      </View>
    </View>
  );
}
