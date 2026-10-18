import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScanLine } from "lucide-react-native";
import { PillButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
import { FadeEdge } from "../../ui/layout";
import { ProfileChip } from "../avatar/ProfileChip";
import { useAuth } from "../auth/AuthContext";
import { BarcodeScan } from "./BarcodeScan";
import { FoodCard, MacroBadges } from "./FoodCard";
import {
  FOOD_CATEGORIES,
  foodById,
  makeLogItem,
  macrosForGrams,
  mergeFoodLists,
  searchFoods,
  searchRemoteFoods,
  sourceLabel,
  sumLog,
  utcDay,
} from "./foods";
import { FoodSkipCard } from "./FoodSkipCard";
import { MealPlanCard } from "./MealPlanCard";
import { dailyKcalTarget, targetHint } from "./target";

function DayTotals({ totals, target, fill, guessedSex }) {
  return (
    <View className="rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
      <Text className="text-[13px] font-medium text-white/55">Итого за день</Text>
      <View className="mt-1 flex-row items-end">
        <Text className="text-[42px] font-semibold leading-[46px] text-white">{totals.kcal}</Text>
        <Text className="mb-1.5 ml-2 text-[16px] text-white/55">/ {target.kcal} ккал</Text>
      </View>
      <View className="mt-4 h-[10px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
        <View className="h-full rounded-full" style={{ width: `${fill}%`, backgroundColor: getPalette().bar }} />
      </View>
      {guessedSex ? (
        <Text className="mt-3 text-[13px] leading-5 text-white/55">Укажи пол в профиле — ориентир станет точнее.</Text>
      ) : null}
      <MacroBadges protein={totals.protein} fat={totals.fat} carbs={totals.carbs} />
    </View>
  );
}

function GramCounter({ value, onChange }) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const applyText = (text) => {
    const digits = String(text).replace(/\D/g, "");
    setDraft(digits);
    if (!digits) {
      return;
    }
    const next = Number(digits);
    if (next >= 1) {
      onChange(next);
    }
  };

  const bump = (delta) => {
    onChange(Math.max(1, value + delta));
  };

  return (
    <View className="mb-5">
      <Text className="mb-2 text-[13px] font-medium text-white/55">Вес порции</Text>
      <View className="flex-row items-center justify-between">
        <SoftPress
          onPress={() => bump(-10)}
          className="h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={glassStyle({ variant: "fill", borderRadius: 999 })}
        >
          <Text className="text-[28px] leading-8 text-white">−</Text>
        </SoftPress>
        <View className="mx-3 h-14 flex-1 flex-row items-center justify-center rounded-2xl px-3" style={glassStyle({ variant: "fill", borderRadius: 16 })}>
          <TextInput
            value={draft}
            onChangeText={applyText}
            onBlur={() => {
              if (!draft || Number(draft) < 1) {
                setDraft(String(value));
              }
            }}
            keyboardType="number-pad"
            className="text-center text-[32px] font-semibold text-white"
            style={{ width: Math.max(72, String(draft || value).length * 22), flexGrow: 0 }}
          />
          <Text className="text-[16px] font-medium text-white/55">г</Text>
        </View>
        <SoftPress
          onPress={() => bump(10)}
          className="h-14 w-14 shrink-0 items-center justify-center rounded-full"
          style={glassStyle({ variant: "fill", borderRadius: 999 })}
        >
          <Text className="text-[28px] leading-8 text-white">+</Text>
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
  const scrollRef = useRef(null);
  const portionRef = useRef(null);

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

  const scrollToPortion = () => {
    const scroller = scrollRef.current;
    const card = portionRef.current;
    if (!scroller || !card) {
      return;
    }
    const host = typeof scroller.getInnerViewNode === "function" ? scroller.getInnerViewNode() : scroller;
    if (typeof card.measureLayout === "function" && host) {
      card.measureLayout(
        host,
        (_x, y) => {
          scroller.scrollTo({ y: Math.max(0, y - 12), animated: true });
        },
        () => {
          if (typeof card.scrollIntoView === "function") {
            card.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      );
      return;
    }
    if (typeof card.scrollIntoView === "function") {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const revealPortion = (food) => {
    setPicked(food);
    setGrams(100);
    setTimeout(scrollToPortion, 60);
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
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: "transparent" }}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader glass title="Калории" subtitle={targetHint(target)} right={<ProfileChip />} />

        <DayTotals totals={totals} target={target} fill={fill} guessedSex={target.guessedSex} />
        {user?.quizDone && !user.quiz?.foodSkipSet ? (
          <FoodSkipCard user={user} />
        ) : (
          <MealPlanCard user={user} busy={busy} onAddItem={(item) => saveItems([...items, item])} />
        )}

        <View className="mt-10">
          <SectionLabel glass>Дневник</SectionLabel>
          <View className="flex-row items-center">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Яблоко, гречка, курица…"
              placeholderTextColor="#8A8A8A"
              className="mr-2 flex-1 rounded-2xl px-4 text-[16px] text-white"
              style={[glassStyle({ borderRadius: 16 }), { minHeight: 48 }]}
            />
            <SoftPress
              onPress={() => setScanOpen(true)}
              className="items-center justify-center rounded-2xl"
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: getPalette().accent,
              }}
            >
              <ScanLine size={22} color="#07140F" strokeWidth={2.2} />
            </SoftPress>
          </View>
          <View className="relative mt-3 overflow-hidden">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 28 }}
            >
              <PillButton
                label="Все"
                tone={category === "all" ? "glassOn" : "glass"}
                onPress={() => setCategory("all")}
              />
              {FOOD_CATEGORIES.map((item) => (
                <PillButton
                  key={item.id}
                  label={item.title}
                  tone={category === item.id ? "glassOn" : "glass"}
                  onPress={() => setCategory(item.id)}
                />
              ))}
            </ScrollView>
            <FadeEdge />
          </View>

          {picked && portion ? (
            <View ref={portionRef} className="mt-4 rounded-[24px] px-5 py-6" style={glassStyle({ borderRadius: 24, backgroundColor: "rgba(125,255,179,0.1)" })}>
              <Text className="text-[18px] font-semibold text-white">{picked.name}</Text>
              <Text className="mt-1 text-[13px] text-white/55">
                На 100 г: {Math.round(picked.kcal)} ккал
                {picked.source === "guess" ? " · ориентир по названию пачки, не с этикетки" : ""}
                {picked.source === "list" ? " · название с Barcode List, КБЖУ на этикетке не нашли" : ""}
              </Text>
              <MacroBadges protein={picked.protein} fat={picked.fat} carbs={picked.carbs} />
              <View className="mt-5">
                <GramCounter key={picked.id || picked.name} value={grams} onChange={setGrams} />
              </View>
              {picked.packGrams ? (
                <SoftPress
                  onPress={() => setGrams(Math.round(Number(picked.packGrams)))}
                  className="mb-5 items-center rounded-full py-3"
                  style={glassStyle({ variant: "fill", borderRadius: 999 })}
                >
                  <Text className="text-[15px] font-semibold text-white">
                    Вся пачка · {picked.packGrams} {picked.packUnit === "ml" ? "мл" : "г"}
                  </Text>
                </SoftPress>
              ) : null}
              <View className="mb-5">
                <Text className="mb-2 text-[13px] text-white/55">{portion.kcal} ккал в порции</Text>
                <MacroBadges protein={portion.protein} fat={portion.fat} carbs={portion.carbs} />
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

          {found.length > 0 ? (
            <View className="mt-4">
              {found.map((food, index) => (
                <FoodCard
                  key={`${food.id}-${index}`}
                  food={food}
                  hint={`${Math.round(food.kcal)} ккал / 100 г${sourceLabel(food) ? ` · ${sourceLabel(food)}` : ""}`}
                  action="add"
                  disabled={busy}
                  onPress={() => revealPortion(food)}
                  onAction={() => addFood(food, 100)}
                />
              ))}
            </View>
          ) : (
            <Text className="mt-4 text-[13px] leading-5 text-white/55">
              {searching
                ? "Ищем в таблицах и магазинах…"
                : query.trim() || category !== "all"
                  ? "Ничего не нашлось. Попробуй другое слово или сканер."
                  : "Начни вводить название или выбери категорию."}
            </Text>
          )}
        </View>

        <View className="mt-8">
          <SectionLabel glass>За сегодня</SectionLabel>
          {items.length === 0 ? (
            <Text className="text-[14px] leading-5 text-white/55">Пока пусто. Это нормально — день ещё идёт.</Text>
          ) : (
            items.map((item, index) => {
              const catalog = foodById(item.foodId);
              return (
                <FoodCard
                  key={item.id || `${item.foodId}-${index}`}
                  food={{
                    name: item.label,
                    category: item.category || catalog?.category,
                    protein: item.protein,
                    fat: item.fat,
                    carbs: item.carbs,
                    kcal: item.kcal,
                  }}
                  hint={`${item.grams} г · ${Math.round(item.kcal)} ккал`}
                  action="remove"
                  disabled={busy}
                  onAction={() => removeItem(item.id)}
                />
              );
            })
          )}
        </View>

        {error ? <Text className="mt-4 text-[13px] text-accent">{error}</Text> : null}
      </ScrollView>
      {scanOpen ? (
        <BarcodeScan
          onClose={() => setScanOpen(false)}
          onFood={(food) => {
            setScanOpen(false);
            setError("");
            revealPortion(food);
          }}
        />
      ) : null}
    </View>
  );
}
