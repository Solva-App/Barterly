import { icon } from '../icons.js';
import { actions } from '../actions.js';
import { listings } from '../services/listings.js';
import { store } from '../store.js';
import { img, avatar, verifiedMark, ratingText, errorState, emptyState } from '../components/ui.js';
import { catEmoji, stateLabel } from '../data/mock.js';
import { esc, timeAgo, reducedMotion, vibrate } from '../util.js';
import { toast } from '../components/toast.js';

export const title = () => 'Listing';

export async function render({ params }) {
  let item;
  try { item = await listings.get(params.id); }
  catch (e) {
    return `<header class="topbar"><button class="icon-btn plain" data-action="back" aria-label="Back">${icon('left', 24)}</button></header>${
      e.code === 'not_found' ? emptyState({ icon: 'box', title: 'Listing not found', text: e.message, action: { label: 'Browse swaps', attrs: 'data-action="go" data-to="/home"' } }) : errorState(e.message, 'retry-detail')}`;
  }
  const saved = store.state.saved.has(item.id);
  return `
    <div class="detail-hero" data-hero>
      ${img({ src: item.image, alt: item.title, label: item.category, lazy: false })}
      <div class="detail-bar">
        <button class="icon-btn glass" data-action="back" aria-label="Back">${icon('left', 22)}</button>
        <button class="icon-btn glass heart ${saved ? 'on' : ''}" data-action="toggle-save" data-id="${esc(item.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save listing'}">${icon('heart', 22)}</button>
      </div>
    </div>
    <div class="detail-sheet stack" style="--gap:20px">
      <div class="reveal">
        <div class="row" style="gap:8px;margin-bottom:8px"><span class="pill pill-brand">${catEmoji(item.category)} ${esc(item.category)}</span><span class="pill pill-glass" style="background:var(--surface-2)">${icon('pin', 12)} ${esc(stateLabel(item.hub))}</span></div>
        <h1 class="t-title">${esc(item.title)}</h1>
        <p class="t-small t-muted row" style="gap:6px;margin-top:4px">${icon('clock', 14)} Posted ${timeAgo(item.createdAt)}</p>
      </div>

      <section class="swap-visual reveal" style="--i:1" aria-label="Swap terms">
        <div class="swap-side">
          <span class="t-eyebrow">They offer</span>
          ${img({ src: item.image, alt: '', label: item.category })}
          <p class="clamp-2">${esc(item.title)}</p>
        </div>
        <div class="swap-mid"><span>${icon('swap', 18)}</span></div>
        <div class="swap-side want">
          <span class="t-eyebrow" style="color:var(--brand-ink)">They want</span>
          <div class="step-ic" style="background:var(--surface);width:100%;height:64px;border-radius:10px">${icon('sparkles', 26)}</div>
          <p class="clamp-2">${esc(item.want)}</p>
        </div>
      </section>

      <section class="card card-pad reveal" style="--i:2">
        <h2 class="t-eyebrow" style="margin-bottom:12px">About the trader</h2>
        <div class="row">
          ${avatar(item.userPhoto, item.user, 52)}
          <div class="grow"><div class="row" style="gap:5px;font-weight:800">${esc(item.user)} ${item.verified ? verifiedMark(16) : ''}</div>
            <div class="t-small t-muted">${ratingText(item.userRating, item.userTrades)}</div></div>
          <span class="pill ${item.verified ? 'pill-success' : 'pill-warn'}">${item.verified ? 'ID verified' : 'Not verified'}</span>
        </div>
      </section>

      <section class="alert info reveal" style="--i:3;align-items:flex-start">${icon('shield', 20)}
        <div><b>Meet safely</b><p style="font-weight:500;margin-top:2px">Chat in the app, meet in a busy public place, check the item before you confirm the swap.</p></div></section>
    </div>
    <div class="cta-bar">
      ${item.mine ? `<div class="alert info grow" style="justify-content:center">This is your listing</div>`
        : `<button class="btn btn-primary grow" data-action="propose" data-id="${esc(item.id)}">${icon('swap', 20)} Propose swap</button>`}
    </div>`;
}

export function mount(el) {
  const hero = el.querySelector('[data-hero]');
  if (!hero) return;
  const pic = hero.querySelector('img');

  // Parallax: image drifts slower than the scroll
  if (!reducedMotion()) {
    let raf = 0;
    el.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { pic.style.transform = `translateY(${el.scrollTop * .35}px) scale(${1 + Math.max(0, -el.scrollTop) / 800})`; });
    }, { passive: true });
  }

  // Double-tap the photo to save
  let last = 0;
  hero.addEventListener('pointerup', e => {
    if (e.target.closest('button')) return;
    const now = Date.now();
    if (now - last < 320) {
      const btn = el.querySelector('.heart');
      if (!btn.classList.contains('on')) btn.click();
      const h = document.createElement('div');
      h.className = 'heart-burst'; h.innerHTML = icon('heart', 88, 'fill');
      hero.append(h); setTimeout(() => h.remove(), 800);
      vibrate(16);
    }
    last = now;
  });

  actions['retry-detail'] = () => location.reload();
}
