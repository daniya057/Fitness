import { Text, View } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { lookOfFood, MACRO_TONE } from "./look";

function MacroBadge({ kind, value }) {
  const tone = MACRO_TONE[kind];
  return (
    <View className="rounded-full px-2 py-1" style={{ backgroundColor: tone.fill }}>
      <Text className="text-[11px] font-semibold" style={{ color: tone.ink }}>
        {tone.label} {value}
      </Text>
    </View>
  );
}

export function MacroBadges({ protein, fat, carbs, extra }) {
  return (
    <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: 6 }}>
      <MacroBadge kind="protein" value={protein} />
      <MacroBadge kind="fat" value={fat} />
      <MacroBadge kind="carbs" value={carbs} />
      {extra ? <Text className="text-[11px] text-white/45">{extra}</Text> : null}
    </View>
  );
}

export function FoodCard({ food, hint, action, onPress, onAction, disabled }) {
  const look = lookOfFood(food);
  const add = action === "add";
  const body = (
    <>
      <View
        className="mr-3 h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: look.tint }}
      >
        <Text className="text-[22px] leading-7">{look.emoji}</Text>
      </View>
      <View className="mr-2 flex-1">
        <Text className="text-[15px] font-semibold leading-5 text-white" numberOfLines={2}>
          {food.name || food.label}
        </Text>
        <Text className="mt-0.5 text-[12px] text-white/55">
          {hint || `${Math.round(food.kcal)} ккал / 100 г`}
        </Text>
        <MacroBadges protein={food.protein} fat={food.fat} carbs={food.carbs} />
      </View>
    </>
  );

  return (
    <View className="mb-2 flex-row items-center rounded-[22px] px-3 py-3" style={glassStyle({ variant: "fill", borderRadius: 22 })}>
      {onPress ? (
        <SoftPress
          sheen={false}
          onPress={onPress}
          className="min-h-[56px] flex-1 flex-row items-center"
          style={{ alignItems: "center", justifyContent: "flex-start", overflow: "visible" }}
        >
          {body}
        </SoftPress>
      ) : (
        <View className="min-h-[56px] flex-1 flex-row items-center">{body}</View>
      )}
      <SoftPress
        onPress={onAction}
        disabled={disabled}
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          backgroundColor: add ? getPalette().accent : "rgba(255,255,255,0.1)",
        }}
      >
        {add ? (
          <Plus size={22} color="#07140F" strokeWidth={2.4} />
        ) : (
          <Minus size={20} color="#F4FFF8" strokeWidth={2.4} />
        )}
      </SoftPress>
    </View>
  );
}
