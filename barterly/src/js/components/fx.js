import { reducedMotion, vibrate } from '../util.js';

const COLORS = ['#e11d48', '#f97316', '#fbbf24', '#22c55e', '#38bdf8', '#a78bfa'];

/** Confetti burst from a point inside the app frame (x/y as % of the frame). */
export function confetti({ x = 50, y = 40, count = 34 } = {}) {
  vibrate([12, 40, 18]);
  if (reducedMotion()) return;
  const host = document.getElementById('fx');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 190;
    p.style.cssText = `--x:${x}%;--y:${y}%;--c:${COLORS[i % COLORS.length]};--w:${6 + Math.random() * 5}px;--h:${8 + Math.random() * 9}px;` +
      `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d + 120}px;--rot:${Math.random() * 720 - 360}deg;--t:${1.1 + Math.random() * .7}s`;
    frag.append(p);
  }
  host.append(frag);
  setTimeout(() => { host.replaceChildren(); }, 2100);
}
