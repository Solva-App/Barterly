// Shared flows opened from several screens: pick state, propose a swap.
import { openSheet } from './sheet.js';
import { toast } from './toast.js';
import { icon } from '../icons.js';
import { esc, vibrate } from '../util.js';
import { STATES, stateLabel, STATE_SWAPS } from '../data/mock.js';
import { store } from '../store.js';
import { listings } from '../services/listings.js';
import { chats } from '../services/chats.js';
import { navigate } from '../router.js';
import { setLoading, img } from './ui.js';

export function openHubSheet() {
  const sheet = openSheet({
    title: 'Choose your state',
    html: `<p class="t-small t-muted" style="margin-bottom:12px">See swaps available near you.</p>
      <div class="stack" style="--gap:8px" role="radiogroup" aria-label="State">
        ${STATES.map(s => `<button class="offer" role="radio" aria-checked="${s === store.state.hub}" data-hub="${esc(s)}">
          <span style="font-weight:700">${esc(stateLabel(s))}</span>
          <span class="t-caption t-muted">${STATE_SWAPS[s]}+ swaps</span>
          <span class="tick">${icon('check', 14)}</span></button>`).join('')}
      </div>
      <p class="t-caption t-muted center" style="margin-top:16px">More states coming soon</p>`,
  });
  sheet.el.addEventListener('click', e => {
    const b = e.target.closest('[data-hub]');
    if (!b) return;
    vibrate(8);
    store.set({ hub: b.dataset.hub });
    toast(`Switched to ${stateLabel(b.dataset.hub)}`);
    sheet.close();
  });
}

export async function proposeFlow(itemId) {
  let item, mine;
  try { [item, mine] = await Promise.all([listings.get(itemId), listings.mine()]); }
  catch (e) { return toast(e.message, 'error'); }
  if (item.mine) return toast('That’s your own listing.', 'info');

  let picked = null;
  const optionsHTML = () => `
    <div class="stack" style="--gap:8px" role="radiogroup" aria-label="What will you offer?">
      ${mine.map(m => `<button class="offer" role="radio" aria-checked="${picked === m.id}" data-pick="${esc(m.id)}">
        ${img({ src: m.image, alt: '', label: m.category })}
        <span class="grow"><b class="t-small truncate" style="display:block">${esc(m.title)}</b><span class="t-caption t-muted">Ready to swap</span></span>
        <span class="tick">${icon('check', 14)}</span></button>`).join('')}
      <button class="offer" role="radio" aria-checked="${picked === null}" data-pick="">
        <span class="step-ic">${icon('chat', 20)}</span>
        <span class="grow"><b class="t-small" style="display:block">I’ll describe it in chat</b><span class="t-caption t-muted">Agree the details with them</span></span>
        <span class="tick">${icon('check', 14)}</span></button>
    </div>`;

  const sheet = openSheet({
    title: 'What will you offer?',
    html: `<div class="row" style="margin-bottom:16px;padding:10px;border-radius:14px;background:var(--surface-2)">
        ${img({ src: item.image, alt: '', cls: 'avatar', label: item.category, size: 48 }).replace('avatar', 'avatar" style="border-radius:12px')}
        <div class="grow"><div class="t-caption t-muted">You’re swapping for</div><b class="t-small clamp-2">${esc(item.title)}</b></div></div>
      ${mine.length ? '' : `<div class="alert info" style="margin-bottom:12px">${icon('info', 18)}<span>You haven’t posted an item yet. Post one so they can see what you’re offering, or just start the chat.</span></div>`}
      <div data-options>${optionsHTML()}</div>
      <div class="sheet-actions">
        <button class="btn btn-primary btn-block" data-start>${icon('chat', 18)} Start chat</button>
        ${mine.length ? '' : `<button class="btn btn-soft btn-block" data-post>${icon('plus', 18)} Post an item first</button>`}
      </div>`,
  });
  sheet.el.addEventListener('click', async e => {
    const pick = e.target.closest('[data-pick]');
    if (pick) { picked = pick.dataset.pick || null; vibrate(6); sheet.$('[data-options]').innerHTML = optionsHTML(); return; }
    if (e.target.closest('[data-post]')) { sheet.close(); navigate('/post'); return; }
    const start = e.target.closest('[data-start]');
    if (start) {
      setLoading(start, true);
      try {
        const id = await chats.openForItem(item, mine.find(m => m.id === picked));
        sheet.close(); navigate(`/chats/${id}`); toast('Secure chat opened');
      } catch (err) { setLoading(start, false); toast(err.message, 'error'); }
    }
  });
}
