import { icon } from '../icons.js';
import { actions } from '../actions.js';
import { store } from '../store.js';
import { backButton, hubChip } from '../components/ui.js';
import { createList } from '../components/listing-list.js';
import { CATEGORIES, STATES, STATE_SWAPS, stateLabel } from '../data/mock.js';
import { countUp, esc, vibrate } from '../util.js';
import { navigate } from '../router.js';

export const title = ({ params }) => params.state ? stateLabel(params.state) : 'Explore';

let cat = 'All';

export function render({ params }) {
  if (!params.state) return `
    <header class="topbar"><h1 class="title grow">Explore</h1>${hubChip(store.state.hub)}</header>
    <div class="pad stack" style="--gap:20px;padding-top:8px">
      <section class="card card-pad reveal">
        <h2 class="t-heading">Four-state hub</h2>
        <p class="t-small t-muted" style="margin:2px 0 16px">Pick a state to see every swap available there.</p>
        <div class="state-grid">
          ${STATES.map((s, i) => `<button class="state-card reveal ${store.state.hub === s ? 'current' : ''}" style="--i:${i + 1}" data-action="open-state" data-state="${esc(s)}">
            <span class="letter" aria-hidden="true">${s[0]}</span>
            <b>${esc(stateLabel(s))}</b>
            <span><span data-count="${STATE_SWAPS[s]}">0</span>+ active swaps</span></button>`).join('')}
        </div>
      </section>
      <section class="guarantee reveal" style="--i:3">
        <div class="row" style="margin-bottom:12px"><span class="step-ic" style="background:rgba(251,85,119,.2);color:#fda4af">${icon('shield', 22)}</span>
          <div><h3 class="t-heading">Safe Swap Guarantee</h3><p class="t-caption" style="color:#cbd5e1">In-app chat and ID verification</p></div></div>
        <p class="t-small" style="color:#cbd5e1;line-height:1.6">Every swap on Barterly is negotiated in the app and confirmed by both people before ratings unlock. No scams, just fair exchanges.</p>
        <p class="t-small row" style="gap:6px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.12);color:#fda4af;font-weight:600">${icon('pin', 15)} More states coming soon</p>
      </section>
    </div>`;

  const s = params.state;
  return `
    <header class="topbar">${backButton()}<h1 class="title grow">${esc(stateLabel(s))}</h1></header>
    <div class="section"><div class="hero reveal" style="margin:0">
      <h2 class="t-title">${esc(stateLabel(s))}</h2>
      <p style="margin-top:2px"><b data-state-count>0</b>+ active swaps available right now</p></div></div>
    <div class="chips-sticky"><div class="chip-row" data-chips>
      ${['All', ...CATEGORIES.map(c => c.name)].map(n => `<button class="chip" data-action="explore-cat" data-cat="${esc(n)}" aria-pressed="${cat === n}">${n === 'All' ? '' : (CATEGORIES.find(c => c.name === n).emoji + ' ')}${esc(n)}</button>`).join('')}
    </div></div>
    <div class="section" style="margin:4px 0 12px"><span class="pill pill-brand" data-count-pill hidden></span></div>
    <div data-list></div>`;
}

export function mount(el, { params }) {
  if (!params.state) {
    el.querySelectorAll('[data-count]').forEach((n, i) => setTimeout(() => countUp(n, +n.dataset.count, { duration: 1100 }), 200 + i * 90));
    actions['open-state'] = btn => { vibrate(8); store.set({ hub: btn.dataset.state }); navigate(`/explore/${encodeURIComponent(btn.dataset.state)}`); };
    return;
  }
  const state = params.state;
  countUp(el.querySelector('[data-state-count]'), STATE_SWAPS[state] || 0, { duration: 900 });
  const list = createList(el.querySelector('[data-list]'), {
    params: () => ({ hub: state, category: cat }),
    onCount: n => { const p = el.querySelector('[data-count-pill]'); p.hidden = n == null; if (n != null) p.textContent = `${n} available`; },
    empty: () => ({ icon: 'box', title: 'Nothing in this category yet', text: 'Be the first to post one here.', action: { label: 'Post the first one', attrs: 'data-action="go" data-to="/post"' } }),
  });
  list.load();
  actions['explore-cat'] = btn => {
    cat = btn.dataset.cat; vibrate(6);
    el.querySelectorAll('[data-chips] .chip').forEach(c => c.setAttribute('aria-pressed', c === btn));
    list.load();
  };
  return () => list.destroy();
}
