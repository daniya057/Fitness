import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PillButton, PrimaryButton, ScreenHeader, SectionLabel } from "../../ui/kit";
import { SoftPress } from "../../ui/SoftPress";
import { glassStyle } from "../../ui/Glass";
import { getPalette } from "../../ui/theme";
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
      <Text className="text-[22px] font-semibold text-white">{value}</Text>
      <Text className="mt-1 text-[11px] text-white/55">
        {label}
        {unit ? `, ${unit}` : ""}
      </Text>
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
        <ScreenHeader glass title="Калории" subtitle={targetHint(target)} />

        <View className="rounded-[28px] px-5 py-7" style={glassStyle({ borderRadius: 28 })}>
          <Text className="text-[13px] font-medium text-white/55">Сегодня</Text>
          <View className="mt-1 flex-row items-end">
            <Text className="text-[42px] font-semibold leading-[46px] text-white">{totals.kcal}</Text>
            <Text className="mb-1.5 ml-2 text-[16px] text-white/55">/ {target.kcal} ккал</Text>
          </View>
          <View className="mt-4 h-[10px] overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <View className="h-full rounded-full" style={{ width: `${fill}%`, backgroundColor: getPalette().bar }} />
          </View>
          {target.guessedSex ? (
            <Text className="mt-3 text-[13px] leading-5 text-white/55">
              Укажи пол в профиле — ориентир станет точнее.
            </Text>
          ) : null}
          <View className="mt-5 flex-row">
            <MacroCell label="Белки" value={totals.protein} unit="г" />
            <MacroCell label="Жиры" value={totals.fat} unit="г" />
            <MacroCell label="Углеводы" value={totals.carbs} unit="г" />
          </View>
        </View>

        <View className="mt-10">
          <SectionLabel glass>Дневник</SectionLabel>
          <View className="flex-row items-center">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Яблоко, гречка, курица…"
              placeholderTextColor="#8A8A8A"
              className="mr-2 flex-1 rounded-2xl px-4 py-3.5 text-[16px] text-white"
              style={glassStyle({ borderRadius: 16 })}
            />
            <PillButton label="Сканер" tone="glassOn" onPress={() => setScanOpen(true)} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
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

          {picked && portion ? (
            <View ref={portionRef} className="mt-4 rounded-[28px] px-5 py-6" style={glassStyle({ borderRadius: 28, backgroundColor: "rgba(125,255,179,0.1)" })}>
              <Text className="text-[18px] font-semibold text-white">{picked.name}</Text>
              <Text className="mt-1 text-[13px] text-white/55">
                На 100 г: {Math.round(picked.kcal)} ккал · Б {picked.protein} · Ж {picked.fat} · У {picked.carbs}
                {picked.source === "guess" ? " · ориентир по названию пачки, не с этикетки" : ""}
                {picked.source === "list" ? " · название с Barcode List, КБЖУ на этикетке не нашли" : ""}
              </Text>
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

          {found.length > 0 ? (
            <View className="mt-4 overflow-hidden rounded-[24px]" style={glassStyle({ borderRadius: 24 })}>
              {found.map((food, index) => (
                <SoftPress
                  key={`${food.id}-${index}`}
                  onPress={() => revealPortion(food)}
                  className="px-4 py-3.5"
                  style={index < found.length - 1 ? { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" } : undefined}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="mr-3 flex-1 text-[15px] text-white">{food.name}</Text>
                    <Text className="text-[13px] font-medium text-white/55">{Math.round(food.kcal)} ккал</Text>
                  </View>
                  <Text className="mt-1 text-[12px] text-white/45">
                    на 100 г · Б {food.protein} · Ж {food.fat} · У {food.carbs}
                    {sourceLabel(food) ? ` · ${sourceLabel(food)}` : ""}
                  </Text>
                </SoftPress>
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
            <View className="overflow-hidden rounded-[24px]" style={glassStyle({ borderRadius: 24 })}>
              {items.map((item, index) => (
                <View
                  key={item.id || `${item.foodId}-${index}`}
                  className="flex-row items-center justify-between px-4 py-3.5"
                  style={index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" } : undefined}
                >
                  <View className="mr-3 flex-1">
                    <Text className="text-[15px] text-white">{item.label}</Text>
                    <Text className="mt-1 text-[12px] text-white/50">
                      {item.grams} г · {Math.round(item.kcal)} ккал
                    </Text>
                  </View>
                  <SoftPress onPress={() => removeItem(item.id)} className="rounded-full px-3 py-2" style={glassStyle({ variant: "fill", borderRadius: 999 })}>
                    <Text className="text-[12px] font-medium text-white/70">Убрать</Text>
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
            setScanOpen(false);
            setError("");
            revealPortion(food);
          }}
        />
      ) : null}
    </View>
  );
}
