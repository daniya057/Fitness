import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Plus, X } from "lucide-react-native";
import { glassStyle } from "../../ui/Glass";
import { SoftPress } from "../../ui/SoftPress";
import { getPalette } from "../../ui/theme";
import recipes from "../../../data/content/recipes.json";
import { foldName, searchFoods } from "./foods";
import { parseFoodSkipList } from "./foodSkip";

export function FoodSkipEditor({ values, onChange }) {
  const chips = parseFoodSkipList(values);
  const [draft, setDraft] = useState("");
  const suggestions = useMemo(() => {
    const q = draft.trim();
    if (q.length < 2) {
      return [];
    }
    const taken = new Set(chips.map((item) => item.toLowerCase()));
    const foods = searchFoods(q)
      .filter((food) => !taken.has(String(food.name || "").toLowerCase()))
      .slice(0, 4)
      .map((food) => ({ id: food.id, name: food.name, kind: "food" }));
    const needle = foldName(q);
    const dishes = recipes.recipes
      .filter((recipe) => foldName(recipe.title).includes(needle) && !taken.has(recipe.title.toLowerCase()))
      .slice(0, 3)
      .map((recipe) => ({ id: `dish-${recipe.id}`, name: recipe.title, kind: "dish" }));
    return [...dishes, ...foods].slice(0, 6);
  }, [draft, chips]);

  const add = (raw) => {
    const next = parseFoodSkipList([...chips, raw]);
    if (next.length === chips.length) {
      return;
    }
    onChange(next);
    setDraft("");
  };

  const submitDraft = () => {
    const parts = String(draft || "").split(/[,;]+/).map((item) => item.trim()).filter(Boolean);
    if (!parts.length) {
      return;
    }
    onChange(parseFoodSkipList([...chips, ...parts]));
    setDraft("");
  };

  const remove = (label) => {
    onChange(chips.filter((item) => item !== label));
  };

  const full = chips.length >= 12;

  return (
    <View>
      {chips.length ? (
        <View className="mb-3 flex-row flex-wrap" style={{ gap: 8 }}>
          {chips.map((label) => (
            <View
              key={label}
              className="flex-row items-center rounded-full px-3"
              style={{ ...glassStyle({ variant: "fill", borderRadius: 999, backgroundColor: "rgba(125,255,179,0.16)" }), minHeight: 40 }}
            >
              <Text className="mr-1 max-w-[200px] text-[14px] font-semibold text-white" numberOfLines={1}>
                {label}
              </Text>
              <SoftPress sheen={false} onPress={() => remove(label)} className="h-8 w-8 items-center justify-center">
                <X size={16} color="#F4FFF8" strokeWidth={2.4} />
              </SoftPress>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={full ? "Хватит 12 продуктов" : "Например, гречка"}
          placeholderTextColor="#8A8A8A"
          editable={!full}
          onSubmitEditing={submitDraft}
          returnKeyType="done"
          className="mr-2 flex-1 rounded-2xl px-4 text-[16px] text-white"
          style={[glassStyle({ variant: "fill", borderRadius: 16 }), { minHeight: 48 }]}
        />
        <SoftPress
          onPress={submitDraft}
          disabled={full || !draft.trim()}
          className="items-center justify-center rounded-2xl"
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: full || !draft.trim() ? "rgba(255,255,255,0.1)" : getPalette().accent,
          }}
        >
          <Plus size={22} color={full || !draft.trim() ? "#F4FFF8" : "#07140F"} strokeWidth={2.4} />
        </SoftPress>
      </View>

      {suggestions.length ? (
        <View className="mt-2">
          {suggestions.map((food) => (
            <SoftPress
              key={food.id}
              sheen={false}
              onPress={() => add(food.name)}
              className="mt-1 rounded-[16px] px-3 py-3"
              style={glassStyle({ variant: "fill", borderRadius: 16 })}
            >
              <Text className="text-[15px] font-semibold text-white" numberOfLines={1}>
                {food.name}
              </Text>
              <Text className="mt-0.5 text-[12px] text-white/45">{food.kind === "dish" ? "блюдо" : "продукт"}</Text>
            </SoftPress>
          ))}
        </View>
      ) : null}

      <Text className="mt-3 text-[13px] leading-5 text-white/55">
        Продукт или блюдо. Плюс добавляет, крестик снимает.
      </Text>
    </View>
  );
}
