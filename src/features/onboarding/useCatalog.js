import { useEffect, useState } from "react";
import { api } from "../auth/api";
import { DAILY_COPY, MISSIONS_BY_GOAL } from "./catalog";

export function useCatalog() {
  const [catalog, setCatalog] = useState({
    daily: DAILY_COPY,
    missions: MISSIONS_BY_GOAL,
  });

  useEffect(() => {
    let alive = true;
    api("/catalog")
      .then((data) => {
        if (!alive || !data?.daily || !data?.missions) {
          return;
        }
        setCatalog({ daily: data.daily, missions: data.missions });
      })
      .catch(() => {
        // Остаёмся на встроенных текстах, если сервер молчит.
      });
    return () => {
      alive = false;
    };
  }, []);

  return catalog;
}
