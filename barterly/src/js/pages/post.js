import { icon } from '../icons.js';
import { actions, forms, inputs } from '../actions.js';
import { listings } from '../services/listings.js';
import { store } from '../store.js';
import { field, setFieldError, clearErrors, setLoading, img, emptyState } from '../components/ui.js';
import { confirmSheet } from '../components/sheet.js';
import { toast } from '../components/toast.js';
import { confetti } from '../components/fx.js';
import { invalidateListCache } from '../components/listing-list.js';
import { BANNED, CATEGORIES, STATES, stateLabel } from '../data/mock.js';
import { compressImage, esc, timeAgo, vibrate } from '../util.js';

export const title = () => 'Post an item';

let photo = '';

const mineHTML = items => `
  <section class="card card-pad stack" style="--gap:14px">
    <h2 class="t-heading">Your posted items</h2>
    <div class="stat-tiles">
      <div class="tile rose"><span class="step-ic" style="background:var(--surface);width:36px;height:36px">${icon('swap', 18)}</span><div><b>${items.length}</b><span>Active swaps</span></div></div>
      <div class="tile green"><span class="step-ic" style="background:var(--surface);width:36px;height:36px;color:var(--success)">${icon('shield', 18)}</span><div><b>${store.state.profile.tradesCount}</b><span>Completed</span></div></div>
    </div>
    ${items.length ? `<div class="stack" style="--gap:8px">${items.map((i, n) => `
      <div class="mine reveal" style="--i:${n}">
        ${img({ src: i.image, alt: i.title, label: i.category })}
        <div class="grow"><b class="t-small truncate" style="display:block">${esc(i.title)}</b>
          <span class="t-caption t-muted truncate" style="display:block">Wants: ${esc(i.want)}</span>
          <span class="pill pill-success" style="margin-top:4px">${esc(i.status)} · ${timeAgo(i.createdAt)}</span></div>
        <button class="icon-btn plain" data-action="remove-listing" data-id="${esc(i.id)}" aria-label="Remove ${esc(i.title)}">${icon('trash', 20)}</button>
      </div>`).join('')}</div>`
      : emptyState({ icon: 'camera', title: 'Nothing posted yet', text: 'Your listings will appear here once you publish one.' })}
  </section>`;

export async function render() {
  const p = store.state.profile;
  const items = await listings.mine();
  const hub = store.state.hub;
  return `
  <header class="topbar"><h1 class="title grow">Post an item</h1></header>
  <div class="pad stack" style="--gap:20px;padding-top:4px">
    ${p.flagged ? `<div class="alert danger" role="alert">${icon('flag', 20)}<span>Your account is flagged for banned items. Posting is paused while we review it.</span></div>` : ''}
    <section class="card card-pad reveal">
      <p class="t-small t-soft" style="margin-bottom:16px">List what you have and what you’d like in return.</p>
      <details class="acc" style="margin-bottom:16px"><summary><span class="row" style="gap:8px;color:var(--warn)">${icon('ban', 18)} Banned items · strike ${p.strikes}/3</span>${icon('down', 18)}</summary>
        <div class="acc-body"><p>Every listing is scanned. Posting any of these is a strike; 3 strikes flags your account.</p>
        <ul style="margin:8px 0 0 16px;list-style:disc">${BANNED.map(b => `<li><b>${esc(b.name)}</b>: ${esc(b.examples)}</li>`).join('')}</ul></div></details>
      <form data-form="post" novalidate class="stack" style="--gap:16px">
        <div class="field">
          <span class="label" id="photoLabel">Item photo</span>
          <div class="drop" data-drop aria-labelledby="photoLabel">
            <div class="state" style="padding:16px" data-drop-empty><div class="state-art" style="width:60px;height:60px;border-radius:20px;animation:none">${icon('image', 28)}</div><p>Add a clear photo of your item</p></div>
          </div>
          <div class="photo-actions">
            <label class="btn btn-soft btn-sm" style="cursor:pointer">${icon('camera', 18)} Camera<input type="file" accept="image/*" capture="environment" hidden data-photo></label>
            <label class="btn btn-ghost btn-sm" style="cursor:pointer">${icon('image', 18)} Gallery<input type="file" accept="image/*" hidden data-photo></label>
          </div>
          <p class="field-error" id="photo-err" role="alert"></p>
        </div>
        ${field({ id: 'postTitle', label: 'Item title', placeholder: 'e.g. Brand new blender', maxlength: 60, enterkeyhint: 'next', attrs: 'data-input="title-count"' })}
        <div class="counter" data-counter style="margin-top:-12px">0 / 60</div>
        <div class="field"><label for="postCategory">Category</label>
          <select class="select" id="postCategory">${CATEGORIES.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="postHub">State</label>
          <select class="select" id="postHub">${STATES.map(s => `<option value="${esc(s)}" ${s === hub ? 'selected' : ''}>${esc(stateLabel(s))}</option>`).join('')}</select></div>
        ${field({ id: 'postWant', label: 'What you want in return', multiline: true, rows: 2, placeholder: 'e.g. A generator, or food items', enterkeyhint: 'done' })}
        <div class="alert danger" data-banned-msg hidden role="alert">${icon('ban', 20)}<span></span></div>
        <button class="btn btn-primary btn-block" type="submit" ${p.flagged ? 'disabled' : ''}>Publish listing</button>
      </form>
    </section>
    <div data-mine class="reveal" style="--i:2">${mineHTML(items)}</div>
  </div>`;
}

export function mount(el) {
  photo = '';
  const form = el.querySelector('form'), drop = el.querySelector('[data-drop]');

  const setPhoto = src => {
    photo = src;
    drop.removeAttribute('aria-invalid');
    drop.innerHTML = src
      ? `<img src="${src}" alt="Your item preview"><button type="button" class="icon-btn glass remove" data-action="remove-photo" aria-label="Remove photo">${icon('x', 20)}</button>`
      : `<div class="state" style="padding:16px"><div class="state-art" style="width:60px;height:60px;border-radius:20px;animation:none">${icon('image', 28)}</div><p>Add a clear photo of your item</p></div>`;
    el.querySelector('#photo-err').textContent = '';
  };
  el.querySelectorAll('[data-photo]').forEach(i => i.addEventListener('change', async () => {
    const f = i.files[0]; if (!f) return;
    try { setPhoto(await compressImage(f)); vibrate(8); } catch (e) { toast(e.message, 'error'); }
    i.value = '';
  }));
  actions['remove-photo'] = () => setPhoto('');

  inputs['title-count'] = i => { el.querySelector('[data-counter]').textContent = `${i.value.length} / 60`; };

  const refreshMine = async () => {
    el.querySelector('[data-mine]').innerHTML = mineHTML(await listings.mine());
  };
  actions['remove-listing'] = async btn => {
    if (!await confirmSheet({ title: 'Remove this listing?', text: 'It will disappear from the marketplace.', confirmLabel: 'Remove', danger: true })) return;
    await listings.remove(btn.dataset.id); invalidateListCache(); await refreshMine(); toast('Listing removed', 'info');
  };

  forms.post = async f => {
    clearErrors(f);
    const banned = f.querySelector('[data-banned-msg]'); banned.hidden = true;
    const t = f.querySelector('#postTitle').value.trim(), w = f.querySelector('#postWant').value.trim();
    let first = null;
    const bad = (id, msg) => { first ||= id; setFieldError(f, id, msg); };
    if (!photo) { first = 'photo'; drop.setAttribute('aria-invalid', 'true'); el.querySelector('#photo-err').textContent = 'Please add a photo of your item.'; }
    if (t.length < 3) bad('postTitle', 'Give your item a title (3+ characters).');
    if (w.length < 3) bad('postWant', 'Say what you’d like in return.');
    if (first) { vibrate([10, 40, 10]); (f.querySelector('#' + first) || drop).scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const btn = f.querySelector('[type=submit]');
    setLoading(btn, true);
    try {
      await listings.create({ title: t, want: w, category: f.querySelector('#postCategory').value, hub: f.querySelector('#postHub').value, image: photo });
      invalidateListCache();
      confetti({ x: 50, y: 70, count: 26 });
      toast('Listing published!');
      f.reset(); setPhoto(''); el.querySelector('[data-counter]').textContent = '0 / 60';
      await refreshMine();
    } catch (e) {
      if (e.code === 'banned' || e.code === 'flagged') {
        banned.hidden = false; banned.querySelector('span').textContent = e.message; vibrate([30, 40, 30]);
        banned.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (e.code === 'flagged') location.reload();
      } else toast(e.message, 'error');
    } finally { setLoading(btn, false); }
  };
}
