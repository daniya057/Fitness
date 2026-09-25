import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PillButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { SoftPress } from "../../ui/SoftPress";
import { useAuth } from "../auth/AuthContext";
import { BarcodeScan } from "./BarcodeScan";
import {
  FOOD_CATEGORIES,
  makeLogItem,
  macrosForGrams,
  mergeFoodLists,
  searchFoods,
  searchRemoteFoods,
  sourceLabel,
  sumLog,
  utcDay,
} from "./foods";
import { dailyKcalTarget, targetHint } from "./target";

function MacroCell({ label, value, unit }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-[22px] font-semibold text-ink">{value}</Text>
      <Text className="mt-1 text-[11px] text-mute">
        {label}
        {unit ? `, ${unit}` : ""}
      </Text>
    </View>
  );
}

function GramCounter({ value, onChange }) {
  const bump = (delta) => {
    const next = Math.max(10, Math.min(500, value + delta));
    onChange(next);
  };

  return (
    <View className="mb-5">
      <Text className="mb-2 text-[13px] font-medium text-mute">Вес порции</Text>
      <View className="flex-row items-center justify-between">
        <SoftPress
          onPress={() => bump(-10)}
          className="h-14 w-14 items-center justify-center rounded-full bg-canvas"
        >
          <Text className="text-[28px] leading-8 text-ink">−</Text>
        </SoftPress>
        <Text className="text-[32px] font-semibold text-ink">
          {value} <Text className="text-[16px] font-medium text-mute">г</Text>
        </Text>
        <SoftPress
          onPress={() => bump(10)}
          className="h-14 w-14 items-center justify-center rounded-full bg-canvas"
        >
          <Text className="text-[28px] leading-8 text-ink">+</Text>
        </SoftPress>
      </View>
    </View>
  );
}

export default function CaloriesScreen() {
  const insets = useSafeAreaInsets();
  const { user, patch } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [picked, setPicked] = useState(null);
  const [grams, setGrams] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [remote, setRemote] = useState([]);
  const [searching, setSearching] = useState(false);

  const today = utcDay();
  const items = user?.fuelLog?.date === today ? user.fuelLog.items || [] : [];
  const totals = useMemo(() => sumLog(items), [items]);
  const local = useMemo(() => searchFoods(query, category), [query, category]);
  const found = useMemo(
    () => mergeFoodLists(local, query.trim().length >= 2 ? remote : []),
    [local, remote, query]
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemote([]);
      setSearching(false);
      return undefined;
    }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(() => {
      searchRemoteFoods(q)
        .then((foods) => {
          if (alive) {
            setRemote(foods);
          }
        })
        .catch(() => {
          if (alive) {
            setRemote([]);
          }
        })
        .finally(() => {
          if (alive) {
            setSearching(false);
          }
        });
    }, 320);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);
  const portion = picked ? macrosForGrams(picked, grams) : null;
  const target = useMemo(() => dailyKcalTarget(user), [user]);
  const fill = Math.max(4, Math.min(100, (totals.kcal / (target.kcal || 1)) * 100));
  const over = totals.kcal > target.kcal;

  const saveItems = async (nextItems) => {
    setBusy(true);
    setError("");
    try {
      await patch({ fuelLog: { date: today, items: nextItems } });
    } catch (err) {
      setError(err.message || "Не вышло сохранить дневник");
    } finally {
      setBusy(false);
    }
  };

  const addFood = (food, portionGrams) => {
    if (!food || busy) {
      return;
    }
    saveItems([...items, makeLogItem(food, portionGrams)]);
  };

  const removeItem = (id) => {
    saveItems(items.filter((item) => item.id !== id));
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Топливо" subtitle={targetHint(target)} />

        <View className="rounded-[28px] bg-card px-5 py-7">
          <Text className="text-[13px] font-medium text-mute">Сегодня</Text>
          <View className="mt-1 flex-row items-end">
            <Text className="text-[42px] font-semibold leading-[46px] text-ink">{totals.kcal}</Text>
            <Text className="mb-1.5 ml-2 text-[16px] text-mute">/ {target.kcal} ккал</Text>
          </View>
          <View className="mt-4 h-[10px] overflow-hidden rounded-full bg-canvas">
            <View className="h-full rounded-full bg-mint" style={{ width: `${fill}%`, backgroundColor: "#A8E6CF" }} />
          </View>
          <Text className="mt-3 text-[13px] leading-5 text-mute">
            {over
              ? "Сегодня плотнее ориентира — ок. День ещё не оценка."
              : target.guessedSex
                ? "Укажи пол в профиле — ориентир станет точнее."
                : "Ориентир, не суд."}
          </Text>
          <View className="mt-5 flex-row">
            <MacroCell label="Белки" value={totals.protein} unit="г" />
            <MacroCell label="Жиры" value={totals.fat} unit="г" />
            <MacroCell label="Углеводы" value={totals.carbs} unit="г" />
          </View>
        </View>

        <View className="mt-10">
          <SectionLabel>Дневник</SectionLabel>
          <View className="flex-row items-center">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Яблоко, гречка, курица…"
              placeholderTextColor="#9E9E9E"
              className="mr-2 flex-1 rounded-2xl bg-card px-4 py-3.5 text-[16px] text-ink"
            />
            <PillButton label="Сканер" tone="mint" onPress={() => setScanOpen(true)} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            <PillButton
              label="Все"
              tone={category === "all" ? "mint" : "canvas"}
              onPress={() => setCategory("all")}
            />
            {FOOD_CATEGORIES.map((item) => (
              <PillButton
                key={item.id}
                label={item.title}
                tone={category === item.id ? "mint" : "canvas"}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </ScrollView>

          {found.length > 0 ? (
            <View className="mt-4 overflow-hidden rounded-[24px] bg-card">
              {found.map((food, index) => (
                <SoftPress
                  key={`${food.id}-${index}`}
                  onPress={() => {
                    setPicked(food);
                    setGrams(100);
                  }}
                  className={`px-4 py-3.5 ${index < found.length - 1 ? "border-b border-ink/5" : ""}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="mr-3 flex-1 text-[15px] text-ink">{food.name}</Text>
                    <Text className="text-[13px] font-medium text-mute">{Math.round(food.kcal)} ккал</Text>
                  </View>
                  <Text className="mt-1 text-[12px] text-mute">
                    на 100 г · Б {food.protein} · Ж {food.fat} · У {food.carbs}
                    {sourceLabel(food) ? ` · ${sourceLabel(food)}` : ""}
                  </Text>
                </SoftPress>
              ))}
            </View>
          ) : (
            <Text className="mt-4 text-[13px] leading-5 text-mute">
              {searching
                ? "Ищем в таблицах и магазинах…"
                : query.trim() || category !== "all"
                  ? "Ничего не нашлось. Попробуй другое слово или сканер."
                  : "Начни вводить название или выбери категорию."}
            </Text>
          )}
        </View>

        {picked && portion ? (
          <View className="mt-6 rounded-[28px] bg-mint px-5 py-6">
            <Text className="text-[18px] font-semibold text-ink">{picked.name}</Text>
            <Text className="mt-1 text-[13px] text-mute">
              На 100 г: {Math.round(picked.kcal)} ккал · Б {picked.protein} · Ж {picked.fat} · У {picked.carbs}
            </Text>
            <View className="mt-5">
              <GramCounter value={grams} onChange={setGrams} />
            </View>
            <View className="mb-5 flex-row">
              <MacroCell label="ккал" value={portion.kcal} />
              <MacroCell label="Б" value={portion.protein} />
              <MacroCell label="Ж" value={portion.fat} />
              <MacroCell label="У" value={portion.carbs} />
            </View>
            <PrimaryButton
              label="В дневник"
              busy={busy}
              onPress={() => {
                addFood(picked, grams);
                setPicked(null);
                setQuery("");
              }}
            />
          </View>
        ) : null}

        <View className="mt-8">
          <SectionLabel>За сегодня</SectionLabel>
          {items.length === 0 ? (
            <Text className="text-[14px] leading-5 text-mute">Пока пусто. Это нормально — день ещё идёт.</Text>
          ) : (
            <View className="overflow-hidden rounded-[24px] bg-card">
              {items.map((item, index) => (
                <View
                  key={item.id || `${item.foodId}-${index}`}
                  className={`flex-row items-center justify-between px-4 py-3.5 ${
                    index < items.length - 1 ? "border-b border-ink/5" : ""
                  }`}
                >
                  <View className="mr-3 flex-1">
                    <Text className="text-[15px] text-ink">{item.label}</Text>
                    <Text className="mt-1 text-[12px] text-mute">
                      {item.grams} г · {Math.round(item.kcal)} ккал
                    </Text>
                  </View>
                  <SoftPress onPress={() => removeItem(item.id)} className="rounded-full bg-canvas px-3 py-2">
                    <Text className="text-[12px] font-medium text-mute">Убрать</Text>
                  </SoftPress>
                </View>
              ))}
            </View>
          )}
        </View>

        {error ? <Text className="mt-4 text-[13px] text-accent">{error}</Text> : null}
      </ScrollView>
      {scanOpen ? (
        <BarcodeScan
          onClose={() => setScanOpen(false)}
          onFood={(food) => {
            setPicked(food);
            setGrams(100);
            setScanOpen(false);
            setError("");
          }}
        />
      ) : null}
    </View>
  );
}
