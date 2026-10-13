import { applyTheme } from './theme.js';
import { bindActions, actions } from './actions.js';
import { installImageHandlers } from './components/ui.js';
import { renderTabbar, updateBadge } from './components/tabbar.js';
import { startRouter, navigate, back } from './router.js';
import { auth } from './services/auth.js';
import { listings } from './services/listings.js';
import { chats } from './services/chats.js';
import { store } from './store.js';
import { toast } from './components/toast.js';
import { openHubSheet, proposeFlow } from './components/flows.js';
import { icon } from './icons.js';
import { vibrate } from './util.js';

applyTheme();
installImageHandlers();
bindActions(document);
renderTabbar();

/* ---------- Global actions ---------- */
actions.back = el => back(el.dataset.to);
actions.go = el => navigate(el.dataset.to);
actions.retry =() => document.dispatchEvent(new CustomEvent('app:retry'));
actions['open-hub'] = openHubSheet;
actions.propose = el => proposeFlow(el.dataset.id);
actions['toggle-save'] = btn => {
  const on = listings.toggleSave(btn.dataset.id);
  document.querySelectorAll(`.heart[data-id="${CSS.escape(btn.dataset.id)}"]`).forEach(h => {
    h.classList.toggle('on', on);
    h.setAttribute('aria-pressed', on);
    h.setAttribute('aria-label', on ? 'Remove from saved' : 'Save listing');
    h.classList.remove('pop'); void h.offsetWidth; if (on) h.classList.add('pop');
  });
  vibrate(on ? 14 : 6);
  if (on) toast('Saved to your list');
};

/* ---------- Reactive bits ---------- */
store.on((s, patch) => {
  if ('hub' in patch) document.querySelectorAll('[data-hub-label]').forEach(n => { n.textContent = s.hub; });
  if ('unread' in patch) updateBadge();
});

const banner = document.getElementById('offline');
function setOnline(on) {
  store.set({ online: on });
  banner.hidden = on;
  banner.innerHTML = on ? '' : `${icon('wifioff', 14)} You’re offline — showing saved data`;
  if (on && banner.dataset.was) toast('Back online');
  banner.dataset.was = on ? '' : '1';
}
addEventListener('online', () => setOnline(true));
addEventListener('offline', () => setOnline(false));
if (!navigator.onLine) setOnline(false);

window.addEventListener('auth:expired', () => { auth.logout(); navigate('/auth/login', { replace: true }); toast('Session expired. Please log in again.', 'info'); });

/* ---------- Boot ---------- */
(async () => {
  await auth.restore();
  chats.refreshUnread();
  await startRouter();
  document.getElementById('app').classList.add('ready');
})();

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
