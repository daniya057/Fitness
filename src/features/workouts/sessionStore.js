import { create } from "zustand";
import { buildPlaylist, isTapSet } from "./catalog";

export const PREP_SEC = 15;

function creditWork(step) {
  return Boolean(step && step.kind === "work" && !step.warmup && !step.finisher);
}

function autoRun(step, session) {
  return Boolean(step) && !isTapSet(step, session);
}

export const useSession = create((set, get) => ({
  session: null,
  steps: [],
  index: 0,
  remaining: 0,
  elapsed: 0,
  workDone: 0,
  prep: 0,
  running: false,
  finished: false,

  open(session) {
    const steps = buildPlaylist(session);
    set({
      session,
      steps,
      index: 0,
      remaining: steps[0] ? steps[0].sec : 0,
      elapsed: 0,
      workDone: 0,
      prep: steps.length > 0 ? PREP_SEC : 0,
      running: false,
      finished: false,
    });
  },

  close() {
    set({
      session: null,
      steps: [],
      index: 0,
      remaining: 0,
      elapsed: 0,
      workDone: 0,
      prep: 0,
      running: false,
      finished: false,
    });
  },

  play() {
    if (!get().steps.length || get().finished) {
      return;
    }
    set({ running: true });
  },

  pause() {
    set({ running: false });
  },

  skipPrep() {
    if (get().prep <= 0 || get().finished) {
      return;
    }
    const { steps, index, session } = get();
    set({ prep: 0, running: autoRun(steps[index], session) });
  },

  skip() {
    const { steps, index, finished, prep, session } = get();
    if (!steps.length || finished) {
      return;
    }
    if (prep > 0) {
      set({ prep: 0, running: autoRun(steps[index], session) });
      return;
    }
    const next = index + 1;
    if (next >= steps.length) {
      set({ running: false, finished: true, remaining: 0, index: steps.length - 1 });
      return;
    }
    set({ index: next, remaining: steps[next].sec, running: autoRun(steps[next], session) });
  },

  completeWork() {
    const { steps, index, finished, prep, session } = get();
    if (!steps.length || finished || prep > 0) {
      return;
    }
    const step = steps[index];
    const workDone = (Number(get().workDone) || 0) + (creditWork(step) ? 1 : 0);
    const elapsed = (Number(get().elapsed) || 0) + (step && step.kind !== "rest" ? Math.max(0, Number(step.sec) || 0) : 0);
    const next = index + 1;
    if (next >= steps.length) {
      set({ running: false, finished: true, remaining: 0, workDone, elapsed });
      return;
    }
    set({
      index: next,
      remaining: steps[next].sec,
      workDone,
      elapsed,
      running: autoRun(steps[next], session),
    });
  },

  tick() {
    const state = get();
    if (state.finished) {
      return;
    }
    if (state.prep > 0) {
      const prep = state.prep - 1;
      set(prep > 0 ? { prep } : { prep: 0, running: autoRun(state.steps[state.index], state.session) });
      return;
    }
    if (!state.running) {
      return;
    }
    const step = state.steps[state.index];
    const workTick = step && step.kind !== "rest" ? 1 : 0;
    const elapsed = (Number(state.elapsed) || 0) + workTick;
    if (state.remaining > 1) {
      set({ remaining: state.remaining - 1, elapsed });
      return;
    }
    const workDone = (Number(state.workDone) || 0) + (creditWork(step) ? 1 : 0);
    const next = state.index + 1;
    if (next >= state.steps.length) {
      set({ running: false, finished: true, remaining: 0, elapsed, workDone });
      return;
    }
    set({
      index: next,
      remaining: state.steps[next].sec,
      elapsed,
      workDone,
      running: autoRun(state.steps[next], state.session),
    });
  },
}));
