import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
import { ScreenHeader } from "../../ui/kit";
import { useAuth } from "../auth/AuthContext";

const LIFE_MAX = 100;
const MOVE_MAX = 100;

function EnergyBar({ label, value, max, tone }) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[14px] font-medium text-ink">{label}</Text>
        <Text className="text-[12px] font-semibold text-mute">
          {Math.round(value)} / {max}
        </Text>
      </View>
      <View className="h-[8px] overflow-hidden rounded-full bg-canvas">
        <View className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </View>
    </View>
  );
}

function RoundAction({ label, onPress, mint }) {
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
        <View
          className={`h-[92px] w-[92px] items-center justify-center rounded-full px-3 ${mint ? "bg-mint" : "bg-card"}`}
        >
          <Text className="text-center text-[13px] font-semibold leading-4 text-ink">{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CaloriesScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [life, setLife] = useState(38);
  const [move] = useState(54);
  const caresFood = Boolean(user?.goals?.includes("nutrition"));

  const add = (amount) => {
    setLife((value) => Math.min(LIFE_MAX, value + amount));
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Топливо"
          subtitle={
            caresFood
              ? "Еда и вода как забота, не как калорийный суд."
              : "Фокус на движении. Достаточно воды и мягкого баланса сил."
          }
        />

        <View className="rounded-[28px] bg-card px-5 py-7">
          <EnergyBar label="Энергия для жизни" value={life} max={LIFE_MAX} tone="bg-mint" />
          <EnergyBar label="Энергия в движении" value={move} max={MOVE_MAX} tone="bg-accent" />
          <Text className="text-[13px] leading-5 text-mute">
            {caresFood
              ? "Перекус и обед чуть наполняют полосу жизни. Без вины за порцию."
              : "Движение уже в плане. Здесь достаточно воды, если не хочешь трогать еду."}
          </Text>
        </View>

        <View className={`mt-8 flex-row ${caresFood ? "justify-between" : "justify-center"}`}>
          {caresFood ? (
            <>
              <RoundAction label={"+ Перекус"} onPress={() => add(8)} mint />
              <RoundAction label={"+ Обед"} onPress={() => add(18)} mint />
              <RoundAction label={"+ Вода"} onPress={() => add(4)} />
            </>
          ) : (
            <RoundAction label={"+ Вода"} onPress={() => add(6)} mint />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
