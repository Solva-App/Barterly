import { request, ApiError } from './api.js';
import { db, commit } from './db.js';
import { REPLIES } from '../data/mock.js';
import { store } from '../store.js';
import { uid, sleep, rand } from '../util.js';

const syncUnread = () => store.set({ unread: (db()?.chats || []).reduce((n, c) => n + (c.unread || 0), 0) });
const byId = id => {
  const c = db().chats.find(c => c.id === id);
  if (!c) throw new ApiError('This conversation could not be found.', { status: 404 });
  return c;
};
const msg = (sender, text) => ({ id: uid(), sender, text, ts: Date.now() });

function pickReply(text) {
  const t = text.toLowerCase();
  const pool = /where|meet|location|address/.test(t) ? REPLIES.where
    : /available|still/.test(t) ? REPLIES.available
    : /photo|pic|image/.test(t) ? REPLIES.photo
    : /deal|ok|okay|agree|yes/.test(t) ? REPLIES.deal
    : /when|time|day|today|tomorrow/.test(t) ? REPLIES.when
    : REPLIES.fallback;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const chats = {
  list: () => request({ path: '/chats', latency: false, mock: () => [...db().chats].sort((a, b) => b.updatedAt - a.updatedAt) }),
  get: id => request({ path: `/chats/${id}`, latency: false, mock: () => byId(id) }),

  /** Start (or reuse) a conversation about a listing. Returns the chat id. */
  openForItem: (item, offered) => request({
    method: 'POST', path: '/chats', body: { itemId: item.id, offeredId: offered?.id }, latency: false,
    mock: () => {
      let chat = db().chats.find(c => c.itemId === item.id);
      const intro = offered
        ? `Hi! I’d like to swap my ${offered.title} for your ${item.title}. Interested?`
        : `Hi! I’m interested in swapping for your ${item.title}.`;
      if (!chat) {
        chat = {
          id: 'c' + uid(), itemId: item.id, itemTitle: item.title, itemImage: item.image,
          partner: item.user, partnerPhoto: item.userPhoto, partnerRating: item.userRating, verified: item.verified,
          offered: offered ? { title: offered.title, image: offered.image } : null,
          status: 'active', rating: 0, unread: 0, updatedAt: Date.now(), messages: [],
        };
        db().chats.unshift(chat);
      }
      chat.messages.push(msg('me', intro)); chat.updatedAt = Date.now();
      commit(); syncUnread();
      return chat.id;
    },
  }),

  send: (id, text) => request({
    method: 'POST', path: `/chats/${id}/messages`, body: { text }, latency: false,
    mock: () => { const c = byId(id), m = msg('me', text); c.messages.push(m); c.updatedAt = m.ts; commit(); return m; },
  }),

  /** Simulated partner reply, including a believable typing delay. */
  reply: (id, lastText) => request({
    path: `/chats/${id}/reply`, latency: false,
    mock: async () => {
      await sleep(rand(1300, 2300));
      const c = byId(id);
      const m = msg('them', pickReply(lastText));
      c.messages.push(m); c.updatedAt = m.ts; commit();
      return m;
    },
  }),

  markRead: id => { const c = db()?.chats.find(c => c.id === id); if (c && c.unread) { c.unread = 0; commit(); syncUnread(); } },
  refreshUnread: syncUnread,

  complete: (id, rating, note) => request({
    method: 'POST', path: `/chats/${id}/complete`, body: { rating, note },
    mock: () => {
      const c = byId(id); c.status = 'swapped'; c.rating = rating;
      const p = db().profile; p.tradesCount++; commit();
      store.set({ profile: { ...p } });
      return c;
    },
  }),

  dispute: (id, note) => request({
    method: 'POST', path: `/chats/${id}/dispute`, body: { note },
    mock: () => { const c = byId(id); c.status = 'disputed'; commit(); return c; },
  }),
};
