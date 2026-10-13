import { icon } from '../icons.js';
import { actions, forms, inputs } from '../actions.js';
import { chats } from '../services/chats.js';
import { avatar, img, backButton, verifiedMark, errorState, setLoading } from '../components/ui.js';
import { openSheet } from '../components/sheet.js';
import { toast } from '../components/toast.js';
import { confetti } from '../components/fx.js';
import { esc, clock, vibrate } from '../util.js';

export const title = () => 'Chat';
export const flex = true;

const QUICK = ['Is it still available?', 'Where can we meet?', 'Can you send more photos?', 'Deal! 🤝'];

const bubble = m => `<div class="bubble ${m.sender === 'me' ? 'me' : 'them'} msg" data-msg="${esc(m.id)}">${esc(m.text)}<time>${clock(m.ts)}</time></div>`;
const typingBubble = () => `<div class="bubble them typing-b msg" data-typing aria-label="Typing"><span class="typing"><i></i><i></i><i></i></span></div>`;

function statusBlock(c) {
  if (c.status === 'swapped') return `<span class="pill pill-success">${icon('checkc', 13)} Swapped ${'★'.repeat(c.rating || 0)}</span>`;
  if (c.status === 'disputed') return `<span class="pill pill-warn">${icon('alert', 13)} Dispute open</span>`;
  return `<button class="btn btn-primary btn-sm" data-action="confirm-receipt">${icon('shield', 16)} Confirm receipt</button>`;
}

export async function render({ params }) {
  let c;
  try { c = await chats.get(params.id); }
  catch (e) { return `<header class="thread-top">${backButton()}<b>Chat</b></header>${errorState(e.message, 'back')}`; }
  return `
  <header class="thread-top">
    ${backButton()}
    ${avatar(c.partnerPhoto, c.partner, 40)}
    <div class="grow"><div class="row" style="gap:4px;font-weight:800">${esc(c.partner)} ${c.verified ? verifiedMark(15) : ''}</div>
      <div class="t-caption t-muted">${c.partnerRating ? Number(c.partnerRating).toFixed(1) + ' ★ · ' : ''}<span class="row" style="display:inline-flex;gap:4px"><i class="live-dot" style="margin:0"></i>In-app chat</span></div></div>
  </header>
  <div class="item-strip">
    ${img({ src: c.itemImage, alt: '', label: 'Others', lazy: false })}
    <div class="grow"><div class="t-caption t-muted">${c.offered ? 'Swap: ' + esc(c.offered.title) + ' ⇄' : 'About'}</div><b class="t-small clamp-2" style="line-height:1.25">${esc(c.itemTitle)}</b></div>
    <div data-status style="flex:none">${statusBlock(c)}</div>
  </div>
  <div class="thread-msgs" data-msgs aria-live="polite">
    <div class="alert info reveal" style="font-weight:500;align-items:flex-start;margin-bottom:6px">${icon('shield', 18)}<span><b>Stay safe.</b> Keep chats in the app, meet in a busy public place and check the item before you confirm.</span></div>
    ${c.messages.map(bubble).join('')}
  </div>
  <div class="composer">
    <div class="quick" data-quick ${c.status !== 'active' ? 'hidden' : ''}>${QUICK.map(q => `<button class="chip" data-action="quick" data-text="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <form class="composer-row" data-form="send" autocomplete="off">
      <input class="input" id="chatInput" data-input="chat" placeholder="Type a message…" aria-label="Message" enterkeyhint="send" autocomplete="off" ${c.status === 'disputed' ? 'disabled' : ''}>
      <button class="send" type="submit" aria-label="Send message" disabled>${icon('send', 20)}</button>
    </form>
  </div>`;
}

export function mount(el, { params }) {
  const id = params.id;
  const box = el.querySelector('[data-msgs]');
  if (!box) return;
  const input = el.querySelector('#chatInput'), sendBtn = el.querySelector('.send');
  const toBottom = (smooth = true) => box.scrollTo({ top: box.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  toBottom(false);
  chats.markRead(id);

  inputs.chat = i => { sendBtn.disabled = !i.value.trim(); };

  async function send(text) {
    text = text.trim(); if (!text) return;
    input.value = ''; sendBtn.disabled = true; vibrate(6);
    const m = await chats.send(id, text);
    box.insertAdjacentHTML('beforeend', bubble(m));
    el.querySelector('[data-quick]')?.setAttribute('hidden', '');
    toBottom();
    box.insertAdjacentHTML('beforeend', typingBubble()); toBottom();
    try {
      const r = await chats.reply(id, text);
      box.querySelector('[data-typing]')?.remove();
      if (!el.isConnected) return;
      box.insertAdjacentHTML('beforeend', bubble(r)); toBottom(); vibrate(8);
    } catch { box.querySelector('[data-typing]')?.remove(); }
  }
  forms.send = () => send(input.value);
  actions.quick = btn => send(btn.dataset.text);

  /* ---- Confirm receipt → rate → celebrate, or dispute ---- */
  actions['confirm-receipt'] = async () => {
    const c = await chats.get(id);
    const sheet = openSheet({
      title: 'Did you receive your item?',
      html: `<p class="t-small t-soft">Confirm only after you’ve met, checked the item and are happy with the swap.</p>
        <div class="sheet-actions">
          <button class="btn btn-primary btn-block" data-step="rate">${icon('checkc', 18)} Yes, all good</button>
          <button class="btn btn-danger-soft btn-block" data-step="dispute">${icon('alert', 18)} I have a problem</button>
        </div>`,
    });
    let pick = 5;
    const stars = () => [1, 2, 3, 4, 5].map(n => `<button type="button" class="${n <= pick ? 'on' : ''}" data-star="${n}" role="radio" aria-checked="${n === pick}" aria-label="${n} star${n > 1 ? 's' : ''}">${icon('star', 34, n <= pick ? 'fill' : '')}</button>`).join('');

    sheet.el.addEventListener('click', async e => {
      const step = e.target.closest('[data-step]')?.dataset.step;
      if (step === 'rate') {
        sheet.setContent(`<p class="t-small t-soft center">How was ${esc(c.partner)}?</p>
          <div class="stars" role="radiogroup" aria-label="Rating" data-stars style="margin:12px 0">${stars()}</div>
          <textarea class="textarea" id="rateNote" rows="2" placeholder="Leave a short comment (optional)"></textarea>
          <div class="sheet-actions"><button class="btn btn-primary btn-block" data-complete>Complete swap</button></div>`, 'Rate this swap');
      } else if (step === 'dispute') {
        sheet.setContent(`<p class="t-small t-soft">Tell us what went wrong. The swap stays on hold until our team reviews it.</p>
          <div class="field" style="margin-top:12px"><textarea class="textarea" id="disputeNote" rows="3" placeholder="e.g. Item not as described, or never arrived" aria-describedby="disputeNote-err"></textarea><p class="field-error" id="disputeNote-err" role="alert"></p></div>
          <div class="sheet-actions"><button class="btn btn-danger btn-block" data-submit-dispute>Open dispute</button></div>`, 'Report a problem');
      }
      const star = e.target.closest('[data-star]');
      if (star) {
        pick = +star.dataset.star; vibrate(6);
        sheet.$('[data-stars]').innerHTML = stars();
        sheet.$(`[data-star="${pick}"]`).classList.add('bump');
      }
      const done = e.target.closest('[data-complete]');
      if (done) {
        setLoading(done, true);
        try {
          const upd = await chats.complete(id, pick, sheet.$('#rateNote').value);
          sheet.setContent(`<div class="celebrate">
              <div class="celebrate-items">${img({ src: upd.offered?.image || upd.itemImage, alt: '', label: 'Others', lazy: false })}${img({ src: upd.itemImage, alt: '', label: 'Others', lazy: false })}<span class="burst"></span><span class="seal">${icon('check', 24)}</span></div>
              <h3 class="t-title">Swap complete!</h3>
              <p class="t-small t-soft" style="margin-top:6px">Thanks for rating ${esc(c.partner)}. Another happy barter.</p>
            </div><div class="sheet-actions"><button class="btn btn-primary btn-block" data-sheet-close>Done</button></div>`, 'Swap complete');
          confetti({ x: 50, y: 55 });
          el.querySelector('[data-status]').innerHTML = statusBlock(upd);
          el.querySelector('[data-quick]')?.setAttribute('hidden', '');
        } catch (err) { setLoading(done, false); toast(err.message, 'error'); }
      }
      const sd = e.target.closest('[data-submit-dispute]');
      if (sd) {
        const note = sheet.$('#disputeNote').value.trim();
        if (!note) { sheet.$('#disputeNote-err').textContent = 'Please describe the problem.'; sheet.$('#disputeNote').setAttribute('aria-invalid', 'true'); return; }
        setLoading(sd, true);
        try {
          const upd = await chats.dispute(id, note);
          sheet.close(); toast('Dispute opened. We’ll review within 24 hours.', 'info');
          el.querySelector('[data-status]').innerHTML = statusBlock(upd);
          el.querySelector('[data-quick]')?.setAttribute('hidden', '');
          input.disabled = true;
        } catch (err) { setLoading(sd, false); toast(err.message, 'error'); }
      }
    });
  };
  setTimeout(() => input.focus({ preventScroll: true }), 400);
}
