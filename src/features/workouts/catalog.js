import data from "../../../data/content/workouts.json";

export const WORKOUT_GROUPS = data.groups;
export const WORKOUT_SESSIONS = data.sessions;

export function sessionsInGroup(groupId) {
  return WORKOUT_SESSIONS.filter((item) => item.group === groupId && !item.daily);
}

export function sessionById(id) {
  return WORKOUT_SESSIONS.find((item) => item.id === id) || null;
}

export function sessionRounds(session) {
  return Math.max(1, Math.min(4, Math.round(Number(session?.rounds) || 1)));
}

export function buildPlaylist(session) {
  const rest = Math.max(8, Math.min(25, Math.round(Number(session?.restSec) || 15)));
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
      if (!lastMove) {
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
