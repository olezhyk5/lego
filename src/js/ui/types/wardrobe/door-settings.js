import { t } from '../../../i18n/index.js';

// Попап «Налаштування дверей». Поки порожній: полів і змін у проєкті ще немає.
/** @param {import('../../app.js').App} app */
export function initDoorSettings({ ref, openModal }) {
  ref('doorSettings').addEventListener('click', () => {
    openModal({ title: t('sidebar.doorSettings'), body: '' });
  });
}
