import { icon } from '../icons.js';
import { actions, forms } from '../actions.js';
import { auth } from '../services/auth.js';
import { trustScore } from '../services/profile.js';
import { store } from '../store.js';
import { avatar, field, setFieldError, clearErrors, setLoading } from '../components/ui.js';
import { openVerification } from '../components/verify.js';
import { confirmSheet, openSheet } from '../components/sheet.js';
import { toast } from '../components/toast.js';
import { setThemeMode, getThemeMode } from '../theme.js';
import { navigate } from '../router.js';
import { esc, vibrate } from '../util.js';

export const title = () => 'Profile';

const MODES = [['system', 'Auto', 'auto'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']];
const headHTML = () => {
  const p = store.state.profile, score = trustScore(p);
  return `
  <div class="card profile-head reveal">
    <div class="trust" data-trust="${score}">
      <svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="trustGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#be123c"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs>
        <circle class="bg" cx="50" cy="50" r="46"/><circle class="fg" cx="50" cy="50" r="46" data-fg/></svg>
      ${avatar(p.photo, p.username, 90)}
      <span class="score">Trust ${score}</span>
    </div>
    <h1 class="t-heading">@${esc(p.username)}</h1>
    <p class="t-small t-muted" style="margin-top:2px">Legal name: <b style="color:var(--text)">${esc(p.legalName)}</b></p>
    <div class="row" style="justify-content:center;gap:8px;margin-top:12px;flex-wrap:wrap">
      <span class="pill ${p.isVerified ? 'pill-success' : 'pill-warn'}">${icon(p.isVerified ? 'checkc' : 'alert', 13)} ${p.isVerified ? 'Identity verified' : 'Unverified'}</span>
      <span class="pill ${p.flagged ? 'pill-danger' : 'pill-brand'}">${p.flagged ? 'Account flagged' : 'Good standing'} · ${p.strikes}/3 strikes</span>
    </div>
    <div class="stat-grid" style="margin-top:16px"><div class="stat"><b>${p.tradesCount}</b><span>Trades</span></div><div class="stat"><b>${p.rating ? p.rating.toFixed(1) + ' ★' : 'New'}</b><span>Rating</span></div></div>
    ${p.isVerified ? '' : `<button class="btn btn-primary btn-block" style="margin-top:16px" data-action="verify">${icon('id', 20)} Verify my identity</button>`}
  </div>`;
};

export function render() {
  const p = store.state.profile, user = store.state.user, mode = getThemeMode();
  return `
  <header class="topbar"><h1 class="title grow">Profile</h1></header>
  <div class="pad stack" style="--gap:16px;padding-top:4px">
    <div data-head>${headHTML()}</div>

    <section class="card settings-card reveal" style="--i:1">
      <h2 class="t-heading" style="margin-bottom:12px">Appearance</h2>
      <div class="segmented" role="group" aria-label="Theme" data-seg style="--n:3;--i:${MODES.findIndex(m => m[0] === mode)}">
        <span class="thumb" aria-hidden="true"></span>
        ${MODES.map(([v, l, ic]) => `<button type="button" data-action="set-theme" data-mode="${v}" aria-pressed="${v === mode}">${icon(ic, 17)} ${l}</button>`).join('')}
      </div>
    </section>

    <section class="card settings-card reveal" style="--i:2">
      <h2 class="t-heading" style="margin-bottom:12px">Account</h2>
      <form data-form="username" novalidate>
        ${field({ id: 'setUser', label: 'Display username', value: p.username, autocomplete: 'username', maxlength: 20, enterkeyhint: 'done' })}
        ${field({ id: 'setLegal', label: 'Legal name (locked after verification)', value: p.legalName, required: false, attrs: 'disabled' })}
        <p class="hint t-caption t-muted" style="margin-top:-6px">Email: ${esc(user.email)}</p>
        <button class="btn btn-primary btn-block" type="submit">Save changes</button>
      </form>
    </section>

    <section class="card settings-card reveal" style="--i:3">
      <h2 class="t-heading" style="margin-bottom:12px">Update password</h2>
      <form data-form="password" novalidate>
        ${field({ id: 'pwCur', label: 'Current password', type: 'password', autocomplete: 'current-password' })}
        ${field({ id: 'pwNew', label: 'New password', type: 'password', autocomplete: 'new-password', hint: '8+ characters' })}
        ${field({ id: 'pwConf', label: 'Confirm new password', type: 'password', autocomplete: 'new-password' })}
        <button class="btn btn-outline btn-block" type="submit">Update password</button>
      </form>
    </section>

    <section class="card settings-card reveal" style="--i:4">
      <div class="row" style="margin-bottom:12px">${icon('headset', 22, 't-brand')}<h2 class="t-heading">Help & support</h2></div>
      <details class="acc"><summary>How does trade-by-barter work?${icon('down', 18)}</summary><p class="acc-body">List your item, say what you want in return, chat in the app and complete the swap when both of you confirm.</p></details>
      <details class="acc"><summary>Why do I need to verify my ID?${icon('down', 18)}</summary><p class="acc-body">To keep scammers out and build trust between swappers in Lagos, Abuja, Benin City and Port Harcourt.</p></details>
      <button class="btn btn-soft btn-block" style="margin-top:12px" data-action="contact-support">${icon('send', 18)} Contact support</button>
    </section>

    <button class="btn btn-danger-soft btn-block reveal" style="--i:5" data-action="logout">${icon('logout', 20)} Log out</button>
    <p class="t-caption t-muted center">Barterly · demo build</p>
  </div>`;
}

export function mount(el) {
  const head = el.querySelector('[data-head]');
  const animateRing = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    const t = head.querySelector('[data-trust]'), fg = head.querySelector('[data-fg]');
    if (fg) fg.style.strokeDashoffset = 289 * (1 - +t.dataset.trust / 100);
  }));
  animateRing();

  const off = store.on((_, patch) => { if ('profile' in patch) { head.innerHTML = headHTML(); animateRing(); } });

  actions.verify = () => openVerification();
  actions['set-theme'] = btn => {
    setThemeMode(btn.dataset.mode); vibrate(8);
    const seg = el.querySelector('[data-seg]');
    seg.style.setProperty('--i', ['system', 'light', 'dark'].indexOf(btn.dataset.mode));
    seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === btn));
  };
  actions['contact-support'] = () => {
    const s = openSheet({
      title: 'Contact support',
      html: `<form data-sform class="stack" style="--gap:12px" novalidate>
        <div class="field"><label for="supMsg">How can we help?</label><textarea class="textarea" id="supMsg" rows="4" placeholder="Describe the issue…" data-autofocus></textarea><p class="field-error" id="supMsg-err" role="alert"></p></div>
        <button class="btn btn-primary btn-block" type="submit">Send message</button></form>`,
    });
    s.el.addEventListener('submit', async e => {
      e.preventDefault();
      if (s.$('#supMsg').value.trim().length < 5) return setFieldError(s.el, 'supMsg', 'Tell us a little more.');
      setLoading(s.$('[type=submit]'), true);
      await new Promise(r => setTimeout(r, 700));
      s.close(); toast('Message sent. We reply within 2 hours.');
    });
  };
  actions.logout = async () => {
    if (!await confirmSheet({ title: 'Log out?', text: 'You can log back in any time.', confirmLabel: 'Log out', danger: true })) return;
    auth.logout(); navigate('/auth/landing', { replace: true }); toast('Logged out', 'info');
  };

  forms.username = async f => {
    clearErrors(f);
    const v = f.querySelector('#setUser').value.trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{3,20}$/.test(v)) return setFieldError(f, 'setUser', 'Use 3–20 letters, numbers or underscores.');
    const btn = f.querySelector('[type=submit]'); setLoading(btn, true);
    try { await auth.changeUsername(v); toast('Account saved'); }
    catch (e) { e.field ? setFieldError(f, 'setUser', e.message) : toast(e.message, 'error'); }
    finally { setLoading(btn, false); }
  };

  forms.password = async f => {
    clearErrors(f);
    const cur = f.querySelector('#pwCur').value, nw = f.querySelector('#pwNew').value, cf = f.querySelector('#pwConf').value;
    let ok = true;
    if (!cur) { ok = false; setFieldError(f, 'pwCur', 'Enter your current password.'); }
    if (nw.length < 8) { ok = false; setFieldError(f, 'pwNew', 'New password needs 8+ characters.'); }
    if (nw !== cf) { ok = false; setFieldError(f, 'pwConf', 'Passwords don’t match.'); }
    if (!ok) return vibrate([10, 40, 10]);
    const btn = f.querySelector('[type=submit]'); setLoading(btn, true);
    try { await auth.changePassword({ current: cur, next: nw }); f.reset(); toast('Password updated'); }
    catch (e) { e.field ? setFieldError(f, 'pwCur', e.message) : toast(e.message, 'error'); }
    finally { setLoading(btn, false); }
  };

  return off;
}
