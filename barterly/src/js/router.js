// Hash router with protected routes, lazy page modules and direction-aware transitions.
import { auth } from './services/auth.js';
import { setActiveTab, TAB_INDEX } from './components/tabbar.js';
import { reducedMotion } from './util.js';
import { applyTheme } from './theme.js';

const AUTH_DEPTH = { landing: 0, onboard: 1, login: 1, signup: 2, forgot: 2, sent: 3 };

const ROUTES = [
  { path: '/auth/:view', page: 'auth', chrome: 'none', public: true, depth: p => AUTH_DEPTH[p.view] ?? 0 },
  { path: '/home', page: 'home', tab: 'home', depth: 0 },
  { path: '/explore', page: 'explore', tab: 'explore', depth: 0 },
  { path: '/explore/:state', page: 'explore', tab: 'explore', depth: 1, parent: '/explore' },
  { path: '/post', page: 'post', tab: 'post', depth: 0 },
  { path: '/chats', page: 'chats', tab: 'chats', depth: 0 },
  { path: '/chats/:id', page: 'thread', tab: 'chats', depth: 1, chrome: 'none', parent: '/chats' },
  { path: '/profile', page: 'profile', tab: 'profile', depth: 0 },
  { path: '/item/:id', page: 'detail', depth: 1, chrome: 'none', parent: '/home' },
].map(r => ({ ...r, re: new RegExp('^' + r.path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$') }));

const view = () => document.getElementById('view');
const app = () => document.getElementById('app');

let current = null;        // { el, route, path, params, cleanup }
let navId = 0;
const scrollMemory = new Map();
let stack = [];

function match(path) {
  for (const route of ROUTES) {
    const m = route.re.exec(path);
    if (m) return { route, params: Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)])) };
  }
  return null;
}
const depthOf = ({ route, params }) => typeof route.depth === 'function' ? route.depth(params) : route.depth;

export function navigate(path, { replace = false } = {}) {
  const target = '#' + path;
  if (location.hash === target) return resolve();
  if (replace) location.replace(target); else location.hash = target;
}

export function back(fallback) {
  const cur = match(location.hash.slice(1));
  if (stack.length > 1) history.back();
  else navigate(fallback || cur?.route.parent || '/home', { replace: true });
}

function direction(from, to) {
  if (!from) return 'fade';
  if (from.route.public && !to.route.public) return 'rise';
  if (!from.route.public && to.route.public) return 'fade';
  const df = depthOf(from), dt = depthOf(to);
  if (dt > df) return 'push';
  if (dt < df) return 'pop';
  if (from.route.tab && to.route.tab && from.route.tab !== to.route.tab) return TAB_INDEX[to.route.tab] > TAB_INDEX[from.route.tab] ? 'tab-r' : 'tab-l';
  return 'fade';
}

async function resolve() {
  let path = location.hash.slice(1) || '/';
  if (path === '/') path = auth.isSignedIn() ? '/home' : '/auth/landing';
  const m = match(path);
  if (!m) return navigate(auth.isSignedIn() ? '/home' : '/auth/landing', { replace: true });

  // Guards
  if (!m.route.public && !auth.isSignedIn()) return navigate('/auth/landing', { replace: true });
  if (m.route.public && auth.isSignedIn()) return navigate('/home', { replace: true });

  // Back/forward bookkeeping
  if (stack[stack.length - 2] === path) stack.pop();
  else if (stack[stack.length - 1] !== path) stack.push(path);

  const my = ++navId;
  let mod;
  try { mod = await import(`./pages/${m.route.page}.js`); }
  catch (e) { console.error(e); return; }
  if (my !== navId) return;

  const prev = current;
  if (prev) scrollMemory.set(prev.path, prev.el.scrollTop);
  prev?.cleanup?.();

  const el = document.createElement('section');
  el.className = 'screen' + (m.route.chrome === 'none' ? '' : ' has-tabbar') + (mod.flex ? ' is-flex' : '');
  el.tabIndex = -1;
  const ctx = { params: m.params, path, el, route: m.route };
  el.innerHTML = await mod.render(ctx);
  if (my !== navId) return;

  const dir = direction(prev, m);
  app().dataset.chrome = m.route.chrome === 'none' ? 'none' : 'tabs';
  setActiveTab(m.route.tab ?? null);
  view().append(el);
  const cleanup = mod.mount?.(el, ctx);
  current = { el, route: m.route, path, params: m.params, cleanup };

  if (!m.route.chrome && scrollMemory.has(path) && dir !== 'push') el.scrollTop = scrollMemory.get(path);

  if (prev) {
    prev.el.inert = true;
    if (reducedMotion() || dir === 'fade' && false) { prev.el.remove(); }
    else {
      prev.el.classList.add('leave-' + dir);
      el.classList.add('enter-' + dir);
      const clean = () => { el.classList.remove('enter-' + dir); el.style.overflowY = ''; };
      el.addEventListener('animationend', clean, { once: true });
      setTimeout(() => { prev.el.remove(); clean(); }, 460);
    }
  }
  document.title = mod.title ? `${mod.title(ctx)} · Barterly` : 'Barterly';
  applyTheme();
  el.focus({ preventScroll: true });
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  return resolve();
}
export const currentPath = () => current?.path;
