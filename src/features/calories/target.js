function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function activityFactor(daysPerWeek) {
  const days = Number(daysPerWeek) || 3;
  if (days <= 2) {
    return 1.375;
  }
  if (days >= 6) {
    return 1.725;
  }
  return 1.55;
}

export function dailyKcalTarget(user) {
  const kg = Number(user?.weight?.current);
  const goalKg = Number(user?.weight?.goal);
  const cm = Number(user?.heightCm);
  const age = Number(user?.age);
  const sex = user?.sex;
  const guessedSex = sex !== "male" && sex !== "female";

  if (!Number.isFinite(kg) || !Number.isFinite(cm) || !Number.isFinite(age) || age < 10) {
    return { kcal: 2000, mode: "hold", guessedSex: true };
  }

  const offset = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + offset;
  const tdee = bmr * activityFactor(user?.daysPerWeek);
  const delta = (Number.isFinite(goalKg) ? goalKg : kg) - kg;

  let mode = "hold";
  let kcal = tdee;

  if (delta < -0.5) {
    mode = "lose";
    kcal = tdee - clamp(Math.abs(delta) * 40, 200, 500);
  } else if (delta > 0.5) {
    mode = "gain";
    const shift = Math.min(clamp(Math.abs(delta) * 40, 200, 500), 400);
    kcal = tdee + shift;
  }

  if (mode === "lose") {
    const floor = sex === "male" ? 1500 : sex === "female" ? 1200 : 1350;
    kcal = Math.max(floor, kcal);
  }

  return {
    kcal: Math.round(kcal),
    mode,
    guessedSex,
  };
}

export function targetHint(target) {
  if (target.mode === "lose") {
    return "Мягкий дефицит к желаемому весу. Ориентир, не суд.";
  }
  if (target.mode === "gain") {
    return "Небольшой запас к набору. Ориентир, не суд.";
  }
  return "Поддержание. Ориентир, не суд.";
}
