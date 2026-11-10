// Підготовка DOM для UI-тестів (jsdom). Не імпортувати в робочий код.
import { vi } from 'vitest';
import { shellMarkup } from './templates/shell.js';
import { createScope } from './app.js';
import { createModal } from './modal.js';
import { createToast } from './toast.js';
import { createStore } from '../core/store.js';

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

const UI_ALL = { presets: true, export: true, files: true, locale: true };

// Розмітка екземпляра (як у createConfigurator) у <div data-lego>, чистий localStorage
export function setupDom(ui = UI_ALL) {
  polyfillDialog();
  localStorage.clear();
  document.body.innerHTML = `<div data-lego>${shellMarkup('test', ui)}</div>`;
  return document.querySelector('[data-lego]');
}

// Елемент з data-ref="name" (статичний хук розмітки)
export const ref = name => document.querySelector(`[data-ref="${name}"]`);

/**
 * Контекст екземпляра для модулів ui/ (див. ui/app.js) поверх розмітки setupDom: свій store у пам'яті,
 * справжні попап і тост, update / fit / loadProject / changeLocale — vi.fn().
 */
export function createTestApp(overrides = {}) {
  const root = document.querySelector('[data-lego]');
  const scope = createScope(root);
  const modal = createModal(scope.ref);
  return {
    root,
    uid: 'test',
    store: createStore(),
    ...scope,
    update: vi.fn(),
    fit: vi.fn(),
    loadProject: vi.fn(),
    changeLocale: vi.fn(),
    openModal: modal.open,
    toast: createToast(scope.ref('toast')),
    viewer: null,
    ...overrides,
  };
}

// Подія, як від користувача: el.value = v + input/change, що спливає до делегованих обробників
export function typeInto(el, value, type = 'input') {
  el.value = value;
  el.dispatchEvent(new Event(type, { bubbles: true }));
}

export const click = el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
