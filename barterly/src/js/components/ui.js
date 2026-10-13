// HTML builders for the pieces every screen reuses.
import { icon } from '../icons.js';
import { esc, timeAgo } from '../util.js';
import { catEmoji, stateLabel } from '../data/mock.js';

/* ---------- Images with graceful fallbacks ---------- */
const hue = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const uri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

export function fallbackSrc(kind, label = '') {
  if (kind === 'avatar') {
    const ini = (label.replace(/^@/, '').trim()[0] || '?').toUpperCase(), h = hue(label);
    return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="hsl(${h} 60% 45%)"/><text x="40" y="53" font-family="Inter,sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${esc(ini)}</text></svg>`);
  }
  const e = catEmoji(label), h = hue(label);
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h} 70% 55%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360} 75% 45%)"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><text x="200" y="185" font-size="110" text-anchor="middle">${e}</text></svg>`);
}

export function img({ src, alt = '', cls = '', kind = 'item', label = '', lazy = true, size }) {
  const dim = size ? ` width="${size}" height="${size}"` : '';
  return `<img src="${esc(src || fallbackSrc(kind, label))}" alt="${esc(alt)}" class="${cls}" data-fade data-kind="${kind}" data-label="${esc(label)}"${lazy ? ' loading="lazy"' : ''} decoding="async"${dim}>`;
}

export const avatar = (src, name, size = 36) =>
  img({ src, alt: '', cls: 'avatar', kind: 'avatar', label: name, size });

export function installImageHandlers() {
  document.addEventListener('load', e => {
    if (e.target.tagName === 'IMG') e.target.classList.add('loaded');
  }, true);
  document.addEventListener('error', e => {
    const i = e.target;
    if (i.tagName !== 'IMG' || i.dataset.failed) return;
    i.dataset.failed = '1';
    i.src = fallbackSrc(i.dataset.kind, i.dataset.label);
  }, true);
}

/* ---------- Small atoms ---------- */
export const verifiedMark = (size = 14) => `<span class="verified" title="Verified trader" role="img" aria-label="Verified trader">${icon('checkc', size)}</span>`;
export const ratingText = (r, trades) => r ? `${Number(r).toFixed(1)} ★ · ${trades} trades` : `New trader · ${trades} trades`;

/* ---------- Listing card ---------- */
export function listingCard(item, { index = 0, saved = false } = {}) {
  return `
  <article class="card listing reveal" style="--i:${index}">
    <div class="listing-media media-box">
      ${img({ src: item.image, alt: item.title, label: item.category })}
      <span class="pill pill-dark tl">${catEmoji(item.category)} ${esc(item.category)}</span>
      <button class="icon-btn glass heart tr ${saved ? 'on' : ''}" data-action="toggle-save" data-id="${esc(item.id)}" aria-pressed="${saved}" aria-label="${saved ? 'Remove from saved' : 'Save listing'}">${icon('heart', 20)}</button>
    </div>
    <div class="listing-body">
      <div class="row between" style="align-items:flex-start">
        <h3 class="grow"><a href="#/item/${esc(item.id)}">${esc(item.title)}</a></h3>
      </div>
      <div class="row t-caption t-muted" style="gap:6px">${icon('pin', 13)}<span>${esc(stateLabel(item.hub))}</span><span aria-hidden="true">·</span><span>${timeAgo(item.createdAt)}</span></div>
      <div class="swapbox">${icon('swap', 18)}<div><div class="t-eyebrow">Wants in return</div><p>${esc(item.want)}</p></div></div>
      <div class="listing-foot">
        <div class="row grow" style="gap:8px;min-width:0">
          ${avatar(item.userPhoto, item.user, 34)}
          <div style="min-width:0">
            <div class="row t-small" style="gap:4px;font-weight:700"><span class="truncate">${esc(item.user)}</span>${item.verified ? verifiedMark() : ''}</div>
            <div class="t-caption t-muted">${ratingText(item.userRating, item.userTrades)}</div>
          </div>
        </div>
        ${item.mine ? `<span class="pill pill-success">Your listing</span>`
          : `<button class="btn btn-primary btn-sm" data-action="propose" data-id="${esc(item.id)}">Swap ${icon('arrow', 15)}</button>`}
      </div>
    </div>
  </article>`;
}

export const skeletonCards = (n = 3) => Array.from({ length: n }, () => `
  <div class="card skel-card" aria-hidden="true">
    <div class="skel skel-media"></div>
    <div class="skel-body">
      <div class="skel" style="height:16px;width:80%"></div>
      <div class="skel" style="height:44px"></div>
      <div class="row" style="gap:10px"><div class="skel" style="width:34px;height:34px;border-radius:50%"></div><div class="skel" style="height:12px;width:40%"></div></div>
    </div>
  </div>`).join('');

/* ---------- States ---------- */
export const emptyState = ({ icon: ic = 'box', title, text, action }) => `
  <div class="state reveal">
    <div class="state-art">${icon(ic, 38)}</div>
    <h3>${esc(title)}</h3><p>${esc(text)}</p>
    ${action ? `<button class="btn btn-primary" ${action.attrs}>${esc(action.label)}</button>` : ''}
  </div>`;

export const errorState = (message, retryAction = 'retry') => `
  <div class="state is-error reveal">
    <div class="state-art">${icon('wifioff', 38)}</div>
    <h3>Couldn’t load this</h3><p>${esc(message)}</p>
    <button class="btn btn-soft" data-action="${retryAction}">${icon('refresh', 18)} Try again</button>
  </div>`;

/* ---------- Top bars ---------- */
export const backButton = (label = 'Back') =>
  `<button class="icon-btn plain" data-action="back" aria-label="${label}">${icon('left', 24)}</button>`;

export const brandRow = () => `
  <a href="#/home" class="brand" aria-label="Barterly home">
    <span class="brand-mark">${icon('swap', 20)}</span>
    <span><span class="brand-name">Barterly</span></span>
  </a>`;

export const hubChip = hub => `
  <button class="hub-chip" data-action="open-hub" aria-label="Change state, currently ${esc(hub)}">
    ${icon('pin', 15)}<span data-hub-label>${esc(hub)}</span>${icon('down', 14)}
  </button>`;

/* ---------- Form fields ---------- */
export function field({ id, label, type = 'text', placeholder = '', autocomplete = 'off', inputmode, value = '', required = true, hint = '', maxlength, enterkeyhint, leading, trailing, multiline = false, rows = 3, attrs = '' }) {
  const common = `id="${id}" name="${id}" ${required ? 'required' : ''} placeholder="${esc(placeholder)}" autocomplete="${autocomplete}" aria-describedby="${id}-err${hint ? ` ${id}-hint` : ''}" ${maxlength ? `maxlength="${maxlength}"` : ''} ${attrs}`;
  const control = multiline
    ? `<textarea class="textarea" ${common} rows="${rows}">${esc(value)}</textarea>`
    : `<input class="input" type="${type}" ${common} ${inputmode ? `inputmode="${inputmode}"` : ''} ${enterkeyhint ? `enterkeyhint="${enterkeyhint}"` : ''} value="${esc(value)}" autocapitalize="${type === 'email' || id.includes('ser') ? 'none' : 'sentences'}" spellcheck="false">`;
  const body = leading ? `<div class="input-icon">${icon(leading, 18)}${control}</div>`
    : trailing ? `<div class="input-wrap">${control}${trailing}</div>` : control;
  return `<div class="field"><label for="${id}">${label}</label>${body}${hint ? `<span class="hint" id="${id}-hint">${hint}</span>` : ''}<p class="field-error" id="${id}-err" role="alert"></p></div>`;
}

export function setFieldError(root, id, message) {
  const input = root.querySelector('#' + id), err = root.querySelector('#' + id + '-err');
  if (err) err.textContent = message || '';
  if (input) { message ? input.setAttribute('aria-invalid', 'true') : input.removeAttribute('aria-invalid'); }
  return !message;
}
export function clearErrors(root) {
  root.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
  root.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; });
}
export function setLoading(btn, on) {
  if (!btn) return;
  btn.classList.toggle('is-loading', on);
  btn.disabled = on;
  btn.setAttribute('aria-busy', on);
}
