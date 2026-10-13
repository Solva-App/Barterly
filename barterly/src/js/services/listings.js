import { request, ApiError } from './api.js';
import { market, db, commit } from './db.js';
import { BANNED, STATES } from '../data/mock.js';
import { store } from '../store.js';

function checkBanned(text) {
  const t = text.toLowerCase();
  return BANNED.find(b => b.words.some(w => new RegExp('\\b' + w + '\\b').test(t)));
}

/** Own listings always reflect the current profile (username, photo, verification). */
function decorate(item) {
  if (!item.mine) return item;
  const p = db().profile;
  return { ...item, user: '@' + p.username, userPhoto: p.photo, userRating: p.rating || 5, userTrades: p.tradesCount, verified: p.isVerified };
}
const all = () => [...db().mine.map(decorate), ...market].sort((a, b) => b.createdAt - a.createdAt);

export const listings = {
  list: ({ hub, category = 'All', query = '' } = {}) => request({
    path: '/listings', mock: () => {
      const q = query.trim().toLowerCase();
      return all().filter(i =>
        (!hub || i.hub === hub) &&
        (category === 'All' || i.category === category) &&
        (!q || i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.want.toLowerCase().includes(q)));
    },
  }),

  get: id => request({
    path: `/listings/${id}`, mock: () => {
      const item = all().find(i => i.id === id);
      if (!item) throw new ApiError('This listing is no longer available.', { status: 404, code: 'not_found' });
      return item;
    },
  }),

  mine: () => request({ path: '/me/listings', latency: false, mock: () => db().mine.map(decorate) }),

  create: data => request({
    method: 'POST', path: '/listings', body: data,
    mock: () => {
      const p = db().profile;
      if (p.flagged) throw new ApiError('Your account is flagged. Posting is paused while we review it.', { code: 'flagged' });
      const hit = checkBanned(`${data.title} ${data.want}`);
      if (hit) {
        p.strikes++;
        if (p.strikes >= 3) p.flagged = true;
        commit(); store.set({ profile: { ...p } });
        throw new ApiError(p.flagged ? 'Account flagged after 3 banned-item strikes.' : `“${hit.name}” items aren’t allowed on Barterly (strike ${p.strikes} of 3).`, { code: 'banned', field: 'title' });
      }
      if (!STATES.includes(data.hub)) throw new ApiError('Choose a state.', { field: 'hub' });
      const item = { ...data, id: 'u' + Date.now(), mine: true, status: 'Ready to Swap', createdAt: Date.now() };
      db().mine.unshift(item); commit();
      return decorate(item);
    },
  }),

  remove: id => request({
    method: 'DELETE', path: `/listings/${id}`, latency: false,
    mock: () => { db().mine = db().mine.filter(i => i.id !== id); commit(); return true; },
  }),

  toggleSave(id) {
    const saved = new Set(store.state.saved);
    const on = !saved.has(id);
    on ? saved.add(id) : saved.delete(id);
    db().saved = [...saved]; commit();
    store.set({ saved });
    return on;
  },
};
