// Tiny reactive store: UI-wide state that more than one screen cares about.
const listeners = new Set();

export const state = {
  user: null,          // signed-in account (never contains the password hash)
  profile: null,       // per-user profile (verification, strikes, trades…)
  hub: 'Lagos',
  saved: new Set(),
  unread: 0,
  online: navigator.onLine,
};

export const store = {
  state,
  set(patch) {
    Object.assign(state, patch);
    listeners.forEach(fn => fn(state, patch));
  },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
