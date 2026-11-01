// Підготовка DOM для UI-тестів (jsdom). Не імпортувати в робочий код.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const HTML = readFileSync(join(import.meta.dirname, '../../../index.html'), 'utf8');
const BODY = HTML.slice(HTML.indexOf('<body>') + 6, HTML.indexOf('</body>'));

// У jsdom немає showModal / close у <dialog>
function polyfillDialog() {
  const proto = window.HTMLDialogElement.prototype;
  if (proto.showModal) return;
  proto.showModal = function () {
    this.open = true;
  };
  proto.close = function () {
    this.open = false;
  };
}

// Розмітка сторінки з index.html, чистий localStorage
export function setupDom() {
  polyfillDialog();
  localStorage.clear();
  document.body.innerHTML = BODY;
}

// Подія, як від користувача: el.value = v + input/change, що спливає до делегованих обробників
export function typeInto(el, value, type = 'input') {
  el.value = value;
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

export const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
