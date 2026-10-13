// Bottom sheet: swipe-to-dismiss, Escape, scrim tap, focus trap + restore.
import { icon } from '../icons.js';
import { esc, reducedMotion } from '../util.js';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
let uidN = 0;

export function openSheet({ title = '', html = '', dismissible = true, onMount, onClose } = {}) {
  const layer = document.getElementById('layer');
  const opener = document.activeElement;
  const titleId = `sheet-title-${++uidN}`;

  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  if (title) sheet.setAttribute('aria-labelledby', titleId);
  sheet.tabIndex = -1;
  sheet.innerHTML = `
    <div class="sheet-grab" data-grab></div>
    ${title || dismissible ? `<div class="sheet-head" data-grab>
      <h2 class="t-heading" id="${titleId}">${esc(title)}</h2>
      ${dismissible ? `<button class="icon-btn" data-sheet-close aria-label="Close">${icon('x', 20)}</button>` : ''}
    </div>` : ''}
    <div class="sheet-body" data-sheet-body>${html}</div>`;
  layer.append(scrim, sheet);
  layer.style.pointerEvents = 'auto';

  let closed = false;
  const body = () => sheet.querySelector('[data-sheet-body]');

  function close(result) {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    sheet.classList.add('closing'); scrim.classList.add('closing');
    const done = () => {
      sheet.remove(); scrim.remove();
      if (!layer.children.length) layer.style.pointerEvents = 'none';
      opener?.isConnected && opener.focus?.({ preventScroll: true });
      onClose?.(result);
    };
    reducedMotion() ? done() : setTimeout(done, 240);
  }

  function onKey(e) {
    if (e.key === 'Escape' && dismissible && layer.lastElementChild === sheet) { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const f = [...sheet.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey, true);

  if (dismissible) {
    scrim.addEventListener('click', () => close());
    sheet.addEventListener('click', e => { if (e.target.closest('[data-sheet-close]')) close(); });

    // Drag down to dismiss (grab bar + header)
    let startY = 0, dy = 0, t0 = 0, dragging = false;
    sheet.addEventListener('pointerdown', e => {
      if (!e.target.closest('[data-grab]') || e.target.closest('button')) return;
      dragging = true; startY = e.clientY; dy = 0; t0 = performance.now();
      sheet.classList.add('dragging'); sheet.setPointerCapture(e.pointerId);
    });
    sheet.addEventListener('pointermove', e => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
      scrim.style.opacity = String(1 - Math.min(1, dy / 400));
    });
    const end = () => {
      if (!dragging) return;
      dragging = false; sheet.classList.remove('dragging');
      const v = dy / Math.max(1, performance.now() - t0);
      if (dy > 110 || v > .7) { sheet.style.setProperty('--drag', dy + 'px'); sheet.style.transform = ''; scrim.style.opacity = ''; close(); }
      else { sheet.style.transition = 'transform .3s var(--spring)'; sheet.style.transform = ''; scrim.style.opacity = ''; setTimeout(() => { sheet.style.transition = ''; }, 320); }
    };
    sheet.addEventListener('pointerup', end);
    sheet.addEventListener('pointercancel', end);
  }

  const api = {
    el: sheet,
    close,
    /** Swap the content in place (multi-step flows) with a soft cross-fade. */
    setContent(newHtml, newTitle) {
      const b = body();
      b.innerHTML = newHtml;
      b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'fadeUp .35s var(--ease) both';
      if (newTitle != null) { const h = sheet.querySelector('.sheet-head h2'); if (h) h.textContent = newTitle; }
      b.scrollTop = 0;
    },
    $: sel => sheet.querySelector(sel),
  };
  requestAnimationFrame(() => {
    (sheet.querySelector('[data-autofocus]') || sheet).focus({ preventScroll: true });
    onMount?.(api);
  });
  return api;
}

/** Promise-based confirm dialog. Resolves true/false. */
export function confirmSheet({ title, text, confirmLabel = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    let answer = false;
    const s = openSheet({
      title,
      html: `<p class="t-soft t-small">${esc(text)}</p>
        <div class="sheet-actions">
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-block" data-yes>${esc(confirmLabel)}</button>
          <button class="btn btn-ghost btn-block" data-no>Cancel</button>
        </div>`,
      onClose: () => resolve(answer),
    });
    s.el.addEventListener('click', e => {
      if (e.target.closest('[data-yes]')) { answer = true; s.close(); }
      else if (e.target.closest('[data-no]')) s.close();
    });
  });
}
