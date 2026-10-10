import data from "../../../data/content/workouts.json";

export const WORKOUT_GROUPS = data.groups;
export const WORKOUT_SESSIONS = data.sessions;
export const WORKOUT_LEVELS = Array.isArray(data.levels) ? data.levels : [];
export const UNLOCK_EVERY = Math.max(1, Math.round(Number(data.unlockEvery) || 3));

export function sessionsInGroup(groupId) {
  return WORKOUT_SESSIONS.filter((item) => item.group === groupId && !item.daily && !item.warmup).sort(
    (a, b) => (Number(a.level) || 1) - (Number(b.level) || 1)
  );
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
  return sessionsInGroup(groupId).filter((item) => (Number(item.level) || 1) <= open);
}

export function nextLockedSession(groupId, user) {
  const open = openLevel(user);
  return sessionsInGroup(groupId).find((item) => Number(item.level) === open + 1) || null;
}

export function sessionById(id) {
  return WORKOUT_SESSIONS.find((item) => item.id === id) || null;
}

export function sessionRounds(session) {
  return Math.max(1, Math.min(4, Math.round(Number(session?.rounds) || 1)));
}

export function buildPlaylist(session) {
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
        steps.push({ kind: "rest", title: "Между подходами", sec: roundRest, round, rounds });
      }
    });
  }
  return steps;
}

export function sessionMinutes(session) {
  const total = buildPlaylist(session).reduce((sum, step) => sum + step.sec, 0);
  return Math.max(1, Math.round(total / 60));
}

export function sessionDetail(session) {
  const minutes = sessionMinutes(session);
  const rounds = sessionRounds(session);
  if (rounds > 1) {
    const word = rounds >= 5 ? "подходов" : "подхода";
    return `${minutes} мин · ${rounds} ${word}`;
  }
  const blocks = Array.isArray(session?.moves) ? session.moves.length : 0;
  return `${minutes} мин · ${blocks} блоков`;
}

const SECONDS_PER_REP = {
  "Приседания": 3,
  "Приседания уже": 3,
  "Приседания до стула": 3,
  "Прыжки ноги врозь": 2,
  "Марш на месте": 1,
  "Марш высоким коленом": 1,
  "Выпады на месте": 3,
  "Выпады назад": 3,
  "Подъём на носки": 2,
  "Отжимания с колен": 3,
  "Отжимания узко с колен": 3,
  "Отжимания от стены": 3,
  "Касания плеч в планке": 2,
  "Ягодичный мост": 3,
  "Ягодичный мост на одной": 4,
  "Скручивания": 2,
  "Велосипед лёжа": 2,
  "Мёртвый жук": 4,
  "Супермен": 4,
  "Супермен руки вперёд": 4,
  "Птица-собака": 4,
  "Сведение лопаток": 3,
  "Круги руками": 2,
  "Круги плечами": 2,
  "Подъёмы рук в стороны": 3,
  "Кошка-корова": 4,
};

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
  const tempo = SECONDS_PER_REP[step.title];
  if (!tempo) {
    return "";
  }
  const count = Math.max(1, Math.round(step.sec / tempo));
  return `${count} ${repsWord(count)}`;
}
