export const SCALE_MIN = 15;
export const SCALE_MAX = 40;
export const NORMAL_FROM = 18.5;
export const NORMAL_TO = 25;

const BANDS = [
  { id: "low", max: 18.5, title: "Ниже нормы" },
  { id: "ok", max: 25, title: "Норма" },
  { id: "high", max: 30, title: "Выше нормы" },
  { id: "veryHigh", max: Infinity, title: "Высокий" },
];

export function bodyMassIndex(kg, heightCm) {
  const weight = Number(kg);
  const cm = Number(heightCm);
  if (!Number.isFinite(weight) || !Number.isFinite(cm) || weight <= 0 || cm <= 0) {
    return null;
  }
  const meters = cm / 100;
  return weight / (meters * meters);
}

export function formatBmi(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toFixed(1);
}

export function bmiRatio(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, (value - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)));
}

export function bmiBand(value) {
  if (!Number.isFinite(value)) {
    return null;
  }
  const band = BANDS.find((item) => value < item.max);
  return {
    ...band,
    color: band.id === "ok" ? "#9BFFC8" : "rgba(255,255,255,0.72)",
  };
}
