import { icon } from '../icons.js';
import { store } from '../store.js';

export const TABS = [
  { id: 'home', label: 'Home', icon: 'home', href: '#/home' },
  { id: 'explore', label: 'Explore', icon: 'compass', href: '#/explore' },
  { id: 'post', label: 'Post', icon: 'plus', href: '#/post' },
  { id: 'chats', label: 'Chats', icon: 'chat', href: '#/chats' },
  { id: 'profile', label: 'Profile', icon: 'user', href: '#/profile' },
];
export const TAB_INDEX = Object.fromEntries(TABS.map((t, i) => [t.id, i]));

const bar = () => document.getElementById('tabbar');

export function renderTabbar() {
  bar().innerHTML = `<span class="tab-pill" aria-hidden="true"></span>` + TABS.map(t => t.id === 'post'
    ? `<a class="tab tab-post" data-tab="post" href="${t.href}" aria-label="Post an item"><span class="fab">${icon('plus', 26)}</span></a>`
    : `<a class="tab" data-tab="${t.id}" href="${t.href}">${icon(t.icon, 23)}<span>${t.label}</span>${t.id === 'chats' ? '<span class="badge" data-badge hidden></span>' : ''}</a>`).join('');
  updateBadge();
}

export function setActiveTab(tab) {
  const el = bar();
  el.dataset.active = tab || '';
  if (tab != null) el.style.setProperty('--i', TAB_INDEX[tab] ?? 0);
  el.querySelectorAll('.tab').forEach(a => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

export function updateBadge() {
  const b = bar().querySelector('[data-badge]');
  if (!b) return;
  const n = store.state.unread;
  const was = b.textContent;
  b.hidden = !n; b.textContent = n > 9 ? '9+' : String(n || '');
  if (n && was !== b.textContent) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
  bar().querySelector('[data-tab="chats"]')?.setAttribute('aria-label', n ? `Chats, ${n} unread` : 'Chats');
}
