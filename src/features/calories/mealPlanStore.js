import { create } from "zustand";
import { buildMealPlan } from "./mealPlan";
import { utcDay } from "./foods";

// Рацион живёт в памяти на день: при смене вкладок не пропадает,
// на следующие сутки собирается заново по кнопке. Там же — свёрнут ли он
// и какие блюда уже отправлены в дневник.
export const useMealPlan = create((set, get) => ({
  plan: null,
  userId: null,
  collapsed: false,
  addedIds: [],

  current(user) {
    const { plan, userId } = get();
    if (!plan || userId !== user?.id || plan.date !== utcDay()) {
      return null;
    }
    return plan;
  },

  compose(user) {
    const plan = buildMealPlan(user, { attempt: 0 });
    set({ plan, userId: user?.id || null, collapsed: false, addedIds: [] });
    return plan;
  },

  reroll(user) {
    const prev = get().current(user);
    const attempt = prev ? prev.attempt + 1 : 0;
    const exclude = prev ? prev.meals.map((meal) => meal.id) : [];
    const plan = buildMealPlan(user, { attempt, exclude });
    set({ plan, userId: user?.id || null, collapsed: false, addedIds: [] });
    return plan;
  },

  toggleCollapsed() {
    set({ collapsed: !get().collapsed });
  },

  markAdded(id) {
    const { addedIds } = get();
    if (!addedIds.includes(id)) {
      set({ addedIds: [...addedIds, id] });
    }
  },

  clear() {
    set({ plan: null, userId: null, collapsed: false, addedIds: [] });
  },
}));
