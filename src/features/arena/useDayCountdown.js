import { useEffect, useState } from "react";
import { msUntilMidnight, zoneOf } from "../../lib/day";
import { useAuth } from "../auth/AuthContext";

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatHm(ms) {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `${hours}:${pad(minutes)}`;
}

export function useDayCountdown() {
  const { user } = useAuth();
  const zone = zoneOf(user);
  const [ms, setMs] = useState(() => msUntilMidnight(zone));

  useEffect(() => {
    const tick = () => setMs(msUntilMidnight(zone));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [zone]);

  return {
    label: formatHm(ms),
    progress: Math.min(1, ms / DAY_MS),
  };
}
