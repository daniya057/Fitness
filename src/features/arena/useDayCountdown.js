import { useEffect, useState } from "react";

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function msUntilLocalMidnight(now) {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, end.getTime() - now.getTime());
}

function formatHm(ms) {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}:${pad(minutes)}`;
}

export function useDayCountdown() {
  const [ms, setMs] = useState(() => msUntilLocalMidnight(new Date()));

  useEffect(() => {
    const tick = () => setMs(msUntilLocalMidnight(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return {
    label: formatHm(ms),
    progress: Math.min(1, ms / DAY_MS),
  };
}
