import { $ } from '../utils/dom.js';

// Попап з опціями. Один екземпляр (#modal в index.html), вміст підставляє той, хто відкриває.
// Зміни застосовує лише onSave: «Скасувати», хрестик, оверлей і Esc закривають без змін.

let current = null;

// openModal({ title, body, onOpen, onSave })
//   title  — уже перекладений заголовок (t(...))
//   body   — HTML-рядок з ui/templates.js
//   onOpen(bodyEl) — заповнити поля / повісити обробники
//   onSave(bodyEl) — застосувати зміни; поверне false → попап лишається відкритим (напр. помилка вводу)
export function openModal({ title, body, onOpen, onSave }) {
  const dialog = $('#modal');
  const bodyEl = $('#modalBody');
  $('#modalTitle').textContent = title;
  bodyEl.innerHTML = body;
  current = { onSave };
  if (onOpen) onOpen(bodyEl);
  dialog.showModal();
}

export function closeModal() {
  const dialog = $('#modal');
  current = null;
  if (dialog.open) dialog.close();
  $('#modalBody').innerHTML = '';
}

export function initModal() {
  const dialog = $('#modal');

  // Хрестик, оверлей і «Скасувати» мають data-modal-close
  dialog.addEventListener('click', e => {
    if (e.target.closest('[data-modal-close]')) closeModal();
  });

  // Esc: браузер закрив би діалог сам — закриваємо своїм шляхом, щоб очистити стан
  dialog.addEventListener('cancel', e => {
    e.preventDefault();
    closeModal();
  });

  // «Зберегти» — submit форми, тож Enter у полі теж зберігає
  $('#modalForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!current) return;
    if (current.onSave && current.onSave($('#modalBody')) === false) return;
    closeModal();
  });
}
