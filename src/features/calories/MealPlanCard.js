import { useState } from "react";
import { Text, View } from "react-native";
import { Ban, Check, ChefHat, ChevronDown, ChevronUp, Plus, RefreshCw, ShoppingBasket } from "lucide-react-native";
import { glassStyle } from "../../ui/Glass";
import { GhostButton, PrimaryButton } from "../../ui/kit";
import { SoftPress } from "../../ui/SoftPress";
import { getPalette } from "../../ui/theme";
import { useAuth } from "../auth/AuthContext";
import { MacroBadges } from "./FoodCard";
import { persistFoodSkip } from "./FoodSkipCard";
import { FoodSkipEditor } from "./FoodSkipEditor";
import { foodSkipLabel, parseFoodSkipList } from "./foodSkip";
import { lookOfFood } from "./look";
import { leftoverBudget, leftoverCopy, leftoverHeadline, formatPrice, mealLogItem } from "./mealPlan";
import { useMealPlan } from "./mealPlanStore";
import { macroTargets } from "../checkins/recommend";

const SLOT_EMOJI = {
  breakfast: "🌅",
  lunch: "🍲",
  dinner: "🌙",
  snack: "🍎",
};

function Ingredient({ item, last }) {
  const look = lookOfFood(item);
  return (
    <View
      className="flex-row items-center py-2"
      style={last ? null : { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}
    >
      <Text className="mr-2 text-[15px]">{look.emoji}</Text>
      <Text className="flex-1 text-[13px] leading-5 text-white/80" numberOfLines={1}>
        {item.name}
      </Text>
      <Text className="ml-2 w-[52px] text-right text-[13px] text-white/55">{item.grams} г</Text>
      <Text className="ml-2 w-[56px] text-right text-[13px] font-medium text-white/70">{formatPrice(item.price)}</Text>
    </View>
  );
}

function MealCard({ meal, added, busy, onAdd, onBan }) {
  return (
    <View className="mt-3 rounded-[22px] px-4 py-4" style={glassStyle({ variant: "fill", borderRadius: 22 })}>
      <View className="flex-row items-center">
        <Text className="mr-2 text-[18px]">{SLOT_EMOJI[meal.slot] || "🍽️"}</Text>
        <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">{meal.slotLabel.toUpperCase()}</Text>
        <View className="flex-1" />
        <Text className="text-[12px] text-white/45">~{meal.targetKcal} ккал</Text>
      </View>
      <Text className="mt-2 text-[17px] font-semibold leading-6 text-white">{meal.title}</Text>
      <View className="mt-2 flex-row items-center">
        <Text className="text-[22px] font-semibold text-white">{meal.kcal}</Text>
        <Text className="ml-1 text-[13px] text-white/55">ккал</Text>
        <View className="flex-1" />
        <View className="flex-row items-center rounded-full px-3 py-1.5" style={{ backgroundColor: "rgba(125,255,179,0.14)" }}>
          <ShoppingBasket size={14} color={getPalette().accent} strokeWidth={2.2} />
          <Text className="ml-1.5 text-[14px] font-semibold" style={{ color: getPalette().accent }}>
            {formatPrice(meal.price)}
          </Text>
        </View>
      </View>
      <MacroBadges protein={meal.protein} fat={meal.fat} carbs={meal.carbs} />

      <Text className="mt-4 text-[11px] font-medium tracking-[1.2px] text-white/45">ПРОДУКТЫ</Text>
      <View className="mt-1">
        {meal.ingredients.map((item, index) => (
          <Ingredient key={`${meal.id}-${item.foodId}`} item={item} last={index === meal.ingredients.length - 1} />
        ))}
      </View>

      <SoftPress
        onPress={onAdd}
        disabled={busy || added}
        className="mt-4 flex-row items-center justify-center rounded-full"
        style={{
          minHeight: 44,
          borderRadius: 999,
          backgroundColor: added ? "rgba(255,255,255,0.1)" : getPalette().accent,
        }}
      >
        <View className="flex-row items-center">
          {added ? (
            <Check size={18} color="#F4FFF8" strokeWidth={2.4} />
          ) : (
            <Plus size={18} color="#07140F" strokeWidth={2.4} />
          )}
          <Text className="ml-2 text-[14px] font-semibold" style={{ color: added ? "#F4FFF8" : "#07140F" }}>
            {added ? "В дневнике" : "Съел — в дневник"}
          </Text>
        </View>
      </SoftPress>
      <SoftPress
        sheen={false}
        onPress={onBan}
        disabled={busy}
        className="mt-2 flex-row items-center justify-center rounded-full"
        style={{ minHeight: 40 }}
      >
        <View className="flex-row items-center">
          <Ban size={15} color="rgba(255,255,255,0.55)" strokeWidth={2.2} />
          <Text className="ml-2 text-[13px] font-semibold text-white/55">Не предлагать это блюдо</Text>
        </View>
      </SoftPress>
    </View>
  );
}

function BlacklistPanel({ chips, onChange, busy, error, onSave, onClose }) {
  return (
    <View className="mt-4">
      <Text className="mb-3 text-[13px] leading-5 text-white/55">
        Продукты и блюда из списка рацион больше не предложит.
      </Text>
      <FoodSkipEditor values={chips} onChange={onChange} />
      {error ? <Text className="mt-3 text-[13px] text-accent">{error}</Text> : null}
      <View className="mt-4">
        <PrimaryButton glass label="Сохранить список" busy={busy} onPress={onSave} />
      </View>
      {onClose ? (
        <View className="mt-3">
          <GhostButton glass label="Скрыть" onPress={onClose} />
        </View>
      ) : null}
    </View>
  );
}

export function MealPlanCard({ user, busy, eatenKcal = 0, onAddItem }) {
  const { patch } = useAuth();
  const store = useMealPlan();
  const plan = store.current(user);
  const { addedIds, collapsed } = store;
  const leftover = leftoverBudget(macroTargets(user).kcal, eatenKcal);
  const [listOpen, setListOpen] = useState(false);
  const [chips, setChips] = useState(() => parseFoodSkipList(user?.quiz?.foodSkip));
  const [listBusy, setListBusy] = useState(false);
  const [listError, setListError] = useState("");

  if (!user?.quizDone) {
    return null;
  }

  const compose = () => store.compose(user, eatenKcal);
  const reroll = () => store.reroll(user, eatenKcal);

  const addMeal = (meal) => {
    if (busy || addedIds.includes(meal.id)) {
      return;
    }
    store.markAdded(meal.id);
    onAddItem?.(mealLogItem(meal));
  };

  const saveList = async (list, rebuild) => {
    setListBusy(true);
    setListError("");
    try {
      const next = parseFoodSkipList(list);
      setChips(next);
      await persistFoodSkip(patch, user, next, rebuild);
      setListOpen(false);
    } catch (err) {
      setListError(err.message || "Не сохранилось");
    } finally {
      setListBusy(false);
    }
  };

  const banMeal = (meal) => {
    saveList([...parseFoodSkipList(user?.quiz?.foodSkip), meal.title], true);
  };

  const openList = () => {
    setChips(parseFoodSkipList(user?.quiz?.foodSkip));
    setListOpen(true);
    setListError("");
  };

  if (!plan) {
    return (
      <View className="mt-4 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24, backgroundColor: "rgba(125,255,179,0.08)" })}>
        <View className="flex-row items-center">
          <View
            className="mr-3 h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "rgba(125,255,179,0.16)" }}
          >
            <ChefHat size={22} color={getPalette().accent} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-semibold text-white">
              {leftover.kind === "enough"
                ? "На сегодня хватит"
                : leftover.kind === "snack"
                  ? "Перекус"
                  : leftover.kind === "rest"
                    ? "Рацион на остаток"
                    : "Рацион на день"}
            </Text>
            <Text className="mt-0.5 text-[13px] leading-5 text-white/55">{leftoverCopy(leftover)}</Text>
          </View>
        </View>
        <View className="mt-4 flex-row items-center">
          <View className="mr-2 flex-1">
            <PrimaryButton
              glass
              label={leftover.kind === "enough" ? "Всё равно собрать" : leftover.kind === "snack" ? "Собрать перекус" : leftover.kind === "rest" ? "Собрать на остаток" : "Составить рацион"}
              onPress={compose}
            />
          </View>
          <SoftPress
            onPress={listOpen ? () => setListOpen(false) : openList}
            className="items-center justify-center rounded-full px-3"
            accessibilityLabel="Чёрный список"
            style={{
              minHeight: 52,
              borderRadius: 999,
              backgroundColor: listOpen ? "rgba(125,255,179,0.22)" : "rgba(255,255,255,0.1)",
            }}
          >
            <View className="flex-row items-center">
              <Ban size={16} color={listOpen ? getPalette().accent : "#F4FFF8"} strokeWidth={2.2} />
              <Text className="ml-1.5 text-[13px] font-semibold" style={{ color: listOpen ? getPalette().accent : "#F4FFF8" }}>
                Не предлагать
              </Text>
            </View>
          </SoftPress>
        </View>
        {listOpen ? (
          <BlacklistPanel
            chips={chips}
            onChange={setChips}
            busy={listBusy}
            error={listError}
            onSave={() => saveList(chips, false)}
            onClose={() => setListOpen(false)}
          />
        ) : null}
      </View>
    );
  }

  const count = plan.meals.length;
  const toggle = (
    <SoftPress
      sheen={false}
      onPress={store.toggleCollapsed}
      className="items-center justify-center rounded-full"
      style={{ ...glassStyle({ variant: "fill", borderRadius: 999 }), width: 40, height: 40 }}
    >
      {collapsed ? (
        <ChevronDown size={18} color="#F4FFF8" strokeWidth={2.4} />
      ) : (
        <ChevronUp size={18} color="#F4FFF8" strokeWidth={2.4} />
      )}
    </SoftPress>
  );

  if (collapsed) {
    return (
      <View className="mt-4 rounded-[24px] px-5 py-4" style={glassStyle({ borderRadius: 24 })}>
        <View className="flex-row items-center">
          <View className="flex-1 pr-3">
            <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">
              {plan.leftover?.kind === "rest" || plan.leftover?.kind === "snack" ? "ОСТАТОК ДНЯ" : "РАЦИОН"}
            </Text>
            <Text className="mt-1 text-[14px] text-white/80">
              {leftoverHeadline(plan)}
              {count > 0 ? ` · ≈ ${formatPrice(plan.totals.price)}` : ""}
            </Text>
          </View>
          {toggle}
        </View>
        <View className="mt-3">
          {plan.meals.map((meal, index) => {
            const added = addedIds.includes(meal.id);
            return (
              <View
                key={meal.id}
                className="flex-row items-center py-2"
                style={index === count - 1 ? null : { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}
              >
                <Text className="mr-2 text-[15px]">{SLOT_EMOJI[meal.slot] || "🍽️"}</Text>
                <Text
                  className="flex-1 text-[14px] leading-5"
                  style={{ color: added ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)" }}
                  numberOfLines={1}
                >
                  {meal.title}
                </Text>
                {added ? (
                  <Check size={16} color={getPalette().accent} strokeWidth={2.6} />
                ) : (
                  <Text className="ml-2 text-[13px] text-white/55">{meal.kcal} ккал</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View className="mt-4 rounded-[24px] px-5 py-5" style={glassStyle({ borderRadius: 24 })}>
      <View className="flex-row items-start">
        <View className="flex-1 pr-2">
          <Text className="text-[12px] font-medium tracking-[1.2px] text-white/55">
            {plan.leftover?.kind === "rest" || plan.leftover?.kind === "snack"
              ? "ОСТАТОК ДНЯ"
              : plan.leftover?.kind === "enough"
                ? "РАЦИОН"
                : "РАЦИОН"}
          </Text>
          <Text className="mt-1 text-[15px] leading-5 text-white/80">{leftoverHeadline(plan)}</Text>
        </View>
        {toggle}
      </View>
      <View className="mt-3 flex-row items-center">
        {count > 0 ? (
          <SoftPress
            onPress={reroll}
            className="mr-2 flex-row items-center rounded-full px-3"
            style={{ ...glassStyle({ variant: "fill", borderRadius: 999 }), minHeight: 40 }}
          >
            <View className="flex-row items-center">
              <RefreshCw size={15} color="#F4FFF8" strokeWidth={2.2} />
              <Text className="ml-1.5 text-[13px] font-semibold text-white">Другой</Text>
            </View>
          </SoftPress>
        ) : null}
        <SoftPress
          onPress={listOpen ? () => setListOpen(false) : openList}
          className="flex-1 items-center justify-center rounded-full px-3"
          accessibilityLabel="Чёрный список"
          style={{
            ...glassStyle({ variant: "fill", borderRadius: 999 }),
            minHeight: 40,
            backgroundColor: listOpen ? "rgba(125,255,179,0.22)" : undefined,
          }}
        >
          <View className="flex-row items-center">
            <Ban size={15} color={listOpen ? getPalette().accent : "#F4FFF8"} strokeWidth={2.2} />
            <Text className="ml-1.5 text-[13px] font-semibold" style={{ color: listOpen ? getPalette().accent : "#F4FFF8" }}>
              Не предлагать
            </Text>
          </View>
        </SoftPress>
      </View>

      {listOpen ? (
        <BlacklistPanel
          chips={chips}
          onChange={setChips}
          busy={listBusy}
          error={listError}
          onSave={() => saveList(chips, true)}
          onClose={() => setListOpen(false)}
        />
      ) : null}

      {plan.leftover && plan.leftover.kind !== "full" ? (
        <Text className="mt-3 text-[13px] leading-5 text-white/55">{leftoverCopy(plan.leftover)}</Text>
      ) : null}

      {plan.meals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          busy={busy || listBusy}
          added={addedIds.includes(meal.id)}
          onAdd={() => addMeal(meal)}
          onBan={() => banMeal(meal)}
        />
      ))}

      {count > 0 ? (
        <View className="mt-4 flex-row items-center justify-between rounded-[18px] px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <View>
            <Text className="text-[12px] text-white/55">Продукты на день</Text>
            <Text className="mt-0.5 text-[13px] text-white/70">
              Б {plan.totals.protein} · Ж {plan.totals.fat} · У {plan.totals.carbs}
            </Text>
          </View>
          <Text className="text-[20px] font-semibold text-white">≈ {formatPrice(plan.totals.price)}</Text>
        </View>
      ) : null}
      <Text className="mt-3 text-[12px] leading-4 text-white/45">
        {plan.leftover?.kind === "enough"
          ? "Если проголодаешься — добавь перекус в дневник вручную."
          : "Цены — ориентир по средним ценам магазинов, в твоём городе могут отличаться."}
        {foodSkipLabel(user?.quiz?.foodSkip)
          ? ` Не предлагаем: ${foodSkipLabel(user.quiz.foodSkip)}.`
          : plan.restricted
            ? " Блюда подобраны с учётом ограничений из опросника."
            : ""}{" "}
        Завтра соберётся новый набор.
      </Text>
    </View>
  );
}
