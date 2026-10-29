import { $ } from '../utils/dom.js';

let timer;

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => t.classList.remove('is-visible'), 1800);
}
