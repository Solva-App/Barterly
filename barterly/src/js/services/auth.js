// Auth service. Mock mode keeps accounts in localStorage with a SHA-256 hash
// (never plaintext) and issues a stub token. Live mode just calls the API.
import { request, ApiError } from './api.js';
import { loadUserData, unloadUserData, db, commit } from './db.js';
import { read, write, drop, uid } from '../util.js';
import { DEMO } from '../data/mock.js';
import { store } from '../store.js';

const ACCOUNTS = 'barterly:accounts:v1';
const SESSION = 'barterly:session';

async function hash(email, password) {
  const input = `${email}:${password}:barterly`;
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'x' + btoa(unescape(encodeURIComponent(input)));   // insecure-context fallback (demo only)
  }
}

async function accounts() {
  const saved = read(ACCOUNTS, []);
  const demo = { name: DEMO.name, username: DEMO.username, email: DEMO.email, passHash: await hash(DEMO.email, DEMO.password) };
  return [demo, ...saved.filter(a => a.email !== DEMO.email)];
}
const saveAccounts = list => write(ACCOUNTS, list.filter(a => a.email !== DEMO.email));
const publicUser = a => ({ name: a.name, username: a.username, email: a.email });

function startSession(account) {
  write(SESSION, { token: uid() + uid(), email: account.email, at: Date.now() });
  const user = publicUser(account);
  loadUserData(account);
  store.set({ user, profile: db().profile, saved: new Set(db().saved) });
  return user;
}

export const auth = {
  /** Restore a session on app start. */
  async restore() {
    const s = read(SESSION, null);
    if (!s) return null;
    const acc = (await accounts()).find(a => a.email === s.email);
    if (!acc) { drop(SESSION); return null; }
    const user = publicUser(acc);
    loadUserData(acc);
    store.set({ user, profile: db().profile, saved: new Set(db().saved) });
    return user;
  },

  isSignedIn: () => !!store.state.user,

  login: ({ email, password }) => request({
    method: 'POST', path: '/auth/login', body: { email, password },
    mock: async () => {
      const e = email.trim().toLowerCase();
      const acc = (await accounts()).find(a => a.email === e);
      if (!acc) throw new ApiError('No account found with this email.', { field: 'email', code: 'no_account' });
      if (acc.passHash !== await hash(e, password)) throw new ApiError('Wrong password. Try again or reset it.', { field: 'password', code: 'bad_password' });
      return startSession(acc);
    },
  }),

  signup: ({ name, username, email, password }) => request({
    method: 'POST', path: '/auth/signup', body: { name, username, email, password },
    mock: async () => {
      const list = await accounts();
      const e = email.trim().toLowerCase(), u = username.trim().toLowerCase();
      if (list.some(a => a.email === e)) throw new ApiError('An account with this email already exists. Try logging in.', { field: 'email' });
      if (list.some(a => a.username.toLowerCase() === u)) throw new ApiError('That username is taken. Try another.', { field: 'username' });
      const acc = { name: name.trim(), username: u, email: e, passHash: await hash(e, password) };
      const saved = read(ACCOUNTS, []); saved.push(acc); write(ACCOUNTS, saved);
      return startSession(acc);
    },
  }),

  forgot: ({ email }) => request({ method: 'POST', path: '/auth/forgot', body: { email }, mock: () => true }),

  async changePassword({ current, next }) {
    return request({
      method: 'POST', path: '/auth/password', body: { current, next },
      mock: async () => {
        const list = await accounts();
        const acc = list.find(a => a.email === store.state.user.email);
        if (acc.passHash !== await hash(acc.email, current)) throw new ApiError('Current password is incorrect.', { field: 'current' });
        if (acc.email === DEMO.email) throw new ApiError('The demo account password can’t be changed.', { field: 'current' });
        acc.passHash = await hash(acc.email, next);
        saveAccounts(list);
        return true;
      },
    });
  },

  changeUsername: username => request({
    method: 'PATCH', path: '/me', body: { username },
    mock: async () => {
      const list = await accounts();
      const u = username.trim().replace(/^@/, '').toLowerCase();
      if (list.some(a => a.username.toLowerCase() === u && a.email !== store.state.user.email)) throw new ApiError('That username is taken.', { field: 'username' });
      const acc = list.find(a => a.email === store.state.user.email);
      acc.username = u; saveAccounts(list);
      db().profile.username = u; db().mine.forEach(i => { i.user = '@' + u; });
      commit();
      store.set({ user: publicUser(acc), profile: { ...db().profile } });
      return u;
    },
  }),

  logout() {
    drop(SESSION); unloadUserData();
    store.set({ user: null, profile: null, saved: new Set(), unread: 0 });
  },
};
