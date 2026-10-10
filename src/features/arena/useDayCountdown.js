import { useEffect, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function msUntilUtcMidnight(now) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, next - now.getTime());
}

function formatHm(ms) {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}:${pad(minutes)}`;
}

export function useDayCountdown() {
  const [ms, setMs] = useState(() => msUntilUtcMidnight(new Date()));

  useEffect(() => {
    const tick = () => setMs(msUntilUtcMidnight(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return {
    label: formatHm(ms),
    progress: Math.min(1, ms / DAY_MS),
  };
}
