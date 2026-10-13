import { read, write } from './util.js';

const KEY = 'barterly:theme';
const mq = matchMedia('(prefers-color-scheme: dark)');
let mode = read(KEY, 'system');

function resolved() { return mode === 'system' ? (mq.matches ? 'dark' : 'light') : mode; }

export function applyTheme() {
  document.documentElement.dataset.theme = resolved();
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.getElementById('themeColor')?.setAttribute('content', bg || '#f6f7fb');
}

export const getThemeMode = () => mode;
export function setThemeMode(next) {
  mode = next; write(KEY, next); applyTheme();
}

mq.addEventListener?.('change', () => { if (mode === 'system') applyTheme(); });
