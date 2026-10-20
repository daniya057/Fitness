import data from "../../../data/content/workouts.json";

export const WORKOUT_GROUPS = data.groups;
export const WORKOUT_SESSIONS = data.sessions;
export const WORKOUT_LEVELS = Array.isArray(data.levels) ? data.levels : [];
export const UNLOCK_EVERY = Math.max(1, Math.round(Number(data.unlockEvery) || 3));

export function visibleGroups(user) {
  const place = String(user?.quiz?.place || "");
  const showGym = place === "gym" || place === "anywhere";
  return WORKOUT_GROUPS.filter((item) => item.id !== "gym" || showGym);
}

export function defaultGroupId(user) {
  return String(user?.quiz?.place || "") === "gym" ? "gym" : "full";
}

export function sessionsInGroup(groupId) {
  return WORKOUT_SESSIONS.filter((item) => item.group === groupId && !item.daily && !item.warmup).sort(
    (a, b) => (Number(a.level) || 1) - (Number(b.level) || 1)
  );
}

export function sessionsForPlan(groupId, user) {
  const place = String(user?.quiz?.place || "");
  const keepHome = groupId === "stretch" || groupId === "short" || groupId === "meal";
  if (place === "gym" && !keepHome) {
    if (groupId === "gym") {
      return sessionsInGroup("gym");
    }
    const slotted = sessionsInGroup("gym").filter((item) => (item.slot || "full") === groupId);
    return slotted.length ? slotted : sessionsInGroup("gym");
  }
  return sessionsInGroup(groupId);
}

export function warmupSessions() {
  return WORKOUT_SESSIONS.filter((item) => item.warmup);
}

export function experienceRank(experience) {
  const rank = Number(data.experienceRank?.[experience]);
  if (!Number.isInteger(rank) || rank < 1 || rank > 5) {
    return 1;
  }
  return rank;
}

export function openLevel(user) {
  const played = Math.round(Number(user?.programLevel));
  const earned = played >= 1 && played <= 5 ? played : 1;
  return Math.max(earned, experienceRank(user?.experience));
}

export function levelProgressCount(user) {
  const open = openLevel(user);
  if (open >= 5) {
    return 0;
  }
  if (Math.round(Number(user?.progressLevel)) !== open) {
    return 0;
  }
  return Math.max(0, Math.round(Number(user?.levelProgress) || 0));
}

export function levelById(level) {
  return WORKOUT_LEVELS.find((item) => item.id === Number(level)) || null;
}

export function levelLabel(level) {
  const item = levelById(level);
  if (!item) {
    return "";
  }
  return `Уровень ${item.id} · ${item.title}`;
}

export function workoutsLeftPhrase(done) {
  const left = Math.max(0, UNLOCK_EVERY - (Number(done) || 0));
  const mod10 = left % 10;
  const mod100 = left % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "тренировка"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "тренировки"
        : "тренировок";
  return `Ещё ${left} ${word}`;
}

export function openSessions(groupId, user) {
  const open = openLevel(user);
  return sessionsForPlan(groupId, user).filter((item) => (Number(item.level) || 1) <= open);
}

export function nextLockedSession(groupId, user) {
  const open = openLevel(user);
  return sessionsForPlan(groupId, user).find((item) => Number(item.level) === open + 1) || null;
}

export function sessionById(id, user) {
  const catalog = WORKOUT_SESSIONS.find((item) => item.id === id) || null;
  if (catalog) {
    return catalog;
  }
  const mine = Array.isArray(user?.customSessions) ? user.customSessions : [];
  return mine.find((item) => item && item.id === id) || null;
}

function pushTitle(seen, list, raw) {
  const title = String(raw || "").trim();
  if (!title || seen.has(title) || title === "Отдых" || title === "Между подходами" || title === "Приём пищи") {
    return;
  }
  seen.add(title);
  list.push(title);
}

export function catalogMoveTitles() {
  const seen = new Set();
  const list = [];
  for (const title of Array.isArray(data.extraMoves) ? data.extraMoves : []) {
    pushTitle(seen, list, title);
  }
  for (const session of WORKOUT_SESSIONS) {
    for (const move of session.moves || []) {
      pushTitle(seen, list, move.title);
    }
  }
  return list.sort((a, b) => a.localeCompare(b, "ru"));
}

export function isHoldMove(title) {
  return HOLD_MOVES.has(String(title || "").trim());
}

export function secFromReps(title, reps) {
  const count = Math.max(1, Math.min(40, Math.round(Number(reps) || 10)));
  if (isHoldMove(title)) {
    return Math.max(10, Math.min(90, count));
  }
  const tempo = SECONDS_PER_REP[String(title || "").trim()] || 3;
  return Math.max(10, Math.min(90, count * tempo));
}

export function isSetSession(session) {
  return Boolean(session?.format === "sets" || (session?.place === "gym" && session?.kind !== "cardio" && !session?.custom));
}

export function isTapSet(step, session) {
  if (!step || step.kind === "rest") {
    return false;
  }
  if (!(isSetSession(session) || session?.custom)) {
    return false;
  }
  const title = String(step.title || "").trim();
  if (step.finisher || CARDIO_TITLES.has(title) || isHoldMove(title)) {
    return false;
  }
  return true;
}

const CARDIO_TITLES = new Set(["Ходьба на дорожке", "Велотренажёр", "Эллипс"]);

const GYM_WARMUP = {
  push: [
    { title: "Круги плечами", sets: 1, reps: 16, warmup: true },
    { title: "Подъёмы рук в стороны", sets: 1, reps: 12, warmup: true },
  ],
  pull: [
    { title: "Сведение лопаток", sets: 1, reps: 12, warmup: true },
    { title: "Круги плечами", sets: 1, reps: 16, warmup: true },
  ],
  legs: [
    { title: "Подъём на носки", sets: 1, reps: 15, warmup: true },
    { title: "Приседания", sets: 1, reps: 10, warmup: true },
  ],
  full: [
    { title: "Круги плечами", sets: 1, reps: 16, warmup: true },
    { title: "Подъём на носки", sets: 1, reps: 12, warmup: true },
  ],
};

const GYM_EXTRAS = {
  push: [
    { title: "Разведение гантелей стоя", sets: 3, reps: 12 },
    { title: "Сгибание рук с гантелями", sets: 3, reps: 12 },
    { title: "Жим на трицепс на блоке", sets: 3, reps: 12 },
    { title: "Сведение рук в тренажёре", sets: 3, reps: 12 },
  ],
  pull: [
    { title: "Тяга к лицу на блоке", sets: 3, reps: 12 },
    { title: "Гиперэкстензия", sets: 3, reps: 12 },
    { title: "Пуловер на блоке", sets: 3, reps: 12 },
    { title: "Сгибание рук с гантелями", sets: 3, reps: 12 },
  ],
  legs: [
    { title: "Разгибание ног", sets: 3, reps: 12 },
    { title: "Подъём на носки", sets: 4, reps: 15 },
    { title: "Сгибание ног", sets: 3, reps: 12 },
    { title: "Румынская тяга с гантелями", sets: 3, reps: 10 },
  ],
  full: [
    { title: "Гиперэкстензия", sets: 3, reps: 12 },
    { title: "Планка", sets: 3, reps: 30 },
    { title: "Скручивания в тренажёре", sets: 3, reps: 12 },
    { title: "Разведение ног", sets: 3, reps: 12 },
  ],
};

function cloneSession(session) {
  return {
    ...session,
    moves: (session?.moves || []).map((move) => ({ ...move })),
  };
}

function workSecCap(title, hold) {
  if (CARDIO_TITLES.has(title)) {
    return 2400;
  }
  return hold ? 90 : 90;
}

export function budgetMinutes(user) {
  const raw = String(user?.quiz?.timeBudget || user?.checkins?.slice?.(-1)?.[0]?.time || "60");
  const n = Number(raw);
  if (n >= 100) {
    return 120;
  }
  if (n >= 75) {
    return 90;
  }
  if (n >= 45) {
    return 60;
  }
  return 30;
}

export function fitSessionToBudget(session, minutes) {
  if (!session) {
    return session;
  }
  const cap = Math.max(25, Math.min(120, Math.round(Number(minutes) || 60)));
  if (session.fittedTo === cap) {
    return session;
  }
  const next = cloneSession(session);
  next.fittedTo = cap;
  if (next.custom) {
    return next;
  }
  if (next.kind === "cardio") {
    const nowMin = sessionMinutes(next);
    const factor = cap / Math.max(8, nowMin);
    next.rounds = Math.max(1, Math.min(30, Math.round((Number(next.rounds) || 1) * factor)));
    return next;
  }
  if (!isSetSession(next)) {
    return next;
  }
  const slot = next.slot && GYM_EXTRAS[next.slot] ? next.slot : "full";
  const have = new Set(next.moves.map((move) => String(move.title || "").trim()));
  const warm = (GYM_WARMUP[slot] || GYM_WARMUP.full).filter((item) => !have.has(item.title));
  next.moves = [...warm, ...next.moves];
  warm.forEach((item) => have.add(item.title));
  if (cap >= 50) {
    next.moves = next.moves.map((move) => (move.warmup ? move : { ...move, sets: Math.max(Number(move.sets) || 3, 4) }));
  }
  const extras = GYM_EXTRAS[slot] || GYM_EXTRAS.full;
  for (const extra of extras) {
    if (sessionMinutes(next) >= cap - 8) {
      break;
    }
    if (!have.has(extra.title)) {
      next.moves.push({ ...extra, sets: cap >= 50 ? 4 : 3 });
      have.add(extra.title);
    }
  }
  const fillCardio = (title) => {
    const left = cap - sessionMinutes(next);
    if (left < 8) {
      return;
    }
    const sec = Math.min(2400, Math.max(480, left * 60));
    next.moves.push({
      title,
      sets: 1,
      reps: 1,
      sec,
      warmup: false,
      finisher: true,
    });
  };
  fillCardio("Ходьба на дорожке");
  if (cap - sessionMinutes(next) >= 8) {
    fillCardio("Велотренажёр");
  }
  return next;
}

export function sessionForUser(session, user) {
  if (!session) {
    return session;
  }
  if (session.fittedTo) {
    return session;
  }
  return fitSessionToBudget(session, budgetMinutes(user));
}

export function workSetCount(session) {
  const moves = Array.isArray(session?.moves) ? session.moves : [];
  if (isSetSession(session) || session?.custom) {
    return moves
      .filter((move) => !move.warmup && !move.finisher)
      .reduce((sum, move) => sum + Math.max(1, Math.min(6, Math.round(Number(move.sets) || 1))), 0);
  }
  const rounds = sessionRounds(session);
  return rounds * moves.length;
}

export function minSets(session) {
  return Math.max(1, Math.ceil(workSetCount(session) / 2));
}

export function sessionRounds(session) {
  return Math.max(1, Math.min(12, Math.round(Number(session?.rounds) || 1)));
}

function buildSetPlaylist(session, gymRest) {
  const restRaw = Number(session?.restSec);
  const restCap = gymRest ? 90 : 25;
  const rest = Number.isFinite(restRaw) ? Math.max(0, Math.min(restCap, Math.round(restRaw))) : gymRest ? 60 : 15;
  const roundRest = Math.max(20, Math.min(120, Math.round(Number(session?.roundRestSec) || (gymRest ? 90 : 40))));
  const moves = Array.isArray(session?.moves) ? session.moves : [];
  const steps = [];
  moves.forEach((move, moveIndex) => {
    const title = String(move.title || "Движение").trim();
    const sets = Math.max(1, Math.min(6, Math.round(Number(move.sets) || 1)));
    const hold = isHoldMove(title);
    const reps = Math.max(1, Math.min(40, Math.round(Number(move.reps) || (hold ? 30 : 10))));
    const cap = workSecCap(title, hold);
    const sec = hold
      ? Math.max(10, Math.min(cap, Math.round(Number(move.sec) || reps)))
      : Math.max(10, Math.min(cap, Math.round(Number(move.sec) || secFromReps(title, reps))));
    const counted = hold || CARDIO_TITLES.has(title) ? 0 : reps;
    for (let set = 1; set <= sets; set += 1) {
      steps.push({
        kind: "work",
        title,
        sec,
        reps: counted,
        round: set,
        rounds: sets,
        warmup: Boolean(move.warmup),
        finisher: Boolean(move.finisher),
      });
      const lastSet = set === sets;
      const lastMove = moveIndex === moves.length - 1;
      if (!lastSet) {
        steps.push({
          kind: "rest",
          title: gymRest ? `Отдых ${roundRest} сек` : "Между подходами",
          sec: roundRest,
          round: set,
          rounds: sets,
        });
      } else if (!lastMove && rest > 0) {
        steps.push({
          kind: "rest",
          title: gymRest ? "Следующий тренажёр" : "Отдых",
          sec: rest,
          round: set,
          rounds: sets,
        });
      }
    }
  });
  return steps;
}

export function buildPlaylist(session) {
  if (session?.custom || isSetSession(session)) {
    return buildSetPlaylist(session, isSetSession(session));
  }
  const restRaw = Number(session?.restSec);
  const rest = Number.isFinite(restRaw) ? Math.max(0, Math.min(25, Math.round(restRaw))) : 15;
  const roundRest = Math.max(20, Math.min(90, Math.round(Number(session?.roundRestSec) || 40)));
  const rounds = sessionRounds(session);
  const moves = Array.isArray(session?.moves) ? session.moves : [];
  const steps = [];
  for (let round = 1; round <= rounds; round += 1) {
    moves.forEach((move, index) => {
      const title = String(move.title || "Движение").trim();
      const sec = Math.max(10, Math.min(90, Math.round(Number(move.sec) || 30)));
      steps.push({ kind: "work", title, sec, round, rounds });
      const lastMove = index === moves.length - 1;
      const lastRound = round === rounds;
      if (!lastMove && rest > 0) {
        steps.push({ kind: "rest", title: "Отдых", sec: rest, round, rounds });
      } else if (!lastRound) {
        steps.push({ kind: "rest", title: "Между кругами", sec: roundRest, round, rounds });
      }
    });
  }
  return steps;
}

export function workSeconds(session) {
  return buildPlaylist(session)
    .filter((step) => step.kind !== "rest")
    .reduce((sum, step) => sum + Math.max(0, Math.round(Number(step.sec) || 0)), 0);
}

export function minActivitySec(session) {
  if (isSetSession(session) || session?.custom) {
    return minSets(session);
  }
  return Math.max(1, Math.round(workSeconds(session) / 2));
}

export function sessionMinutes(session) {
  const total = buildPlaylist(session).reduce((sum, step) => sum + step.sec, 0);
  return Math.max(1, Math.round(total / 60));
}

function movesWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "упражнение";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "упражнения";
  }
  return "упражнений";
}

export function sessionDetail(session) {
  const minutes = sessionMinutes(session);
  if (session?.custom) {
    const blocks = Array.isArray(session.moves) ? session.moves.length : 0;
    return `${minutes} мин · ${blocks} ${movesWord(blocks)}`;
  }
  if (isSetSession(session)) {
    const first =
      (Array.isArray(session.moves) ? session.moves : []).find((move) => !move.warmup && !move.finisher) ||
      session.moves?.[0];
    const sets = Math.max(1, Math.round(Number(first?.sets) || 3));
    const reps = Math.max(1, Math.round(Number(first?.reps) || 10));
    const hold = first && isHoldMove(first.title);
    return hold ? `${minutes} мин · ${sets}×${reps} сек` : `${minutes} мин · ${sets}×${reps}`;
  }
  if (session?.kind === "cardio" || session?.place === "gym") {
    return `${minutes} мин`;
  }
  const rounds = sessionRounds(session);
  if (rounds > 1) {
    const word = rounds >= 5 ? "кругов" : "круга";
    return `${minutes} мин · ${rounds} ${word}`;
  }
  const blocks = Array.isArray(session?.moves) ? session.moves.length : 0;
  return `${minutes} мин · ${blocks} ${movesWord(blocks)}`;
}

const SECONDS_PER_REP = {
  "Приседания": 3,
  "Приседания уже": 3,
  "Приседания до стула": 3,
  "Приседания сумо": 3,
  "Приседания с выпрыгиванием": 2,
  "Прыжки ноги врозь": 2,
  "Марш на месте": 1,
  "Марш высоким коленом": 1,
  "Бег на месте": 1,
  "Выпады на месте": 3,
  "Выпады назад": 3,
  "Боковые выпады": 3,
  "Болгарские выпады": 4,
  "Подъём на носки": 2,
  "Отжимания": 3,
  "Отжимания с колен": 3,
  "Отжимания узко с колен": 3,
  "Отжимания узкие": 3,
  "Отжимания от стены": 3,
  "Отжимания в наклоне": 3,
  "Обратные отжимания": 3,
  "Касания плеч в планке": 2,
  "Ягодичный мост": 3,
  "Ягодичный мост на одной": 4,
  "Скручивания": 2,
  "Велосипед лёжа": 2,
  "Касания пяток": 2,
  "Подъём ног лёжа": 3,
  "Альпинист": 1,
  "Берпи": 4,
  "Мёртвый жук": 4,
  "Супермен": 4,
  "Супермен руки вперёд": 4,
  "Y-подъёмы лёжа": 3,
  "Снежный ангел лёжа": 4,
  "Птица-собака": 4,
  "Сведение лопаток": 3,
  "Наклон вперёд стоя": 3,
  "Круги руками": 2,
  "Круги плечами": 2,
  "Подъёмы рук в стороны": 3,
  "Кошка-корова": 4,
  "Жим ногами": 4,
  "Жим в тренажёре": 4,
  "Жим от плеч в тренажёре": 4,
  "Сведение рук в тренажёре": 4,
  "Тяга верхнего блока": 4,
  "Тяга нижнего блока": 4,
  "Тяга к лицу на блоке": 4,
  "Разгибание ног": 3,
  "Сгибание ног": 3,
  "Приседания с гантелей": 3,
  "Выпады с гантелями": 3,
  "Сгибание рук с гантелями": 3,
  "Жим на трицепс на блоке": 3,
  "Гиперэкстензия": 3,
  "Разведение гантелей стоя": 3,
  "Румынская тяга с гантелями": 4,
  "Пуловер на блоке": 4,
  "Скручивания в тренажёре": 2,
  "Разведение ног": 3,
  "Велотренажёр": 1,
  "Ходьба на дорожке": 1,
  "Эллипс": 1,
};

const HOLD_MOVES = new Set([
  "Планка",
  "Планка на коленях",
  "Планка на прямых руках",
  "Боковая планка слева",
  "Боковая планка справа",
  "Стена-стул",
  "Поза ребёнка",
  "Растяжка груди у стены",
  "Наклон к ногам сидя",
  "Наклон к ногам стоя",
  "Растяжка сгибателей бедра",
  "Растяжка квадрицепса",
  "Скрутка лёжа",
  "Поза голубя упрощённая",
  "Собака мордой вниз",
  "Кобра",
  "Дыхание лёжа",
]);

function repsWord(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "повторение";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "повторения";
  }
  return "повторений";
}

export function repsLabel(step) {
  if (!step || step.kind === "rest") {
    return "";
  }
  if (Number.isFinite(Number(step.reps)) && Number(step.reps) > 0) {
    const count = Math.round(Number(step.reps));
    return `${count} ${repsWord(count)}`;
  }
  const tempo = SECONDS_PER_REP[step.title];
  if (!tempo) {
    return "";
  }
  const count = Math.max(1, Math.round(step.sec / tempo));
  return `${count} ${repsWord(count)}`;
}
