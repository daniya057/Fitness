function experienceRank(table, experience) {
  const rank = Number(table && table[experience]);
  if (!Number.isInteger(rank) || rank < 1 || rank > 5) {
    return 1;
  }
  return rank;
}

function openProgramLevel(record, table) {
  const played = Math.round(Number(record && record.programLevel));
  const earned = played >= 1 && played <= 5 ? played : 1;
  return Math.max(earned, experienceRank(table, record && record.experience));
}

function noteProgramProgress(record, session, options) {
  const unlockEvery = Math.max(1, Math.round(Number(options && options.unlockEvery) || 3));
  const table = (options && options.experienceRank) || {};
  if (!record || !session || session.daily || session.warmup || session.group === "meal") {
    return record;
  }
  const level = Math.round(Number(session.level));
  if (level < 1 || level > 5) {
    return record;
  }
  const open = openProgramLevel(record, table);
  if (level !== open || open >= 5) {
    return record;
  }
  if (record.progressLevel !== open) {
    record.progressLevel = open;
    record.levelProgress = 0;
  }
  record.levelProgress = (Number(record.levelProgress) || 0) + 1;
  if (record.levelProgress >= unlockEvery) {
    record.programLevel = open + 1;
    record.progressLevel = open + 1;
    record.levelProgress = 0;
  }
  return record;
}

module.exports = { experienceRank, openProgramLevel, noteProgramProgress };
