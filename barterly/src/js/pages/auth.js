// Landing, onboarding carousel, sign up, log in, password reset.
import { icon } from '../icons.js';
import { actions, forms, inputs } from '../actions.js';
import { auth } from '../services/auth.js';
import { navigate } from '../router.js';
import { toast } from '../components/toast.js';
import { field, avatar, img, setFieldError, clearErrors, setLoading, brandRow } from '../components/ui.js';
import { countUp, esc, vibrate } from '../util.js';
import { people } from '../data/mock.js';
import { DEMO } from '../data/mock.js';

export const title = ({ params }) => ({ landing: 'Welcome', onboard: 'Get started', login: 'Log in', signup: 'Create account', forgot: 'Reset password', sent: 'Check your email' }[params.view] || 'Welcome');

const logo = () => `<div class="brand" style="margin-bottom:24px"><span class="brand-mark">${icon('swap', 20)}</span><span class="brand-name">Barterly</span></div>`;
const back = (to, label = 'Back') => `<a href="#/auth/${to}" class="btn-link row" style="gap:4px;margin:0 0 16px -8px;min-height:44px">${icon('left', 18)} ${label}</a>`;

const SLIDES = [
  { icon: 'camera', title: 'Post what you have', text: 'Snap a photo, say what you’d love in return. Takes under a minute.' },
  { icon: 'chat', title: 'Chat and agree', text: 'Negotiate safely inside the app. No numbers swapped, no pressure.' },
  { icon: 'shield', title: 'Swap with confidence', text: 'Verified traders, ratings and a dispute desk keep every swap honest.' },
];

const VIEWS = {
  landing() {
    const faces = people.slice(0, 6).map(p => avatar(p.photo, p.user, 36)).join('');
    const cards = [['a', '1596591606975-97ee553a1eb0', 'Fresh yams'], ['b', '1511707171634-5f897ff02aa9', 'Galaxy A14'], ['c', '1556911220-e15b29be8c8f', 'Cookware set']]
      .map(([c, id, t]) => `<div class="float-card ${c}">${img({ src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=300&q=70`, alt: '', label: t, lazy: false })}<span>${t}</span></div>`).join('');
    return `
    <div class="landing-hero">
      <div class="brand" style="color:#fff"><span class="brand-mark">${icon('swap', 20)}</span><span class="brand-name">Barterly</span></div>
      <div class="float-stage" aria-hidden="true">${cards}<span class="swap-orb">${icon('swap', 22)}</span></div>
      <h1 class="t-display reveal" style="--i:0">Trade what you have for what you need.</h1>
      <p class="reveal" style="--i:1;margin-top:12px">Swap goods and skills directly with people in your state. No cash needed.</p>
      <div class="row reveal" style="--i:2;margin-top:20px"><div class="faces">${faces}</div><span class="t-small" style="color:rgba(255,255,255,.9)">Thousands already swapping</span></div>
      <a href="#/auth/onboard" class="btn btn-block reveal" style="--i:3;margin-top:24px;background:#fff;color:#9f1239">Let’s get started ${icon('arrow', 18)}</a>
      <a href="#/auth/login" class="btn btn-block reveal" style="--i:4;margin-top:4px;color:#fff;font-weight:600;min-height:48px">I already have an account</a>
    </div>
    <div class="pad stack" style="--gap:24px;padding-bottom:40px">
      <div class="stat-grid">
        <div class="stat reveal" style="--i:1"><b data-count="12480">0</b><span>Swaps completed</span></div>
        <div class="stat reveal" style="--i:2"><b><i class="live-dot"></i><span data-online>1,236</span></b><span>People online now</span></div>
        <div class="stat reveal" style="--i:3"><b data-count="3950">0</b><span>Items ready to swap</span></div>
        <div class="stat reveal" style="--i:4"><b data-count="4">0</b><span>States, more coming</span></div>
      </div>
      <section class="stack" style="--gap:14px"><h2 class="t-heading">How it works</h2>
        ${SLIDES.map(s => `<div class="step"><span class="step-ic">${icon(s.icon, 20)}</span><p class="t-small t-soft"><b style="color:var(--text)">${s.title}.</b> ${s.text}</p></div>`).join('')}
      </section>
      <a href="#/auth/signup" class="btn btn-primary btn-block">Create your free account</a>
    </div>`;
  },

  onboard() {
    return `<div class="onboard">
      <div class="row between" style="padding:12px 20px 0"><span></span><a href="#/auth/signup" class="btn-link btn" style="--h:44px">Skip</a></div>
      <div class="onboard-track" data-track>
        ${SLIDES.map((s, i) => `<div class="onboard-slide" aria-label="Step ${i + 1} of 3">
          <div class="orb">${icon(s.icon, 64)}</div>
          <h1 class="t-title">${s.title}</h1><p class="t-soft" style="max-width:290px">${s.text}</p></div>`).join('')}
      </div>
      <div class="stack" style="padding:16px 24px calc(24px + var(--safe-bottom));--gap:20px">
        <div class="dots" data-dots aria-hidden="true">${SLIDES.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
        <button class="btn btn-primary btn-block" data-action="onboard-next" data-label>Next ${icon('arrow', 18)}</button>
      </div></div>`;
  },

  signup() {
    return `<div class="auth">${back('landing')}${logo()}
      <h1 class="t-title">Create your account</h1>
      <p class="t-soft t-small" style="margin:4px 0 24px">Start swapping in a minute.</p>
      <form data-form="signup" novalidate>
        ${field({ id: 'suName', label: 'Full name', autocomplete: 'name', placeholder: 'Ada Okafor', enterkeyhint: 'next' })}
        ${field({ id: 'suUser', label: 'Username', autocomplete: 'username', placeholder: 'ada_swaps', hint: 'Letters, numbers and underscores', enterkeyhint: 'next', maxlength: 20 })}
        ${field({ id: 'suEmail', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com', enterkeyhint: 'next' })}
        ${field({ id: 'suPass', label: 'Password', type: 'password', autocomplete: 'new-password', placeholder: '8+ characters', enterkeyhint: 'next',
          trailing: `<button type="button" class="trail" data-action="toggle-pass" data-target="suPass" aria-label="Show password">${icon('eye', 20)}</button>`,
          attrs: 'data-input="strength"' })}
        <div class="strength" data-strength data-s="0" aria-hidden="true" style="margin-top:-8px"><i></i><i></i><i></i><i></i></div>
        ${field({ id: 'suConf', label: 'Confirm password', type: 'password', autocomplete: 'new-password', placeholder: 'Repeat password', enterkeyhint: 'done' })}
        <button class="btn btn-primary btn-block" type="submit">Create account</button>
      </form>
      <p class="t-small t-soft center" style="margin-top:24px">Already have an account? <a href="#/auth/login" class="btn-link" style="font-weight:700;color:var(--brand-ink)">Log in</a></p></div>`;
  },

  login() {
    return `<div class="auth">${back('landing')}${logo()}
      <h1 class="t-title">Welcome back</h1>
      <p class="t-soft t-small" style="margin:4px 0 24px">Log in to keep swapping.</p>
      <form data-form="login" novalidate>
        ${field({ id: 'liEmail', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com', enterkeyhint: 'next' })}
        ${field({ id: 'liPass', label: 'Password', type: 'password', autocomplete: 'current-password', placeholder: 'Your password', enterkeyhint: 'go',
          trailing: `<button type="button" class="trail" data-action="toggle-pass" data-target="liPass" aria-label="Show password">${icon('eye', 20)}</button>` })}
        <div style="text-align:right;margin-top:-6px"><a href="#/auth/forgot" class="btn-link btn" style="--h:40px;font-size:var(--fs-small)">Forgot password?</a></div>
        <button class="btn btn-primary btn-block" type="submit">Log in</button>
        <button class="btn btn-soft btn-block" type="button" data-action="use-demo">${icon('sparkles', 18)} Try the demo account</button>
      </form>
      <p class="t-small t-soft center" style="margin-top:24px">New here? <a href="#/auth/signup" class="btn-link" style="font-weight:700;color:var(--brand-ink)">Create an account</a></p></div>`;
  },

  forgot() {
    return `<div class="auth">${back('login', 'Back to log in')}${logo()}
      <h1 class="t-title">Reset your password</h1>
      <p class="t-soft t-small" style="margin:4px 0 24px">Enter your email and we’ll send you a reset link.</p>
      <form data-form="forgot" novalidate>
        ${field({ id: 'fpEmail', label: 'Email', type: 'email', inputmode: 'email', autocomplete: 'email', placeholder: 'you@example.com', enterkeyhint: 'send' })}
        <button class="btn btn-primary btn-block" type="submit">Send reset link</button>
      </form></div>`;
  },

  sent() {
    return `<div class="auth center" style="padding-top:96px">
      <div class="success-ic">${icon('mail', 38)}</div>
      <h1 class="t-title">Check your email</h1>
      <p class="t-soft t-small" style="margin:8px 0 24px">If an account exists for that email, a reset link is on its way.</p>
      <a href="#/auth/login" class="btn btn-primary btn-block">Back to log in</a></div>`;
  },
};

export const render = ({ params }) => (VIEWS[params.view] || VIEWS.landing)();

/* ---------- Behaviour ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const strength = pw => (pw.length >= 8) + (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) + /\d/.test(pw) + (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14);

actions['toggle-pass'] = btn => {
  const input = document.getElementById(btn.dataset.target);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.innerHTML = icon(show ? 'eyeoff' : 'eye', 20);
  btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
};
actions['use-demo'] = btn => {
  const f = btn.closest('form');
  f.querySelector('#liEmail').value = DEMO.email;
  f.querySelector('#liPass').value = DEMO.password;
  clearErrors(f); vibrate(8);
  f.requestSubmit();
};
inputs.strength = el => {
  const s = el.closest('form').querySelector('[data-strength]');
  s.dataset.s = el.value ? Math.max(1, strength(el.value)) : 0;
};
actions['onboard-next'] = btn => {
  const track = btn.closest('.onboard').querySelector('[data-track]');
  const i = Math.round(track.scrollLeft / track.clientWidth);
  if (i >= SLIDES.length - 1) navigate('/auth/signup');
  else track.scrollTo({ left: (i + 1) * track.clientWidth, behavior: 'smooth' });
};

forms.signup = async form => {
  clearErrors(form);
  const v = id => form.querySelector('#' + id).value.trim();
  const pw = form.querySelector('#suPass').value;
  let ok = true, first = null;
  const bad = (id, msg) => { ok = false; first ||= id; setFieldError(form, id, msg); };
  if (v('suName').length < 2) bad('suName', 'Enter your full name.');
  const user = v('suUser').replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{3,20}$/.test(user)) bad('suUser', 'Use 3–20 letters, numbers or underscores.');
  if (!EMAIL_RE.test(v('suEmail'))) bad('suEmail', 'Enter a valid email address.');
  if (pw.length < 8) bad('suPass', 'Password must be at least 8 characters.');
  if (form.querySelector('#suConf').value !== pw) bad('suConf', 'Passwords don’t match.');
  if (!ok) { form.querySelector('#' + first).focus(); vibrate([10, 40, 10]); return; }
  const btn = form.querySelector('[type=submit]');
  setLoading(btn, true);
  try {
    const u = await auth.signup({ name: v('suName'), username: user, email: v('suEmail'), password: pw });
    navigate('/home'); toast(`Welcome, ${u.name.split(' ')[0]}!`);
  } catch (e) {
    setLoading(btn, false);
    if (e.field) { setFieldError(form, { username: 'suUser', email: 'suEmail' }[e.field] || 'suEmail', e.message); form.querySelector('[aria-invalid]')?.focus(); }
    else toast(e.message, 'error');
  }
};

forms.login = async form => {
  clearErrors(form);
  const email = form.querySelector('#liEmail').value.trim(), pw = form.querySelector('#liPass').value;
  let ok = true;
  if (!EMAIL_RE.test(email)) { ok = false; setFieldError(form, 'liEmail', 'Enter a valid email address.'); }
  if (!pw) { ok = false; setFieldError(form, 'liPass', 'Enter your password.'); }
  if (!ok) { form.querySelector('[aria-invalid]').focus(); vibrate([10, 40, 10]); return; }
  const btn = form.querySelector('[type=submit]');
  setLoading(btn, true);
  try {
    const u = await auth.login({ email, password: pw });
    navigate('/home'); toast(`Welcome back, ${u.name.split(' ')[0]}!`);
  } catch (e) {
    setLoading(btn, false);
    if (e.field) { setFieldError(form, e.field === 'email' ? 'liEmail' : 'liPass', e.message); form.querySelector('[aria-invalid]')?.focus(); }
    else toast(e.message, 'error');
  }
};

forms.forgot = async form => {
  clearErrors(form);
  const email = form.querySelector('#fpEmail').value.trim();
  if (!EMAIL_RE.test(email)) { setFieldError(form, 'fpEmail', 'Enter a valid email address.'); form.querySelector('#fpEmail').focus(); return; }
  const btn = form.querySelector('[type=submit]');
  setLoading(btn, true);
  try { await auth.forgot({ email }); navigate('/auth/sent'); }
  catch (e) { setLoading(btn, false); toast(e.message, 'error'); }
};

export function mount(el, { params }) {
  if (params.view === 'landing') {
    el.querySelectorAll('[data-count]').forEach((n, i) => setTimeout(() => countUp(n, +n.dataset.count, { duration: 1400 }), 250 + i * 120));
    const online = el.querySelector('[data-online]');
    const t = setInterval(() => { online.textContent = (1200 + Math.floor(Math.random() * 90)).toLocaleString(); }, 3500);
    return () => clearInterval(t);
  }
  if (params.view === 'onboard') {
    const track = el.querySelector('[data-track]'), dots = el.querySelectorAll('[data-dots] i'), label = el.querySelector('[data-label]');
    track.addEventListener('scroll', () => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      dots.forEach((d, n) => d.classList.toggle('on', n === i));
      label.innerHTML = i === SLIDES.length - 1 ? `Create account ${icon('arrow', 18)}` : `Next ${icon('arrow', 18)}`;
    }, { passive: true });
  }
  el.querySelector('input')?.focus({ preventScroll: true });
}
