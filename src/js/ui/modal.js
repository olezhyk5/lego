import { t } from '../i18n/index.js';

// Попап з опціями. Один на екземпляр (data-ref="modal" у розмітці екземпляра), вміст підставляє той, хто відкриває.
// Зміни застосовує лише onSave: «Скасувати», хрестик, оверлей і Esc закривають без змін.

/**
 * @typedef {{
 *   title: string,
 *   body: string,
 *   onOpen?: (body: HTMLElement) => void,
 *   onSave?: (body: HTMLElement) => boolean | void,
 *   saveLabel?: string,
 * }} ModalOptions
 *   title  — уже перекладений заголовок (t(...))
 *   body   — HTML-рядок з ui/templates.js
 *   saveLabel — ключ підпису кнопки підтвердження (за замовчуванням modal.save)
 *   onOpen(bodyEl) — заповнити поля / повісити обробники
 *   onSave(bodyEl) — застосувати зміни; поверне false → попап лишається відкритим (напр. помилка вводу)
 */

/** @param {(name: string) => any} ref пошук data-ref усередині екземпляра */
export function createModal(ref) {
  const dialog = ref('modal');
  const bodyEl = ref('modalBody');
  let current = null;

  function close() {
    current = null;
    if (dialog.open) dialog.close();
    bodyEl.innerHTML = '';
  }

  /** @param {ModalOptions} options */
  function open({ title, body, onOpen, onSave, saveLabel = 'modal.save' }) {
    ref('modalTitle').textContent = title;
    ref('modalSubmit').textContent = t(saveLabel);
    bodyEl.innerHTML = body;
    current = { onSave };
    if (onOpen) onOpen(bodyEl);
    dialog.showModal();
  }

  // Хрестик, оверлей і «Скасувати» мають data-modal-close
  dialog.addEventListener('click', e => {
    if (e.target.closest('[data-modal-close]')) close();
  });

  // Esc: браузер закрив би діалог сам — закриваємо своїм шляхом, щоб очистити стан
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    close();
  });

  // «Зберегти» — submit форми, тож Enter у полі теж зберігає
  ref('modalForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!current) return;
    if (current.onSave && current.onSave(bodyEl) === false) return;
    close();
  });

  return { open, close };
}
