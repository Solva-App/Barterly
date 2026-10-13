import { icon } from '../icons.js';
import { esc } from '../util.js';

const ICONS = { success: 'checkc', error: 'alert', info: 'info' };

export function toast(message, type = 'success') {
  const host = document.getElementById('toasts');
  while (host.children.length >= 3) host.firstElementChild.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${icon(ICONS[type] || 'info', 18)}<span>${esc(message)}</span>`;
  host.append(el);
  const out = () => { el.classList.add('out'); setTimeout(() => el.remove(), 320); };
  const t = setTimeout(out, 3200);
  el.addEventListener('click', () => { clearTimeout(t); out(); });
}
