import { icon } from '../icons.js';
import { actions, inputs } from '../actions.js';
import { store } from '../store.js';
import { brandRow, hubChip } from '../components/ui.js';
import { createList } from '../components/listing-list.js';
import { CATEGORIES, stateLabel } from '../data/mock.js';
import { debounce, esc, vibrate } from '../util.js';

export const title = () => 'Home';

// Filters survive tab switches
const filters = { category: 'All', query: '' };

const chips = () => ['All', ...CATEGORIES.map(c => c.name)].map(name => {
  const emoji = CATEGORIES.find(c => c.name === name)?.emoji;
  return `<button class="chip" data-action="set-category" data-cat="${esc(name)}" aria-pressed="${filters.category === name}">${emoji ? emoji + ' ' : ''}${esc(name)}</button>`;
}).join('');

export function render() {
  const { hub, user } = store.state;
  const first = user?.name.split(' ')[0] || 'there';
  return `
  <header class="topbar">${brandRow()}<span class="grow"></span>${hubChip(hub)}</header>
  <div class="ptr" data-ptr aria-hidden="true">${icon('refresh', 22)}</div>
  <section class="hero reveal" aria-label="Search">
    <span class="pill" style="background:rgba(255,255,255,.2);color:#fff">${icon('shield', 13)} Secure P2P swaps</span>
    <h1 class="t-title" style="margin-top:10px">Hi ${esc(first)}, what will you trade today?</h1>
    <p style="margin-top:4px">Swapping in <b data-hub-name>${esc(stateLabel(hub))}</b> — pay with what you have, not cash.</p>
    <form class="search" role="search" onsubmit="return false">
      ${icon('search', 20)}
      <input type="search" id="q" data-input="search" value="${esc(filters.query)}" placeholder="Search yams, phones, wigs…" aria-label="Search listings" inputmode="search" enterkeyhint="search" autocomplete="off">
    </form>
  </section>
  <div class="chips-sticky"><div class="chip-row" role="group" aria-label="Categories" data-chips>${chips()}</div></div>
  <div class="section row between" style="margin:8px 0 12px">
    <h2 class="t-heading" data-heading>Featured swaps</h2>
    <span class="pill pill-brand" data-count hidden></span>
  </div>
  <div data-list></div>`;
}

export function mount(el) {
  const list = createList(el.querySelector('[data-list]'), {
    params: () => ({ hub: store.state.hub, category: filters.category, query: filters.query }),
    onCount: n => {
      const c = el.querySelector('[data-count]');
      c.hidden = n == null; if (n != null) c.textContent = `${n} available`;
    },
    empty: p => ({
      icon: 'search', title: p.query ? 'No matches' : 'Nothing here yet',
      text: p.query ? `Nothing matched “${p.query}” in ${stateLabel(p.hub)}. Try a different word.` : `Be the first to post in ${stateLabel(p.hub)} for this category.`,
      action: { label: 'Post an item', attrs: 'data-action="go" data-to="/post"' },
    }),
  });
  const heading = () => { el.querySelector('[data-heading]').textContent = `Featured swaps in ${stateLabel(store.state.hub)}`; el.querySelector('[data-hub-name]').textContent = stateLabel(store.state.hub); };
  heading(); list.load();

  const search = debounce(v => { filters.query = v; list.load(); }, 260);
  inputs.search = i => search(i.value);

  actions['set-category'] = btn => {
    filters.category = btn.dataset.cat; vibrate(6);
    el.querySelectorAll('[data-chips] .chip').forEach(c => c.setAttribute('aria-pressed', c === btn));
    btn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    list.load();
  };

  const off = store.on((_, patch) => { if ('hub' in patch) { heading(); list.load(); } });

  // Pull to refresh (touch)
  const ptr = el.querySelector('[data-ptr]');
  let y0 = null, pulled = 0;
  el.addEventListener('touchstart', e => { y0 = el.scrollTop === 0 ? e.touches[0].clientY : null; pulled = 0; }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (y0 == null) return;
    pulled = Math.max(0, e.touches[0].clientY - y0);
    ptr.style.height = Math.min(56, pulled * .45) + 'px';
  }, { passive: true });
  el.addEventListener('touchend', async () => {
    if (y0 == null) return;
    y0 = null;
    if (pulled > 90) { vibrate(10); ptr.classList.add('on'); ptr.style.height = ''; await list.load({ quiet: true }); setTimeout(() => ptr.classList.remove('on'), 500); }
    else ptr.style.height = '';
  });

  return () => { off(); list.destroy(); };
}
