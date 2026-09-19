import { useCallback, useEffect, useRef, useState } from "react";

const CHALLENGE_MS = 2 * 60 * 1000;

function formatRemain(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function useChallenge(onComplete) {
  const [status, setStatus] = useState("idle");
  const [remainLabel, setRemainLabel] = useState("2:00");
  const endsAtRef = useRef(null);
  const doneRef = useRef(onComplete);

  doneRef.current = onComplete;

  const start = useCallback(() => {
    if (status !== "idle") {
      return false;
    }
    endsAtRef.current = Date.now() + CHALLENGE_MS;
    setStatus("running");
    setRemainLabel("2:00");
    return true;
  }, [status]);

  useEffect(() => {
    if (status !== "running") {
      return undefined;
    }

    const tick = () => {
      const left = (endsAtRef.current || 0) - Date.now();
      if (left <= 0) {
        setRemainLabel("0:00");
        setStatus("done");
        if (doneRef.current) {
          doneRef.current();
        }
        return;
      }
      setRemainLabel(formatRemain(left));
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [status]);

  return { status, remainLabel, start };
}
