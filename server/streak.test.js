const assert = require("assert");
const { settleStreak, addUtcDays, shieldNoticeOpen } = require("./streak");

function record(extra) {
  return {
    streak: 5,
    freezesLeft: 1,
    lastActivityDate: "2026-10-01",
    ...extra,
  };
}

function settle(extra, today) {
  const user = record(extra);
  const result = settleStreak(user, today);
  return { user, result };
}

{
  const { user, result } = settle({ lastActivityDate: "2026-10-09" }, "2026-10-10");
  assert.equal(result.changed, true);
  assert.equal(result.saved, false);
  assert.equal(result.broken, false);
  assert.equal(user.streak, 5);
  assert.equal(user.freezesLeft, 1);
  assert.equal(user.streakSettledDate, "2026-10-09");
}

{
  const { user, result } = settle({ lastActivityDate: "2026-10-08", freezesLeft: 1 }, "2026-10-10");
  assert.equal(result.saved, true);
  assert.equal(result.broken, false);
  assert.equal(user.streak, 5);
  assert.equal(user.freezesLeft, 0);
  assert.equal(user.shieldSavedDate, "2026-10-10");
  assert.equal(user.streakSettledDate, "2026-10-09");
}

{
  const { user, result } = settle({ lastActivityDate: "2026-10-08", freezesLeft: 0 }, "2026-10-10");
  assert.equal(result.saved, false);
  assert.equal(result.broken, true);
  assert.equal(user.streak, 0);
  assert.equal(user.cleanStreak, 0);
}

{
  const { user, result } = settle({ lastActivityDate: "2026-10-06", freezesLeft: 1, streak: 8 }, "2026-10-10");
  assert.equal(result.saved, true);
  assert.equal(result.broken, true);
  assert.equal(user.streak, 0);
  assert.equal(user.freezesLeft, 0);
}

{
  const { user, result } = settle({ lastActivityDate: "2026-10-07", freezesLeft: 2, streak: 8 }, "2026-10-10");
  assert.equal(result.saved, true);
  assert.equal(result.broken, false);
  assert.equal(user.streak, 8);
  assert.equal(user.freezesLeft, 0);
}

{
  const user = record({ lastActivityDate: "2026-10-08", freezesLeft: 1 });
  settleStreak(user, "2026-10-10");
  const second = settleStreak(user, "2026-10-10");
  assert.equal(second.changed, false);
  assert.equal(second.saved, false);
  assert.equal(user.freezesLeft, 0);
  assert.equal(user.streak, 5);
}

{
  const { user, result } = settle({ lastActivityDate: null, streak: 0, freezesLeft: 1 }, "2026-10-10");
  assert.equal(result.broken, false);
  assert.equal(result.saved, false);
  assert.equal(user.streak, 0);
  assert.equal(user.freezesLeft, 1);
}

{
  const { user, result } = settle({ lastActivityDate: "2026-10-10", streak: 3, freezesLeft: 1 }, "2026-10-10");
  assert.equal(result.saved, false);
  assert.equal(user.streak, 3);
  assert.equal(user.freezesLeft, 1);
}

{
  const user = record({ lastActivityDate: "2026-10-08", freezesLeft: 1, streak: 4 });
  settleStreak(user, "2026-10-10");
  assert.equal(addUtcDays(user.lastActivityDate, 1), "2026-10-09");
  user.streak = (Number(user.streak) || 0) + 1;
  user.lastActivityDate = "2026-10-10";
  assert.equal(user.streak, 5);
}

{
  const user = { shieldSavedDate: "2026-10-10", shieldNoticeSeen: null };
  assert.equal(shieldNoticeOpen(user, "2026-10-10"), true);
  user.shieldNoticeSeen = "2026-10-10";
  assert.equal(shieldNoticeOpen(user, "2026-10-10"), false);
}

console.log("streak.test.js: ок");
