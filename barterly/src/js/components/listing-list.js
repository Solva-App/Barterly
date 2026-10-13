// Loads + renders a list of listings into a host element.
// Stale-while-revalidate: cached results paint instantly, then refresh quietly.
import { listings } from '../services/listings.js';
import { listingCard, skeletonCards, emptyState, errorState } from './ui.js';
import { store } from '../store.js';

const cache = new Map();

export function createList(host, { params, empty, onCount }) {
  let seq = 0;
  let lastIds = '';

  const paint = (items, force) => {
    const ids = items.map(i => i.id).join(',');
    onCount?.(items.length);
    if (!force && ids === lastIds) return;
    lastIds = ids;
    host.innerHTML = items.length
      ? `<div class="grid-list">${items.map((it, i) => listingCard(it, { index: i, saved: store.state.saved.has(it.id) })).join('')}</div>`
      : emptyState(empty(params()));
  };

  async function load({ quiet = false } = {}) {
    const p = params(), key = JSON.stringify(p), my = ++seq;
    const cached = cache.get(key);
    if (cached) paint(cached, !quiet);
    else if (!quiet || !lastIds) { lastIds = ''; onCount?.(null); host.innerHTML = `<div class="grid-list">${skeletonCards(3)}</div>`; }
    try {
      const items = await listings.list(p);
      if (my !== seq) return;
      cache.set(key, items);
      paint(items, !cached);
    } catch (err) {
      if (my !== seq) return;
      if (!cached) { lastIds = ''; onCount?.(null); host.innerHTML = errorState(err.message); }
    }
  }

  const retry = () => load();
  document.addEventListener('app:retry', retry);
  return { load, destroy() { seq++; document.removeEventListener('app:retry', retry); } };
}

export const invalidateListCache = () => cache.clear();
