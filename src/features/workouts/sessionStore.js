import { create } from "zustand";
import { buildPlaylist } from "./catalog";

export const MIN_ACTIVITY_SEC = 60;
export const PREP_SEC = 15;

export const useSession = create((set, get) => ({
  session: null,
  steps: [],
  index: 0,
  remaining: 0,
  elapsed: 0,
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

  skip() {
    const { steps, index, finished } = get();
    if (!steps.length || finished) {
      return;
    }
    const next = index + 1;
    if (next >= steps.length) {
      set({ running: false, finished: true, remaining: 0, index: steps.length - 1 });
      return;
    }
    set({ index: next, remaining: steps[next].sec });
  },

  tick() {
    const state = get();
    if (state.finished) {
      return;
    }
    if (state.prep > 0) {
      const prep = state.prep - 1;
      set(prep > 0 ? { prep } : { prep: 0, running: true });
      return;
    }
    if (!state.running) {
      return;
    }
    const elapsed = (Number(state.elapsed) || 0) + 1;
    if (state.remaining > 1) {
      set({ remaining: state.remaining - 1, elapsed });
      return;
    }
    const next = state.index + 1;
    if (next >= state.steps.length) {
      set({ running: false, finished: true, remaining: 0, elapsed });
      return;
    }
    set({ index: next, remaining: state.steps[next].sec, elapsed });
  },
}));
