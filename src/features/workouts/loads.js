export function readLoad(gymLoads, title) {
  const raw = gymLoads?.[title];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { kg: raw, history: [] };
  }
  if (raw && typeof raw === "object") {
    const kg = Number(raw.kg);
    return {
      kg: Number.isFinite(kg) ? kg : 0,
      history: Array.isArray(raw.history) ? raw.history : [],
    };
  }
  return { kg: 0, history: [] };
}

export function loadKg(gymLoads, title) {
  return readLoad(gymLoads, title).kg;
}

export function sessionLoadTitles(session) {
  const seen = new Set();
  const list = [];
  for (const move of session?.moves || []) {
    const title = String(move?.title || "").trim();
    if (!title || move.warmup || seen.has(title)) {
      continue;
    }
    seen.add(title);
    list.push(title);
  }
  return list;
}
